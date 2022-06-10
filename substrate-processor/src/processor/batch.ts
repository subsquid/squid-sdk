import {Logger} from "@subsquid/logger"
import {Chain} from "../chain"
import {BlockRangeOption} from "../interfaces/dataHandlers"
import {BlockCallItem, BlockEventItem, CallDataRequest, EventDataRequest} from "../interfaces/dataSelection"
import {Database} from "../interfaces/db"
import type {SubstrateBlock} from "../interfaces/substrate"


export interface BatchContext<Store, Item> {
    _chain: Chain
    nonce: object
    log: Logger
    store: Store
    blocks: BatchBlock<Item>[]
}


export interface BatchBlock<Item> {
    header: SubstrateBlock
    items: Item[]
}


interface DataSelection<R> {
    data: R
}


interface NoDataSelection {
    data?: undefined
}


export class SubstrateBatchProcessor<Item = BlockEventItem<'*'> | BlockCallItem<"*">> {
    addEvent<N extends string>(
        name: N,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | BlockEventItem<N, true>>
    addEvent<N extends string, R extends EventDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | BlockEventItem<N, R>>
    addEvent(name: string, options?: BlockRangeOption): SubstrateBatchProcessor<any> {
        return this
    }

    addCall<N extends string>(
        name: N,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | BlockCallItem<N, true>>
    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | BlockCallItem<N, R>>
    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options: BlockRangeOption
    ): SubstrateBatchProcessor<any> {
        return this
    }


    run<Store>(db: Database<Store>, mapper: (ctx: BatchContext<Store, Item>) => Promise<void>): void {

    }
}


new SubstrateBatchProcessor()
    .addEvent('Balances.Transfer', {data: {event: {args: true}}} as const)
    .addCall('Balances.transfer', {data: {extrinsic: true, call: {args: true}}} as const)
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
