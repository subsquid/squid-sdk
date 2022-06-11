import {Logger} from "@subsquid/logger"
import {Chain} from "../chain"
import type {BlockRangeOption, EvmLogOptions} from "../interfaces/dataHandlers"
import type {
    CallItem,
    EventItem,
    CallDataRequest,
    DataSelection,
    EventDataRequest,
    MayBeDataSelection,
    NoDataSelection
} from "../interfaces/dataSelection"
import type {Database} from "../interfaces/db"
import type {SubstrateBlock} from "../interfaces/substrate"


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
        return this
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
        return this
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
        return this
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
        return this
    }

    run<Store>(db: Database<Store>, mapper: (ctx: BatchContext<Store, Item>) => Promise<void>): void {

    }
}


new SubstrateBatchProcessor()
    .addEvent('Balances.Transfer', {data: {event: {args: true}}} as const)
    .addCall('Balances.transfer', {data: {extrinsic: true, call: {args: true}}} as const)
    .addEvmLog('0xaaa', {filter: ['0xaaaa']})
    .run(null as any, async ctx => {
        for (let block of ctx.blocks) {
            for (let item of block.items) {
                if (item.name == 'Balances.Transfer') {
                    console.log(item.event.args)
                }

                if (item.name == 'Balances.transfer') {
                    console.log(item.extrinsic)
                    // console.log(item.extrinsic.signature)
                }

            }
        }
    })
