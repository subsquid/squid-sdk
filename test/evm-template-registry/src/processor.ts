import {run, type TemplateMutation} from '@subsquid/batch-processor'
import {augmentBlock, type Log as _Log} from '@subsquid/evm-objects'
import {DataSourceBuilder, GetDataSourceBlock, Block as DataSourceBlock} from '@subsquid/evm-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as factory from './abi/uniswap-v2-factory'
import * as pair from './abi/uniswap-v2-pair'
import {Account, DexType, Swap, TrackedPair} from './model'

const FACTORY_SUSHI = '0xc35dadb65012ec5796536bd9864ed8773abc74c4'
const FACTORY_UNI = '0xf1d7cc64fb4452f05c498126312ebe29f30fbcf9'

const TEMPLATE_SUSHI_PAIR = 'PairSushi'
const TEMPLATE_UNI_PAIR = 'PairUniswap'

const dataSource = new DataSourceBuilder()
    .setPortal({
        url: 'https://portal.sqd.dev/datasets/arbitrum-one',
        http: {retryAttempts: 10},
    })
    .setBlockRange({from: 190000000})
    .setFields({
        block: {
            timestamp: true,
            size: true,
        },
        log: {
            transactionHash: true,
            address: true,
            topics: true,
            data: true,
        },
    })
    .addLog({
        where: {
            address: [FACTORY_SUSHI, FACTORY_UNI],
            topic0: [factory.events.PairCreated.topic],
        },
    })
    .addLog({
        where: {
            topic0: [pair.events.Swap.topic],
        },
    })
    .build()

export type Fields = GetDataSourceBlock<typeof dataSource> extends DataSourceBlock<infer F> ? F : never
export type Log = _Log<Fields>

function createSwap(log: Log, type: DexType) {
    const {sender, to, amount0In, amount1In, amount0Out, amount1Out} = pair.events.Swap.decode(log)
    return new Swap({
        id: log.id,
        dexType: type,
        blockNumber: log.block.number,
        timestamp: new Date(log.block.timestamp),
        tx: log.transactionHash,
        sender: new Account({id: sender}),
        to: new Account({id: to}),
        amount0In,
        amount1In,
        amount0Out,
        amount1Out,
    })
}

run(dataSource, new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    const swaps: Swap[] = []
    const pairs: TrackedPair[] = []
    const templateMutations: TemplateMutation[] = []

    const known = await ctx.store.find(TrackedPair, {})
    const dexByPair = new Map<string, DexType>(known.map((p) => [p.id, p.dexType]))

    for (const block of ctx.blocks) {
        const augmented = augmentBlock(block)
        const {number: blockNumber} = block.header

        for (const log of augmented.logs) {
            const addr = log.address.toLowerCase()

            switch (log.topics[0]) {
                case factory.events.PairCreated.topic: {
                    const {token0, token1, pair: pairAddr} = factory.events.PairCreated.decode(log)
                    const pairLc = pairAddr.toLowerCase()
                    const factoryLc = addr
                    const templateKey = factoryLc === FACTORY_SUSHI.toLowerCase() ? TEMPLATE_SUSHI_PAIR : TEMPLATE_UNI_PAIR
                    const dexType = factoryLc === FACTORY_SUSHI.toLowerCase() ? DexType.SUSHISWAP : DexType.UNISWAP
                    templateMutations.push({
                        type: 'add',
                        key: templateKey,
                        value: pairLc,
                        blockNumber,
                    })
                    dexByPair.set(pairLc, dexType)
                    pairs.push(
                        new TrackedPair({
                            id: pairLc,
                            dexType,
                            token0: token0.toLowerCase(),
                            token1: token1.toLowerCase(),
                            discoveredAtBlock: blockNumber,
                        }),
                    )
                    break
                }
                case pair.events.Swap.topic: {
                    const dexType = dexByPair.get(addr)
                    if (dexType != null) {
                        swaps.push(createSwap(log, dexType))
                    }
                    break
                }
            }
        }
    }

    if (pairs.length > 0) {
        await ctx.store.upsert(pairs)
    }
    if (swaps.length > 0) {
        await ctx.store.insert(swaps)
    }
    if (templateMutations.length > 0) {
        return {templates: templateMutations}
    }
})
