import {Codec, struct, u8, u128, u64, bool, i128, fixedArray, address, unit, sum, u16, i32, ref} from '@subsquid/borsh'

export interface OpenPositionBumps {
    positionBump: number
}

export const OpenPositionBumps: Codec<OpenPositionBumps> = struct({
    positionBump: u8,
})

export interface OpenPositionWithMetadataBumps {
    positionBump: number
    metadataBump: number
}

export const OpenPositionWithMetadataBumps: Codec<OpenPositionWithMetadataBumps> = struct({
    positionBump: u8,
    metadataBump: u8,
})

export interface PositionRewardInfo {
    growthInsideCheckpoint: bigint
    amountOwed: bigint
}

export const PositionRewardInfo: Codec<PositionRewardInfo> = struct({
    growthInsideCheckpoint: u128,
    amountOwed: u64,
})

export interface Tick {
    initialized: boolean
    liquidityNet: bigint
    liquidityGross: bigint
    feeGrowthOutsideA: bigint
    feeGrowthOutsideB: bigint
    rewardGrowthsOutside: Array<bigint>
}

export const Tick: Codec<Tick> = struct({
    initialized: bool,
    liquidityNet: i128,
    liquidityGross: u128,
    feeGrowthOutsideA: u128,
    feeGrowthOutsideB: u128,
    rewardGrowthsOutside: fixedArray(u128, 3),
})

export interface WhirlpoolRewardInfo {
    mint: string
    vault: string
    authority: string
    emissionsPerSecondX64: bigint
    growthGlobalX64: bigint
}

export const WhirlpoolRewardInfo: Codec<WhirlpoolRewardInfo> = struct({
    mint: address,
    vault: address,
    authority: address,
    emissionsPerSecondX64: u128,
    growthGlobalX64: u128,
})

export interface WhirlpoolBumps {
    whirlpoolBump: number
}

export const WhirlpoolBumps: Codec<WhirlpoolBumps> = struct({
    whirlpoolBump: u8,
})

export type CurrIndex_Below = undefined

export const CurrIndex_Below = unit

export type CurrIndex_Inside = undefined

export const CurrIndex_Inside = unit

export type CurrIndex_Above = undefined

export const CurrIndex_Above = unit

export type CurrIndex = 
    | {
        kind: 'Below'
        value?: CurrIndex_Below
      }
    | {
        kind: 'Inside'
        value?: CurrIndex_Inside
      }
    | {
        kind: 'Above'
        value?: CurrIndex_Above
      }

export const CurrIndex: Codec<CurrIndex> = sum(1, {
    Below: {
        discriminator: 0,
        value: CurrIndex_Below,
    },
    Inside: {
        discriminator: 1,
        value: CurrIndex_Inside,
    },
    Above: {
        discriminator: 2,
        value: CurrIndex_Above,
    },
})

export type TickLabel_Upper = undefined

export const TickLabel_Upper = unit

export type TickLabel_Lower = undefined

export const TickLabel_Lower = unit

export type TickLabel = 
    | {
        kind: 'Upper'
        value?: TickLabel_Upper
      }
    | {
        kind: 'Lower'
        value?: TickLabel_Lower
      }

export const TickLabel: Codec<TickLabel> = sum(1, {
    Upper: {
        discriminator: 0,
        value: TickLabel_Upper,
    },
    Lower: {
        discriminator: 1,
        value: TickLabel_Lower,
    },
})

export type Direction_Left = undefined

export const Direction_Left = unit

export type Direction_Right = undefined

export const Direction_Right = unit

export type Direction = 
    | {
        kind: 'Left'
        value?: Direction_Left
      }
    | {
        kind: 'Right'
        value?: Direction_Right
      }

export const Direction: Codec<Direction> = sum(1, {
    Left: {
        discriminator: 0,
        value: Direction_Left,
    },
    Right: {
        discriminator: 1,
        value: Direction_Right,
    },
})

export interface WhirlpoolsConfig {
    feeAuthority: string
    collectProtocolFeesAuthority: string
    rewardEmissionsSuperAuthority: string
    defaultProtocolFeeRate: number
}

export const WhirlpoolsConfig: Codec<WhirlpoolsConfig> = struct({
    feeAuthority: address,
    collectProtocolFeesAuthority: address,
    rewardEmissionsSuperAuthority: address,
    defaultProtocolFeeRate: u16,
})

export interface FeeTier {
    whirlpoolsConfig: string
    tickSpacing: number
    defaultFeeRate: number
}

export const FeeTier: Codec<FeeTier> = struct({
    whirlpoolsConfig: address,
    tickSpacing: u16,
    defaultFeeRate: u16,
})

export interface PositionBundle {
    positionBundleMint: string
    positionBitmap: Array<number>
}

export const PositionBundle: Codec<PositionBundle> = struct({
    positionBundleMint: address,
    positionBitmap: fixedArray(u8, 32),
})

export interface Position {
    whirlpool: string
    positionMint: string
    liquidity: bigint
    tickLowerIndex: number
    tickUpperIndex: number
    feeGrowthCheckpointA: bigint
    feeOwedA: bigint
    feeGrowthCheckpointB: bigint
    feeOwedB: bigint
    rewardInfos: Array<PositionRewardInfo>
}

export const Position: Codec<Position> = struct({
    whirlpool: address,
    positionMint: address,
    liquidity: u128,
    tickLowerIndex: i32,
    tickUpperIndex: i32,
    feeGrowthCheckpointA: u128,
    feeOwedA: u64,
    feeGrowthCheckpointB: u128,
    feeOwedB: u64,
    rewardInfos: fixedArray(ref(() => PositionRewardInfo), 3),
})

export interface TickArray {
    startTickIndex: number
    ticks: Array<Tick>
    whirlpool: string
}

export const TickArray: Codec<TickArray> = struct({
    startTickIndex: i32,
    ticks: fixedArray(ref(() => Tick), 88),
    whirlpool: address,
})

export interface Whirlpool {
    whirlpoolsConfig: string
    whirlpoolBump: Array<number>
    tickSpacing: number
    tickSpacingSeed: Array<number>
    feeRate: number
    protocolFeeRate: number
    liquidity: bigint
    sqrtPrice: bigint
    tickCurrentIndex: number
    protocolFeeOwedA: bigint
    protocolFeeOwedB: bigint
    tokenMintA: string
    tokenVaultA: string
    feeGrowthGlobalA: bigint
    tokenMintB: string
    tokenVaultB: string
    feeGrowthGlobalB: bigint
    rewardLastUpdatedTimestamp: bigint
    rewardInfos: Array<WhirlpoolRewardInfo>
}

export const Whirlpool: Codec<Whirlpool> = struct({
    whirlpoolsConfig: address,
    whirlpoolBump: fixedArray(u8, 1),
    tickSpacing: u16,
    tickSpacingSeed: fixedArray(u8, 2),
    feeRate: u16,
    protocolFeeRate: u16,
    liquidity: u128,
    sqrtPrice: u128,
    tickCurrentIndex: i32,
    protocolFeeOwedA: u64,
    protocolFeeOwedB: u64,
    tokenMintA: address,
    tokenVaultA: address,
    feeGrowthGlobalA: u128,
    tokenMintB: address,
    tokenVaultB: address,
    feeGrowthGlobalB: u128,
    rewardLastUpdatedTimestamp: u64,
    rewardInfos: fixedArray(ref(() => WhirlpoolRewardInfo), 3),
})
