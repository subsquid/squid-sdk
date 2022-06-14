import {createLogger, Logger} from "@subsquid/logger"
import {getOldTypesBundle, OldTypesBundle, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {last, runProgram} from "@subsquid/util-internal"
import assert from "assert"
import {applyRangeBound, Batch, mergeBatches} from "../batch/generic"
import {PlainBatchRequest} from "../batch/request"
import {Chain} from "../chain"
import {BlockData} from "../ingest"
import type {BlockRangeOption, EvmLogOptions} from "../interfaces/dataHandlers"
import type {
    CallDataRequest,
    CallItem,
    DataSelection,
    EventDataRequest,
    EventItem,
    MayBeDataSelection,
    NoDataSelection
} from "../interfaces/dataSelection"
import type {Database} from "../interfaces/db"
import type {SubstrateBlock} from "../interfaces/substrate"
import {Range} from "../util/range"
import {DataSource} from "./handlerProcessor"
import {Config, Options, Runner} from "./runner"


export type BatchProcessorItem<T> =
    T extends SubstrateBatchProcessor<infer I> ? I : never


export interface BatchContext<Store, Item> {
    _chain: Chain
    tx: object
    log: Logger
    store: Store
    blocks: BatchBlock<Item>[]
}


export interface BatchBlock<Item> {
    header: SubstrateBlock
    items: Item[]
}


export class SubstrateBatchProcessor<Item = EventItem<'*'> | CallItem<"*">> {
    private batches: Batch<PlainBatchRequest>[] = []
    private options: Options = {}
    private src?: DataSource
    private typesBundle?: OldTypesBundle

    private copy(): SubstrateBatchProcessor<Item> {
        let copy = new SubstrateBatchProcessor<Item>()
        copy.batches = this.batches
        copy.options = this.options
        copy.src = this.src
        copy.typesBundle = this.typesBundle
        return copy
    }

    private setOption<K extends keyof Options>(name: K, value: Options[K]): SubstrateBatchProcessor<Item> {
        let next = this.copy()
        next.options = {...this.options, [name]: value}
        return next
    }

    private add(request: PlainBatchRequest, range?: Range): SubstrateBatchProcessor<any> {
        let batch = {range: range || {from: 0}, request}
        let next = this.copy()
        next.batches = this.batches.concat([batch])
        return next
    }

    addEvent<N extends string>(
        name: N,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | EventItem<N, true>>

    addEvent<N extends string, R extends EventDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | EventItem<N, R>>

    addEvent(
        name: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.events.push({name, data: options?.data})
        return this.add(req, options?.range)
    }

    addCall<N extends string>(
        name: N,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | CallItem<N, true>>

    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | CallItem<N, R>>

    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options?: BlockRangeOption & MayBeDataSelection<CallDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.calls.push({name, data: options?.data})
        return this.add(req, options?.range)
    }

    addEvmLog(
        contractAddress: string,
        options?: EvmLogOptions & NoDataSelection
    ): SubstrateBatchProcessor<Item | EventItem<"EVM.Log", true>>

    addEvmLog<R extends EventDataRequest>(
        contractAddress: string,
        options: EvmLogOptions & DataSelection<R>
    ): SubstrateBatchProcessor<Item | EventItem<"EVM.Log", R>>

    addEvmLog(
        contractAddress: string,
        options?: EvmLogOptions & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.evmLogs.push({
            contract: contractAddress,
            filter: options?.filter,
            data: options?.data
        })
        return this.add(req, options?.range)
    }

    addContractsContractEmitted(
        contractAddress: string,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | EventItem<"Contracts.ContractEmitted", true>>

    addContractsContractEmitted<R extends EventDataRequest>(
        contractAddress: string,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | EventItem<"Contracts.ContractEmitted", R>>

    addContractsContractEmitted(
        contractAddress: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.contractsEvents.push({
            contract: contractAddress,
            data: options?.data
        })
        return this.add(req, options?.range)
    }

    includeAllBlocks(range?: Range): SubstrateBatchProcessor<Item> {
        let req = new PlainBatchRequest()
        req.includeAllBlocks = true
        return this.add(req)
    }

    setPrometheusPort(port: number | string): SubstrateBatchProcessor<Item> {
        return this.setOption('prometheusPort', port)
    }

    setBlockRange(range?: Range): SubstrateBatchProcessor<Item> {
        return this.setOption('blockRange', range)
    }

    setBatchSize(size: number): SubstrateBatchProcessor<Item> {
        assert(size > 0)
        return this.setOption('batchSize', size)
    }

    setDataSource(src: DataSource): SubstrateBatchProcessor<Item> {
        let next = this.copy()
        next.src = src
        return next
    }

    setTypesBundle(bundle: string | OldTypesBundle): SubstrateBatchProcessor<Item> {
        let next = this.copy()
        if (typeof bundle == 'string') {
            next.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            next.typesBundle = bundle
        }
        return next
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

    run<Store>(db: Database<Store>, mapper: (ctx: BatchContext<Store, Item>) => Promise<void>): void {
        let logger = createLogger('sqd:processor')

        runProgram(async () => {
            let batches = mergeBatches(this.batches, (a, b) => a.merge(b))

            let config: Config<Store, PlainBatchRequest> = {
                getDatabase: () => db,
                getArchiveEndpoint: () => this.getArchiveEndpoint(),
                getChainEndpoint: () => this.getChainEndpoint(),
                getTypesBundle: this.getTypesBundle.bind(this),
                getLogger: () => logger,
                getOptions: () => this.options,
                createBatches(blockRange: Range): Batch<PlainBatchRequest>[] {
                    return applyRangeBound(batches, blockRange)
                }
            }

            let runner = new Runner(config)

            runner.processBatch = async function(request: PlainBatchRequest, chain: Chain, blocks: BlockData[]) {
                if (blocks.length == 0) return
                let from = blocks[0].header.height
                let to = last(blocks).header.height
                return db.transact(from, to, store => {
                    return mapper({
                        _chain: chain,
                        tx: {},
                        log: logger.child('mapping'),
                        store,
                        blocks: blocks as any,
                    })
                })
            }

            return runner.run()
        }, err => logger.fatal(err))
    }
}
