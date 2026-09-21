import {event} from '../abi.support.js'
import {LiquidityDecreased as LiquidityDecreased_, LiquidityIncreased as LiquidityIncreased_, PoolInitialized as PoolInitialized_, Traded as Traded_} from './types.js'

export type LiquidityDecreased = LiquidityDecreased_

export const LiquidityDecreased = event(
    {
        d8: '0xa601244770cab5ab',
    },
    LiquidityDecreased_,
)

export type LiquidityIncreased = LiquidityIncreased_

export const LiquidityIncreased = event(
    {
        d8: '0x1e0790b566fe9ba1',
    },
    LiquidityIncreased_,
)

export type PoolInitialized = PoolInitialized_

export const PoolInitialized = event(
    {
        d8: '0x6476ad570cc6fee5',
    },
    PoolInitialized_,
)

export type Traded = Traded_

export const Traded = event(
    {
        d8: '0xe1ca49af932ba096',
    },
    Traded_,
)
