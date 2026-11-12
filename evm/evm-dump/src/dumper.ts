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
    deriveTotalDifficulty?: boolean
    hyperliquidSystemTxOracle?: string
    parentTotalDifficulty?: bigint
}

// A warning about the provider's totalDifficulty disagreeing with the derived one, at most this often
const TD_MISMATCH_WARNING_INTERVAL_MS = 10 * 60 * 1000

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
        program.option(
            '--hyperliquid-system-tx-oracle <url>',
            'HyperEVM: an endpoint that serves eth_getSystemTxsByBlockHash (the official RPC). Each block is held ' +
                'to its system transactions, compared by sender and nonce, and fetched again when it lacks one; ' +
                'when the oracle gives no answer the block is taken without this check and a warning is logged',
        )
        program.option(
            '--derive-total-difficulty',
            "Write each block's totalDifficulty as its parent's plus its difficulty, in place of what the provider " +
                "returns (providers leave it out or count it from a snapshot). The parent's is read from the archive; " +
                'a dump that starts at genesis starts from 0',
        )
        program.option(
            '--parent-total-difficulty <qty>',
            'With --derive-total-difficulty: the total difficulty of the block below the first one dumped, ' +
                'when the archive does not hold it',
            (value: string) => {
                try {
                    let td = BigInt(value)
                    if (td < 0n) throw new Error()
                    return td
                } catch {
                    throw new ErrorMessage(`--parent-total-difficulty: not a non-negative integer: ${value}`)
                }
            },
        )
        addStreamOptions(
            program,
            'The stream is not trusted: a block is taken only when it states the hash known from RPC, ' +
                'down the parent links from the finalized head, and passes every --verify-* check that is on. ' +
                'With --verify-block-hash its header must also hash to that hash. Without it the header is taken as ' +
                'the publisher states it, so leave it off only on a chain whose header hashing is not supported. ' +
                'Any other block is fetched from RPC. ' +
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
    private systemTxOracle(): EvmRpcClient | undefined {
        let url = this.options().hyperliquidSystemTxOracle
        if (url == null) return undefined
        // its own small budget; Rpc bounds each oracle call further, so the oracle never holds the dump up
        return new EvmRpcClient({url, capacity: 2, requestTimeout: 10_000, retryAttempts: 1})
    }

    @def
    private evmRpc(): Rpc {
        return new Rpc({
            client: this.rpc(),
            hyperliquidSystemTxOracle: this.systemTxOracle(),
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

        if (!options.verifyBlockHash) {
            this.log().warn(
                'a streamed header is not hashed without --verify-block-hash, ' +
                    'below the top of a walk the stream is trusted for the hash and the parent hash each block states',
            )
        }

        return new RawStreamSource({
            rpc: createRpcSource(rpc, this.dataSource()),
            connect: () => connectNatsStream({url, dataset, name: 'evm-dump'}),
            format: getLineFormat(options),
            // The chain id is asked for once, `Rpc` remembers it
            getVerifier: async () =>
                createLineVerifier(await rpc.getChainUtils(), options, {
                    onConsensusAnchorViolation: (observation) => {
                        this.log().warn(
                            observation,
                            'consensus anchor violation observed in a streamed block; block accepted',
                        )
                    },
                }),
            headPollInterval: options.headPollInterval ?? 1000,
            waitTimeout: stream.waitTimeout,
            metrics: createStreamMetrics(this.prometheus()),
            log: this.log().child('stream'),
        })
    }

    protected async *getBlocks(range: Range, prevHash?: string): AsyncIterable<RawBlock[]> {
        let source = this.getSourceBlocks(range, prevHash)
        if (!this.options().deriveTotalDifficulty) {
            yield* source
            return
        }

        let expected = range.from
        let td = await this.getParentTotalDifficulty(range.from)
        for await (let blocks of source) {
            for (let block of blocks) {
                let number = Number(block.number)
                if (number !== expected) {
                    throw new Error(`total difficulty is derived block by block, got block ${number} for ${expected}`)
                }
                if (block.difficulty == null) {
                    // A missing difficulty counted as 0 would undercount this block and every one after it
                    throw new ErrorMessage(
                        `--derive-total-difficulty: block ${number} has no difficulty, its total difficulty can not be derived`,
                    )
                }
                td += BigInt(block.difficulty)
                if (block.totalDifficulty != null && BigInt(block.totalDifficulty) !== td) {
                    this.countTotalDifficultyMismatch(number, block.totalDifficulty, td)
                }
                block.totalDifficulty = '0x' + td.toString(16)
                expected += 1
            }
            if (blocks.length > 0) {
                this.lastTotalDifficulty = {number: expected - 1, td}
            }
            yield blocks
        }
    }

    private lastTotalDifficulty?: {number: number; td: bigint}
    private tdMismatches = {count: 0, sinceWarning: 0, lastWarning: 0}

    private async getParentTotalDifficulty(from: number): Promise<bigint> {
        if (from === 0) return 0n
        let parent = from - 1
        if (this.lastTotalDifficulty?.number === parent) return this.lastTotalDifficulty.td

        let archived = await this.getArchivedBlock(parent)
        if (archived?.totalDifficulty != null) return BigInt(archived.totalDifficulty)

        let given = this.options().parentTotalDifficulty
        if (given != null) return given

        let reason = archived ? 'the archived block has none' : 'the archive does not hold it'
        throw new ErrorMessage(
            `--derive-total-difficulty needs the total difficulty of block ${parent}, and ${reason}: ` +
                'backfill it, or pass --parent-total-difficulty',
        )
    }

    private countTotalDifficultyMismatch(number: number, given: string, derived: bigint): void {
        let m = this.tdMismatches
        m.count += 1
        m.sinceWarning += 1
        let now = Date.now()
        if (m.lastWarning === 0 || now - m.lastWarning >= TD_MISMATCH_WARNING_INTERVAL_MS) {
            this.log().warn(
                {
                    blockNumber: number,
                    providerTotalDifficulty: given,
                    derivedTotalDifficulty: '0x' + derived.toString(16),
                    mismatchesSinceLastWarning: m.sinceWarning,
                    mismatches: m.count,
                },
                "the provider's totalDifficulty differs from the derived one; the derived one is written",
            )
            m.sinceWarning = 0
            m.lastWarning = now
        }
    }

    private async *getSourceBlocks(range: Range, prevHash?: string): AsyncIterable<RawBlock[]> {
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

    // Streamed blocks do not go through Rpc.getBlockBatch(), where the oracle is asked
    if (options.hyperliquidSystemTxOracle != null) {
        throw new ErrorMessage('--stream-url does not support --hyperliquid-system-tx-oracle yet')
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
