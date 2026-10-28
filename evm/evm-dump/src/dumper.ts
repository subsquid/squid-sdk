import {
    CALL_FRAME_VALIDATION_MODES,
    type CallFrameValidationMode,
    CONSENSUS_ANCHOR_VALIDATION_MODES,
    type ConsensusAnchorRule,
    type ConsensusAnchorValidationMode,
    DEFAULT_CONSENSUS_ANCHOR_RULES,
    parseConsensusAnchorRules,
    Rpc,
    EvmRpcDataSource,
    EvmRpcClient,
} from '@subsquid/evm-rpc'
import {type RawBlock, toRawBlock} from '@subsquid/evm-normalization'
import {def} from '@subsquid/util-internal'
import {
    type Command,
    Dumper,
    type DumperOptions,
    ErrorMessage,
    Option,
    type Range,
    positiveInt,
} from '@subsquid/util-internal-dump-cli'
import {
    addStreamOptions,
    connectNatsStream,
    createStreamMetrics,
    getStreamSettings,
    RawStreamSource,
    type StreamOptions,
} from '@subsquid/util-internal-dump-stream'
import {findUnverifiedParts} from './stream/components'
import {getLineFormat} from './stream/format'
import {createRpcSource} from './stream/rpc-source'
import {createLineVerifier} from './stream/verify'

interface Options extends DumperOptions, StreamOptions {
    retryInternalServerErrors?: boolean
    finalityConfirmation?: number
    headPollInterval?: number
    withReceipts?: boolean
    withTraces?: boolean
    withStatediffs?: boolean
    withBlockAccessLists?: boolean
    useTraceApi?: boolean
    useDebugApiForStatediffs?: boolean
    useDebugTraceBlockByNumber?: boolean
    verifyBlockHash?: boolean
    verifyExtDataHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyWithdrawalsRoot?: boolean
    verifyLogsBloom?: boolean
    verifyBlockAccessListHash?: boolean
    callFrameValidation?: CallFrameValidationMode
    consensusAnchorValidation?: ConsensusAnchorValidationMode
    consensusAnchorRules?: ConsensusAnchorRule[]
    skipLogIndexCheck?: boolean
    skipCumulativeGasUsedCheck?: boolean
    useGasUsedForReceiptsRoot?: boolean
}

export class EvmDumper extends Dumper<RawBlock, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for EVM-based chains')
        program.option(
            '--retry-internal-server-errors',
            'If set, the internal server errors from the RPC endpoint will be treated as retryable',
        )
        program.option('--finality-confirmation <number>', 'Finality offset from the head of a chain', positiveInt)
        program.option(
            '--head-poll-interval <ms>',
            'How long to wait before asking for the chain head again, once caught up with it',
            positiveInt,
            1000,
        )
        program.option('--with-receipts', 'Fetch transaction receipt data')
        program.option('--with-traces', 'Fetch EVM call traces')
        program.option('--with-statediffs', 'Fetch EVM state updates')
        program.option('--with-block-access-lists', 'Fetch EIP-7928 block access lists of blocks that commit to one')
        program.option('--use-trace-api', 'Use trace_* API for statediffs and call traces')
        program.option(
            '--use-debug-api-for-statediffs',
            'Use debug prestateTracer to fetch statediffs (by default will use trace_* api)',
        )
        program.option(
            '--use-debug-trace-block-by-number',
            'Use debug_traceBlockByNumber instead of debug_traceBlockByHash',
        )
        program.option('--verify-block-hash', 'Verify block header against block hash')
        program.option(
            '--verify-ext-data-hash',
            'Verify block extData payload against the extDataHash header commitment',
        )
        program.option('--verify-tx-sender', 'Check if transaction sender matches sender recovered from signature')
        program.option('--verify-tx-root', 'Verify block transactions against transactions root')
        program.option('--verify-receipts-root', 'Verify block receipts against receipts root')
        program.option('--verify-withdrawals-root', 'Verify block withdrawals against withdrawals root')
        program.option('--verify-logs-bloom', 'Verify block logs against logs bloom')
        program.option(
            '--verify-block-access-list-hash',
            'Verify block access lists against the blockAccessListHash header commitment',
        )
        program.addOption(
            new Option(
                '--call-frame-validation <mode>',
                'Validate semantic call-frame consistency; reject requires --verify-tx-root and --verify-tx-sender',
            )
                .choices([...CALL_FRAME_VALIDATION_MODES])
                .default('off'),
        )
        program.addOption(
            new Option(
                '--consensus-anchor-validation <mode>',
                'Check debug call frames and state diffs against receipt status, gasUsed and fees; ' +
                    'reject marks a failing block invalid so it is fetched again, and requires --verify-receipts-root, ' +
                    '--verify-tx-root, --verify-tx-sender and the cumulative gas check',
            )
                .choices([...CONSENSUS_ANCHOR_VALIDATION_MODES])
                .default('off'),
        )
        program.addOption(
            new Option(
                '--consensus-anchor-rules <list>',
                'Comma-separated consensus anchor rules: status, gas, system-gas, system-fee',
            )
                .argParser(parseConsensusAnchorRules)
                .default([...DEFAULT_CONSENSUS_ANCHOR_RULES], DEFAULT_CONSENSUS_ANCHOR_RULES.join(',')),
        )
        program.option('--skip-log-index-check', 'Do not check log indices within a block are sequential')
        program.option(
            '--skip-cumulative-gas-used-check',
            'Do not check cumulativeGasUsed consistency across transactions',
        )
        program.option(
            '--use-gas-used-for-receipts-root',
            'Use gasUsed instead of cumulativeGasUsed for receipts root calculation',
        )
        addStreamOptions(
            program,
            'The stream is not trusted: a block is taken only when its header hashes to the hash known from RPC, ' +
                'down the parent links from the finalized head, and passes every --verify-* check that is on. ' +
                'Any other block is fetched from RPC, which is every block of a chain whose header hashing is not supported. ' +
                'Transactions are tied to the header only by --verify-tx-root, receipts and logs only by ' +
                '--with-receipts with --verify-receipts-root, a logs bloom covers just addresses and topics. ' +
                'Call traces and state diffs can not be tied to the header at all, the same as with RPC.',
        )
    }

    protected getLoggingNamespace(): string {
        return 'sqd:evm-dump'
    }

    protected validateOptions(): void {
        this.rawStream()
    }

    protected getParentBlockHash(block: RawBlock): string {
        return block.parentHash
    }

    protected getBlockTimestamp(block: RawBlock): number {
        return Number(block.timestamp) || 0
    }

    @def
    protected rpc(): EvmRpcClient {
        let options = this.options()
        return new EvmRpcClient({
            url: options.endpoint,
            capacity: options.endpointCapacity || 10,
            maxBatchCallSize: options.endpointMaxBatchCallSize,
            rateLimit: options.endpointRateLimit,
            requestTimeout: 180_000,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            fixUnsafeIntegers: this.fixUnsafeIntegers(),
            retryInternalServerErrors: options.retryInternalServerErrors,
        })
    }

    @def
    private evmRpc(): Rpc {
        return new Rpc({
            client: this.rpc(),
            finalityConfirmation: this.options().finalityConfirmation,
            verifyBlockHash: this.options().verifyBlockHash,
            verifyExtDataHash: this.options().verifyExtDataHash,
            verifyTxSender: this.options().verifyTxSender,
            verifyTxRoot: this.options().verifyTxRoot,
            verifyReceiptsRoot: this.options().verifyReceiptsRoot,
            verifyWithdrawalsRoot: this.options().verifyWithdrawalsRoot,
            verifyLogsBloom: this.options().verifyLogsBloom,
            verifyBlockAccessListHash: this.options().verifyBlockAccessListHash,
            callFrameValidation: this.options().callFrameValidation,
            consensusAnchorValidation: this.options().consensusAnchorValidation,
            consensusAnchorRules: this.options().consensusAnchorRules,
            checkLogIndex: !this.options().skipLogIndexCheck,
            checkCumulativeGasUsed: !this.options().skipCumulativeGasUsedCheck,
            useGasUsedForReceiptsRoot: this.options().useGasUsedForReceiptsRoot,
        })
    }

    @def
    private dataSource(): EvmRpcDataSource {
        assertConsensusAnchorInputs(this.options())
        return new EvmRpcDataSource({
            rpc: this.evmRpc(),
            headPollInterval: this.options().headPollInterval,
            req: {
                transactions: true,
                logs: !this.options().withReceipts,
                receipts: this.options().withReceipts,
                traces: this.options().withTraces,
                stateDiffs: this.options().withStatediffs,
                blockAccessLists: this.options().withBlockAccessLists,
                useDebugApiForStateDiffs: this.options().useDebugApiForStatediffs,
                useDebugTraceBlockByNumber: this.options().useDebugTraceBlockByNumber,
                useTraceApi: this.options().useTraceApi,
                debugTraceTimeout: '60s',
            },
        })
    }

    protected async getLastFinalizedBlockNumber(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }

    @def
    private rawStream(): RawStreamSource<RawBlock> | undefined {
        let stream = getStreamSettings(this.options())
        if (stream == null) return undefined

        let options = this.options()
        assertStreamInputs(options)

        let {url, dataset} = stream
        let rpc = this.evmRpc()

        let unverified = findUnverifiedParts(options)
        if (unverified.length > 0) {
            this.log().warn(
                `nothing ties these parts of a streamed block to its verified header: ${unverified.join(', ')}. ` +
                    'A stream that changes, drops or adds them is not detected, turn the named options on to close the gap',
            )
        }

        return new RawStreamSource({
            rpc: createRpcSource(rpc, this.dataSource()),
            connect: () => connectNatsStream({url, dataset, name: 'evm-dump'}),
            format: getLineFormat(options),
            // The chain id is asked for once, `Rpc` remembers it
            getVerifier: async () => createLineVerifier(await rpc.getChainUtils(), options),
            headPollInterval: options.headPollInterval ?? 1000,
            waitTimeout: stream.waitTimeout,
            metrics: createStreamMetrics(this.prometheus()),
            log: this.log().child('stream'),
        })
    }

    protected async *getBlocks(range: Range, prevHash?: string): AsyncIterable<RawBlock[]> {
        let stream = this.rawStream()
        if (stream) {
            yield* stream.getBlocks(range, prevHash)
            return
        }

        for await (let batch of this.dataSource().getFinalizedStream(range)) {
            yield batch.blocks.map(toRawBlock)
        }
    }
}

/**
 * A streamed block is taken only after the checks the dumper would have made itself,
 * and the stream verifier does not make these yet
 */
function assertStreamInputs(options: Options): void {
    if (options.withBlockAccessLists) {
        throw new ErrorMessage('--stream-url does not support --with-block-access-lists yet')
    }

    let isAnchorValidationOn = (options.consensusAnchorValidation ?? 'off') !== 'off'
    if (isAnchorValidationOn) {
        throw new ErrorMessage('--stream-url does not support --consensus-anchor-validation yet')
    }
}

/**
 * Consensus anchor validation checks debug call frames against receipts, so a dump that
 * fetches neither, or uses the trace API, would pass every block unchecked.
 */
function assertConsensusAnchorInputs(options: Options): void {
    if ((options.consensusAnchorValidation ?? 'off') === 'off') return
    if (!options.withTraces || !options.withReceipts || options.useTraceApi) {
        throw new Error(
            '--consensus-anchor-validation requires --with-traces and --with-receipts, and does not support --use-trace-api',
        )
    }
}
