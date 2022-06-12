import {createLogger, Logger} from "@subsquid/logger"
import {getOldTypesBundle, OldTypesBundle, QualifiedName, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull, def, runProgram, unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"
import {applyRangeBound, Batch, mergeBatches} from "../batch/generic"
import {DataHandlers} from "../batch/handlers"
import type {Chain} from "../chain"
import type {BlockData} from "../ingest"
import type {
    BlockHandler,
    BlockHandlerContext,
    BlockHandlerDataRequest,
    BlockRangeOption,
    CallHandler,
    CommonHandlerContext,
    ContractsContractEmittedHandler,
    EventHandler,
    EvmLogHandler,
    EvmLogOptions,
    EvmTopicSet
} from "../interfaces/dataHandlers"
import type {
    CallDataRequest,
    DataSelection,
    EventDataRequest,
    MayBeDataSelection,
    NoDataSelection
} from "../interfaces/dataSelection"
import type {Database} from "../interfaces/db"
import type {Hooks} from "../interfaces/hooks"
import type {ContractsContractEmittedEvent, EvmLogEvent, SubstrateEvent} from "../interfaces/substrate"
import {withErrorContext} from "../util/misc"
import type {Range} from "../util/range"
import {Options, Runner} from "./runner"


export interface DataSource {
    /**
     * Subsquid substrate archive endpoint URL
     */
    archive: string
    /**
     * Chain node RPC websocket URL
     */
    chain?: string
}


/**
 * Provides methods to configure and launch data processing.
 */
export class SubstrateProcessor<Store> {
    protected hooks: Hooks = {pre: [], post: [], event: [], call: [], evmLog: [], contractsContractEmitted: []}
    private blockRange: Range = {from: 0}
    private batchSize = 100
    private prometheusPort?: number | string
    private src?: DataSource
    private typesBundle?: OldTypesBundle
    private running = false

    constructor(private db: Database<Store>) {}

    /**
     * Sets blockchain data source.
     *
     * @example
     * processor.setDataSource({
     *     chain: 'wss://rpc.polkadot.io',
     *     archive: 'https://polkadot.indexer.gc.subsquid.io/v4/graphql'
     * })
     */
    setDataSource(src: DataSource): void {
        this.assertNotRunning()
        this.src = src
    }

    /**
     * Sets types bundle.
     *
     * Types bundle is only required for blocks which have
     * metadata version below 14.
     *
     * Don't confuse this setting with types bundle from polkadot.js.
     * Although those two are similar in purpose and structure,
     * they are not compatible.
     *
     * Types bundle can be specified in 3 different ways:
     *
     * 1. as a name of a known chain
     * 2. as a name of a JSON file structured as {@link OldTypesBundle}
     * 3. as an {@link OldTypesBundle} object
     *
     * @example
     * // known chain
     * processor.setTypesBundle('kusama')
     *
     * // A path to a JSON file resolved relative to `cwd`.
     * processor.setTypesBundle('typesBundle.json')
     *
     * // OldTypesBundle object
     * processor.setTypesBundle({
     *     types: {
     *         Foo: 'u8'
     *     }
     * })
     */
    setTypesBundle(bundle: string | OldTypesBundle): void {
        this.assertNotRunning()
        if (typeof bundle == 'string') {
            this.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            this.typesBundle = bundle
        }
    }

    /**
     * Limits the range of blocks to be processed.
     *
     * When the upper bound is specified,
     * the processor will terminate with exit code 0 once it reaches it.
     *
     * @example
     * // process only block 100
     * processor.setBlockRange({
     *     from: 100,
     *     to: 100
     * })
     */
    setBlockRange(range: Range): void {
        this.assertNotRunning()
        this.blockRange = range
    }

    /**
     * Sets the maximum number of blocks which can be fetched
     * from the data source in a single request.
     *
     * The default is 100.
     *
     * Usually this setting doesn't have any significant impact on the performance.
     */
    setBatchSize(size: number): void {
        this.assertNotRunning()
        assert(size > 0)
        this.batchSize = size
    }

    /**
     * Sets the port for a built-in prometheus metrics server.
     *
     * By default, the value of `PROMETHEUS_PORT` environment
     * variable is used. When it is not set,
     * the processor will pick up an ephemeral port.
     */
    setPrometheusPort(port: number | string) {
        this.assertNotRunning()
        this.prometheusPort = port
    }

    /**
     * Registers a block level data handler which will be executed before
     * any further processing.
     *
     * See {@link BlockHandlerContext} for an API available to the handler.
     *
     * Block level handlers affect performance, as they are
     * triggered for all chain blocks. If no block hooks are defined,
     * only blocks that'd trigger a handler execution will be fetched,
     * which is usually a lot faster.
     *
     * Relative execution order for multiple pre-block hooks is currently not defined.
     *
     * @example
     * processor.addPreHook(async ctx => {
     *     console.log(ctx.block.height)
     * })
     *
     * // limit the range of blocks for which pre-block hook will be effective
     * processor.addPreHook({range: {from: 100000}}, async ctx => {})
     */
    addPreHook(fn: BlockHandler<Store>): void
    addPreHook(options: BlockRangeOption & NoDataSelection, fn: BlockHandler<Store>): void
    addPreHook<R extends BlockHandlerDataRequest>(options: BlockRangeOption & DataSelection<R>, fn: BlockHandler<Store, R>): void
    addPreHook(fnOrOptions: BlockHandler<Store> | BlockRangeOption & MayBeDataSelection<BlockHandlerDataRequest> , fn?: BlockHandler<Store>): void {
        this.assertNotRunning()
        let handler: BlockHandler<Store>
        let options: BlockRangeOption & MayBeDataSelection<BlockHandlerDataRequest> = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.pre.push({handler, ...options})
    }

    /**
     * Registers a block level data handler which will be executed
     * at the end of processing.
     *
     * See {@link BlockHandlerContext} for an API available to the handler.
     *
     * Block level handlers affect performance, as they are
     * triggered for all chain blocks. If no block hooks are defined,
     * only blocks that'd trigger a handler execution will be fetched,
     * which is usually a lot faster.
     *
     * Relative execution order for multiple post-block hooks is currently not defined.
     *
     * @example
     * processor.addPostHook(async ctx => {
     *     console.log(ctx.block.height)
     * })
     *
     * // limit the range of blocks for which post-block hook will be effective
     * processor.addPostHook({range: {from: 100000}}, async ctx => {})
     */
    addPostHook(fn: BlockHandler<Store>): void
    addPostHook(options: BlockRangeOption, fn: BlockHandler<Store>): void
    addPostHook<R extends BlockHandlerDataRequest>(options: BlockRangeOption & DataSelection<R>, fn: BlockHandler<Store, R>): void
    addPostHook(fnOrOptions: BlockHandler<Store> | BlockRangeOption & MayBeDataSelection<BlockHandlerDataRequest>, fn?: BlockHandler<Store>): void {
        this.assertNotRunning()
        let handler: BlockHandler<Store>
        let options: BlockRangeOption & MayBeDataSelection<BlockHandlerDataRequest> = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.post.push({handler, ...options})
    }

    /**
     * Registers an event data handler.
     *
     * See {@link EventHandlerContext} for an API available to the handler.
     *
     * All events are processed sequentially according to the event log of the current block.
     *
     * Relative execution order is currently not defined for multiple event handlers
     * registered for the same event.
     *
     * @example
     * processor.addEventHandler('balances.Transfer', async ctx => {
     *     assert(ctx.event.name == 'balances.Transfer')
     * })
     *
     * // limit the range of blocks for which event handler will be effective
     * processor.addEventHandler('balances.Transfer', {
     *     range: {from: 100000}
     * }, async ctx => {
     *     assert(ctx.event.name == 'balances.Transfer')
     * })
     */
    addEventHandler(eventName: QualifiedName, fn: EventHandler<Store>): void
    addEventHandler(eventName: QualifiedName, options: BlockRangeOption & NoDataSelection, fn: EventHandler<Store>): void
    addEventHandler<R extends EventDataRequest>(eventName: QualifiedName, options: BlockRangeOption & DataSelection<R>, fn: EventHandler<Store, R> ): void
    addEventHandler(eventName: QualifiedName, fnOrOptions: BlockRangeOption & MayBeDataSelection<EventDataRequest> | EventHandler<Store>, fn?: EventHandler<Store>): void {
        this.assertNotRunning()
        let handler: EventHandler<Store>
        let options: BlockRangeOption & MayBeDataSelection<EventDataRequest> = {}
        if (typeof fnOrOptions === 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.event.push({
            event: eventName,
            handler,
            ...options
        })
    }

    addCallHandler(callName: QualifiedName, fn: CallHandler<Store>): void
    addCallHandler(callName: QualifiedName, options: BlockRangeOption & NoDataSelection, fn: CallHandler<Store>): void
    addCallHandler<R extends CallDataRequest>(callName: QualifiedName, options: BlockRangeOption & DataSelection<R>, fn: CallHandler<Store, R>): void
    addCallHandler(callName: QualifiedName, fnOrOptions: CallHandler<Store> | BlockRangeOption & MayBeDataSelection<CallDataRequest>, fn?: CallHandler<Store>): void {
        this.assertNotRunning()
        let handler: CallHandler<Store>
        let options:  BlockRangeOption & MayBeDataSelection<CallDataRequest> = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = {...fnOrOptions}
        }
        this.hooks.call.push({
            call: callName,
            handler,
            ...options
        })
    }


    addEvmLogHandler(
        contractAddress: string,
        fn: EvmLogHandler<Store>
    ): void
    addEvmLogHandler(
        contractAddress: string,
        options: EvmLogOptions & NoDataSelection,
        fn: EvmLogHandler<Store>
    ): void
    addEvmLogHandler<R extends EventDataRequest>(
        contractAddress: string,
        options: EvmLogOptions & DataSelection<R>,
        fn: EvmLogHandler<Store, R>
    ): void
    addEvmLogHandler(
        contractAddress: string,
        fnOrOptions: EvmLogOptions & MayBeDataSelection<EventDataRequest> | EvmLogHandler<Store>,
        fn?: EvmLogHandler<Store>
    ): void {
        this.assertNotRunning()
        let handler: EvmLogHandler<Store>
        let options:  EvmLogOptions= {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = {...fnOrOptions}
        }
        this.hooks.evmLog.push({
            handler,
            contractAddress,
            ...options
        })
    }

    addContractsContractEmittedHandler(
        contractAddress: string,
        fn: ContractsContractEmittedHandler<Store>
    ): void
    addContractsContractEmittedHandler(
        contractAddress: string,
        options: BlockRangeOption & NoDataSelection,
        fn: ContractsContractEmittedHandler<Store>
    ): void
    addContractsContractEmittedHandler<R extends EventDataRequest>(
        contractAddress: string,
        options: BlockRangeOption & DataSelection<R>,
        fn: ContractsContractEmittedHandler<Store, R>
    ): void
    addContractsContractEmittedHandler(
        contractAddress: string,
        fnOrOptions: ContractsContractEmittedHandler<Store> | BlockRangeOption & MayBeDataSelection<EventDataRequest>,
        fn?: ContractsContractEmittedHandler<Store>
    ): void {
        this.assertNotRunning()
        let handler: ContractsContractEmittedHandler<Store>
        let options: BlockRangeOption & MayBeDataSelection<EventDataRequest> = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = {...fnOrOptions}
        }
        this.hooks.contractsContractEmitted.push({
            handler,
            contractAddress,
            ...options
        })
    }

    protected assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    private createBatches(blockRange: Range) {
        let batches: Batch<DataHandlers>[] = []

        function getRange(hook: { range?: Range }): Range{
            return hook.range || {from: 0}
        }

        this.hooks.pre.forEach(hook => {
            let range = getRange(hook)
            let request = new DataHandlers()
            request.pre = {handlers: [hook.handler], data: hook.data}
            batches.push({range, request})
        })

        this.hooks.post.forEach(hook => {
            let range = getRange(hook)
            let request = new DataHandlers()
            request.post = {handlers: [hook.handler], data: hook.data}
            batches.push({range, request})
        })

        this.hooks.event.forEach(hook => {
            let range = getRange(hook)
            let request = new DataHandlers()
            request.events = {
                [hook.event]: {data: hook.data, handlers: [hook.handler]}
            }
            batches.push({range, request})
        })

        this.hooks.call.forEach(hook => {
            let range = getRange(hook)
            let request = new DataHandlers()
            request.calls = {
                [hook.call]: {data: hook.data, handlers: [hook.handler]}
            }
            batches.push({range, request})
        })

        this.hooks.evmLog.forEach(hook => {
            let range = getRange(hook)
            let request = new DataHandlers()
            request.evmLogs = {
                [hook.contractAddress]: [{
                    filter: hook.filter,
                    handler: hook.handler
                }]
            }
            batches.push({range, request})
        })

        this.hooks.contractsContractEmitted.forEach(hook => {
            let range = getRange(hook)
            let request = new DataHandlers()
            request.contractsContractEmitted = {
                [hook.contractAddress]: {data: hook.data, handlers: [hook.handler]}
            }
            batches.push({range, request})
        })

        batches = applyRangeBound(batches, blockRange)

        return mergeBatches(batches, (a, b) => a.merge(b))
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    @def
    private getOptions(): Options {
        return {
            blockRange: this.blockRange,
            prometheusPort: this.prometheusPort,
            batchSize: this.batchSize
        }
    }

    private getDatabase() {
        return this.db
    }

    private getTypesBundle(specName: string, specVersion: number): OldTypesBundle {
        let bundle = this.typesBundle || getOldTypesBundle(specName)
        if (bundle) return bundle
        throw new Error(`Types bundle is required for ${specName}@${specVersion}. Provide it via .setTypesBundle()`)
    }

    private getArchiveEndpoint(): string {
        let url = this.src?.archive
        if (url == null) {
            throw new Error('use .setDataSource() to specify archive url')
        }
        return url
    }

    private getChainEndpoint(): string {
        let url = this.src?.chain
        if (url == null) {
            throw new Error(`use .setDataSource() to specify chain RPC endpoint`)
        }
        return url
    }

    /**
     * Starts data processing.
     *
     * This method assumes full control over the current OS process as
     * it terminates the entire program in case of error or
     * at the end of data processing.
     */
    run(): void {
        if (this.running) return
        this.running = true
        runProgram(async () => {
            return new HandlerRunner(this as any).run()
        }, err => {
            this.getLogger().fatal(err)
        })
    }
}


class HandlerRunner<S> extends Runner<S, DataHandlers>{
    protected async processBatch(handlers: DataHandlers, chain: Chain, blocks: BlockData[]): Promise<void> {
        for (let block of blocks) {
            assert(this.lastBlock < block.header.height)
            await this.config.getDatabase().transact(block.header.height, store => {
                return this.processBlock(handlers, chain, store, block)
            }).catch(
                withErrorContext({
                    blockHeight: block.header.height,
                    blockHash: block.header.hash
                })
            )
            this.lastBlock = block.header.height
        }
    }

    private async processBlock(
        handlers: DataHandlers,
        chain: Chain,
        store: S,
        block: BlockData
    ): Promise<void> {
        let blockLog = this.config.getLogger().child('mapping', {
            blockHeight: block.header.height,
            blockHash: block.header.hash
        })

        let ctx: CommonHandlerContext<S> = {
            _chain: chain,
            tx: {},
            log: blockLog.child({hook: 'pre'}),
            store,
            block: block.header
        }

        for (let pre of handlers.pre.handlers) {
            ctx.log.debug('begin')
            await pre({...ctx, items: block.items})
            ctx.log.debug('end')
        }

        for (let item of block.items) {
            switch(item.kind) {
                case 'event':
                    for (let handler of handlers.events[item.event.name]?.handlers || []) {
                        let log = blockLog.child({
                            hook: 'event',
                            eventName: item.event.name,
                            eventId: item.event.id
                        })
                        log.debug('begin')
                        await handler({...ctx, log, event: item.event})
                        log.debug('end')
                    }
                    for (let handler of this.getEvmLogHandlers(handlers.evmLogs, item.event)) {
                        let event = item.event as EvmLogEvent
                        let log = blockLog.child({
                            hook: 'evm-log',
                            contractAddress: event.args.address,
                            eventId: event.id
                        })
                        log.debug('begin')
                        await handler({
                            ...ctx,
                            log,
                            event
                        })
                        log.debug('end')
                    }
                    for (let handler of this.getContractEmittedHandlers(handlers, item.event)) {
                        let event = item.event as ContractsContractEmittedEvent
                        let log = blockLog.child({
                            hook: 'contract-emitted',
                            contractAddress: event.args.contract,
                            eventId: event.id
                        })
                        log.debug('begin')
                        await handler({
                            ...ctx,
                            log,
                            event
                        })
                        log.debug('end')
                    }
                    break
                case 'call':
                    for (let handler of handlers.calls[item.call.name]?.handlers || []) {
                        let log = blockLog.child({
                            hook: 'call',
                            callName: item.call.name,
                            callId: item.call.id
                        })
                        let {kind, ...data} = item
                        log.debug('begin')
                        await handler({...ctx, log, ...data})
                        log.debug('end')
                    }
                    break
                default:
                    throw unexpectedCase()
            }
        }

        ctx.log = blockLog.child({hook: 'post'})

        for (let post of handlers.post.handlers) {
            ctx.log.debug('begin')
            await post({...ctx, items: block.items})
            ctx.log.debug('end')
        }
    }

    private *getEvmLogHandlers(evmLogs: DataHandlers["evmLogs"], event: SubstrateEvent): Generator<EvmLogHandler<any>> {
        if (event.name != 'EVM.Log') return
        let log = event as EvmLogEvent

        let contractHandlers = evmLogs[log.args.address]
        if (contractHandlers == null) return

        for (let h of contractHandlers) {
            if (this.evmHandlerMatches(h, log)) {
                yield h.handler
            }
        }
    }

    private evmHandlerMatches(handler: {filter?: EvmTopicSet[]}, log: EvmLogEvent): boolean {
        if (handler.filter == null) return true
        for (let i = 0; i < handler.filter.length; i++) {
            let set = handler.filter[i]
            if (set == null) continue
            if (Array.isArray(set) && !set.includes(log.args.topics[i])) {
                return false
            } else if (set !== log.args.topics[i]) {
                return false
            }
        }
        return true
    }

    private *getContractEmittedHandlers(handlers: DataHandlers, event: SubstrateEvent): Generator<ContractsContractEmittedHandler<any>> {
        if (event.name != 'Contracts.ContractEmitted') return
        let e = event as ContractsContractEmittedEvent

        let hs = handlers.contractsContractEmitted[e.args.contract]
        if (hs == null) return

        for (let h of hs.handlers) {
            yield h
        }
    }
}
