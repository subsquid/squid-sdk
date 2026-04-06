import * as factory from './abi/uniswap-v2-factory'
import * as pair from './abi/uniswap-v2-pair'
import {Account, DexType, Swap, TrackedPair} from './model'
import {useStore, useTemplate} from './hooks'
import {FACTORY_SUSHI, TEMPLATE_SUSHI_PAIR} from './constants'
import type {Log} from './source'

async function handlePairCreated(log: Log, blockNumber: number): Promise<void> {
    const template = useTemplate(TEMPLATE_SUSHI_PAIR)
    const store = useStore()

    if (log.address.toLowerCase() !== FACTORY_SUSHI) return

    const {token0, token1, pair: pairAddr} = factory.events.PairCreated.decode(log)
    const pairLc = pairAddr.toLowerCase()
    template.add(pairLc, blockNumber)

    await store.upsert(
        new TrackedPair({
            id: pairLc,
            dexType: DexType.SUSHISWAP,
            token0: token0.toLowerCase(),
            token1: token1.toLowerCase(),
            discoveredAtBlock: blockNumber,
        }),
    )
}

async function handleSwap(log: Log, blockNumber: number): Promise<void> {
    const template = useTemplate(TEMPLATE_SUSHI_PAIR)
    if (!template.has(log.address.toLowerCase(), blockNumber)) return

    const store = useStore()

    const {sender, to, amount0In, amount1In, amount0Out, amount1Out} = pair.events.Swap.decode(log)
    await store.insert(
        new Swap({
            id: log.id,
            dexType: DexType.SUSHISWAP,
            blockNumber: log.block.number,
            timestamp: new Date(log.block.timestamp),
            tx: log.transactionHash,
            sender: new Account({id: sender}),
            to: new Account({id: to}),
            amount0In,
            amount1In,
            amount0Out,
            amount1Out,
        }),
    )
}

export async function handleSushi(log: Log, blockNumber: number): Promise<void> {
    switch (log.topics[0]) {
        case factory.events.PairCreated.topic:
            return handlePairCreated(log, blockNumber)
        case pair.events.Swap.topic:
            return handleSwap(log, blockNumber)
    }
}
