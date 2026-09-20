import {
    CALL_FRAME_VALIDATION_MODES,
    type CallFrameValidationMode,
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
    Url,
    nat,
    positiveInt,
} from '@subsquid/util-internal-dump-cli'
import zlib from 'node:zlib'
import {findUnverifiedParts, getComponentsRule} from './stream/components'
import {MISS_REASONS} from './stream/message'
import {connectNatsStream, isDatasetName} from './stream/nats'
import {createRpcSource} from './stream/rpc-source'
import {DEFAULT_STREAM_WAIT_TIMEOUT, RawStreamSource, type StreamMetrics} from './stream/source'
import {createLineVerifier} from './stream/verify'

const STREAM_CONNECT_TIMEOUT = 5000
const STREAM_REQUEST_TIMEOUT = 5000

interface Options extends DumperOptions {
    retryInternalServerErrors?: boolean
    finalityConfirmation?: number
    headPollInterval?: number
    withReceipts?: boolean
    withTraces?: boolean
    withStatediffs?: boolean
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
    callFrameValidation?: CallFrameValidationMode
    skipLogIndexCheck?: boolean
    skipCumulativeGasUsedCheck?: boolean
    useGasUsedForReceiptsRoot?: boolean
    streamUrl?: string
    streamDataset?: string
    streamWaitTimeout?: number
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
        program.addOption(
            new Option(
                '--call-frame-validation <mode>',
                'Validate semantic call-frame consistency; reject requires --verify-tx-root and --verify-tx-sender',
            )
                .choices([...CALL_FRAME_VALIDATION_MODES])
                .default('off'),
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
            '--stream-url <url>',
            'NATS server with a JetStream stream of raw blocks. Blocks found there are not fetched from RPC. ' +
                'The stream is not trusted: a block is taken only when its header hashes to the hash known from RPC, ' +
                'down the parent links from the finalized head, and passes every --verify-* check that is on. ' +
                'Any other block is fetched from RPC, which is every block of a chain whose header hashing is not supported. ' +
                'Transactions, receipts and logs are tied to the header only by the matching --verify-* options, ' +
                'call traces and state diffs can not be tied to it at all, the same as with RPC. ' +
                'Requires Node.js 22.15 or later for its built-in zstd',
            Url(['nats:', 'tls:']),
        )
        program.option(
            '--stream-dataset <name>',
            'Dataset name the raw blocks are published under: letters, digits, "_" and "-"',
        )
        program.option(
            '--stream-wait-timeout <ms>',
            'How long to retry a missing finalized block in the stream before using RPC; 0 disables waiting',
            nat,
            DEFAULT_STREAM_WAIT_TIMEOUT,
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
            callFrameValidation: this.options().callFrameValidation,
            checkLogIndex: !this.options().skipLogIndexCheck,
            checkCumulativeGasUsed: !this.options().skipCumulativeGasUsedCheck,
            useGasUsedForReceiptsRoot: this.options().useGasUsedForReceiptsRoot,
        })
    }

    @def
    private dataSource(): EvmRpcDataSource {
        return new EvmRpcDataSource({
            rpc: this.evmRpc(),
            headPollInterval: this.options().headPollInterval,
            req: {
                transactions: true,
                logs: !this.options().withReceipts,
                receipts: this.options().withReceipts,
                traces: this.options().withTraces,
                stateDiffs: this.options().withStatediffs,
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
    private rawStream(): RawStreamSource | undefined {
        let {streamUrl, streamDataset} = this.options()
        if (streamUrl == null && streamDataset == null) return undefined

        if (streamUrl == null || streamDataset == null) {
            throw new ErrorMessage('--stream-url and --stream-dataset must be set together')
        }

        if (!isDatasetName(streamDataset)) {
            throw new ErrorMessage(
                `invalid --stream-dataset '${streamDataset}': only letters, digits, "_" and "-" are allowed`,
            )
        }

        if (typeof zlib.zstdDecompressSync != 'function') {
            throw new ErrorMessage(
                `--stream-url requires Node.js 22.15 or later for its built-in zstd, running ${process.version}`,
            )
        }

        let url = streamUrl
        let dataset = streamDataset
        let options = this.options()
        let rpc = this.evmRpc()

        let unverified = findUnverifiedParts(options)
        if (unverified.length > 0) {
            this.log().warn(
                `nothing ties these parts of a streamed block to its verified header: ${unverified.join(', ')}. ` +
                    'A stream that drops or adds them is not detected, turn the named options on to close the gap',
            )
        }

        return new RawStreamSource({
            rpc: createRpcSource(rpc, this.dataSource()),
            connect: () =>
                connectNatsStream({
                    url,
                    dataset,
                    connectTimeout: STREAM_CONNECT_TIMEOUT,
                    requestTimeout: STREAM_REQUEST_TIMEOUT,
                }),
            rule: getComponentsRule(options),
            // The chain id is asked for once, `Rpc` remembers it
            getVerifier: async () => createLineVerifier(await rpc.getChainUtils(), options),
            headPollInterval: options.headPollInterval ?? 1000,
            waitTimeout: options.streamWaitTimeout,
            metrics: this.streamMetrics(),
            log: this.log().child('stream'),
        })
    }

    @def
    private streamMetrics(): StreamMetrics {
        let blocks = this.prometheus().createCounter({
            name: 'sqd_dump_blocks_total',
            help: 'Number of blocks received by their source',
            labelNames: ['source'],
        })

        let misses = this.prometheus().createCounter({
            name: 'sqd_dump_stream_miss_total',
            help: 'Number of times blocks had to be fetched from RPC, by the reason the stream was not used for them',
            labelNames: ['reason'],
        })

        // Makes every series visible before its first event
        blocks.inc({source: 'stream'}, 0)
        blocks.inc({source: 'rpc'}, 0)
        for (let reason of MISS_REASONS) {
            misses.inc({reason}, 0)
        }

        return {
            blocks: (source, count) => blocks.inc({source}, count),
            miss: (reason) => misses.inc({reason}),
        }
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
