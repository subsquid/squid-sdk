import {Codec, struct, u8, u128, u64, bool, i128, fixedArray, address, unit, sum, u16, i32, ref} from '@subsquid/borsh'

export type OpenPositionBumpsType = {
    positionBump: number
}

export const OpenPositionBumps: Codec<OpenPositionBumpsType> = struct({
    positionBump: u8,
})

export type OpenPositionWithMetadataBumpsType = {
    positionBump: number
    metadataBump: number
}

export const OpenPositionWithMetadataBumps: Codec<OpenPositionWithMetadataBumpsType> = struct({
    positionBump: u8,
    metadataBump: u8,
})

export type PositionRewardInfoType = {
    growthInsideCheckpoint: bigint
    amountOwed: bigint
}

export const PositionRewardInfo: Codec<PositionRewardInfoType> = struct({
    growthInsideCheckpoint: u128,
    amountOwed: u64,
})

export type TickType = {
    initialized: boolean
    liquidityNet: bigint
    liquidityGross: bigint
    feeGrowthOutsideA: bigint
    feeGrowthOutsideB: bigint
    rewardGrowthsOutside: Array<bigint>
}

export const Tick: Codec<TickType> = struct({
    initialized: bool,
    liquidityNet: i128,
    liquidityGross: u128,
    feeGrowthOutsideA: u128,
    feeGrowthOutsideB: u128,
    rewardGrowthsOutside: fixedArray(u128, 3),
})

export type WhirlpoolRewardInfoType = {
    mint: string
    vault: string
    authority: string
    emissionsPerSecondX64: bigint
    growthGlobalX64: bigint
}

export const WhirlpoolRewardInfo: Codec<WhirlpoolRewardInfoType> = struct({
    mint: address,
    vault: address,
    authority: address,
    emissionsPerSecondX64: u128,
    growthGlobalX64: u128,
})

export type WhirlpoolBumpsType = {
    whirlpoolBump: number
}

export const WhirlpoolBumps: Codec<WhirlpoolBumpsType> = struct({
    whirlpoolBump: u8,
})

export type CurrIndexType_Below = undefined

export const CurrIndex_Below = unit

export type CurrIndexType_Inside = undefined

export const CurrIndex_Inside = unit

export type CurrIndexType_Above = undefined

export const CurrIndex_Above = unit

export type CurrIndexType = 
    | {
        kind: 'Below'
        value?: CurrIndexType_Below
    }
    | {
        kind: 'Inside'
        value?: CurrIndexType_Inside
    }
    | {
        kind: 'Above'
        value?: CurrIndexType_Above
    }

export const CurrIndex: Codec<CurrIndexType> = sum(1, {
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

export type TickLabelType_Upper = undefined

export const TickLabel_Upper = unit

export type TickLabelType_Lower = undefined

export const TickLabel_Lower = unit

export type TickLabelType = 
    | {
        kind: 'Upper'
        value?: TickLabelType_Upper
    }
    | {
        kind: 'Lower'
        value?: TickLabelType_Lower
    }

export const TickLabel: Codec<TickLabelType> = sum(1, {
    Upper: {
        discriminator: 0,
        value: TickLabel_Upper,
    },
    Lower: {
        discriminator: 1,
        value: TickLabel_Lower,
    },
})

export type DirectionType_Left = undefined

export const Direction_Left = unit

export type DirectionType_Right = undefined

export const Direction_Right = unit

export type DirectionType = 
    | {
        kind: 'Left'
        value?: DirectionType_Left
    }
    | {
        kind: 'Right'
        value?: DirectionType_Right
    }

export const Direction: Codec<DirectionType> = sum(1, {
    Left: {
        discriminator: 0,
        value: Direction_Left,
    },
    Right: {
        discriminator: 1,
        value: Direction_Right,
    },
})

export type WhirlpoolsConfigType = {
    feeAuthority: string
    collectProtocolFeesAuthority: string
    rewardEmissionsSuperAuthority: string
    defaultProtocolFeeRate: number
}

export const WhirlpoolsConfig: Codec<WhirlpoolsConfigType> = struct({
    feeAuthority: address,
    collectProtocolFeesAuthority: address,
    rewardEmissionsSuperAuthority: address,
    defaultProtocolFeeRate: u16,
})

export type FeeTierType = {
    whirlpoolsConfig: string
    tickSpacing: number
    defaultFeeRate: number
}

export const FeeTier: Codec<FeeTierType> = struct({
    whirlpoolsConfig: address,
    tickSpacing: u16,
    defaultFeeRate: u16,
})

export type PositionBundleType = {
    positionBundleMint: string
    positionBitmap: Array<number>
}

export const PositionBundle: Codec<PositionBundleType> = struct({
    positionBundleMint: address,
    positionBitmap: fixedArray(u8, 32),
})

export type PositionType = {
    whirlpool: string
    positionMint: string
    liquidity: bigint
    tickLowerIndex: number
    tickUpperIndex: number
    feeGrowthCheckpointA: bigint
    feeOwedA: bigint
    feeGrowthCheckpointB: bigint
    feeOwedB: bigint
    rewardInfos: Array<PositionRewardInfoType>
}

export const Position: Codec<PositionType> = struct({
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

export type TickArrayType = {
    startTickIndex: number
    ticks: Array<TickType>
    whirlpool: string
}

export const TickArray: Codec<TickArrayType> = struct({
    startTickIndex: i32,
    ticks: fixedArray(ref(() => Tick), 88),
    whirlpool: address,
})

export type WhirlpoolType = {
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
    rewardInfos: Array<WhirlpoolRewardInfoType>
}

export const Whirlpool: Codec<WhirlpoolType> = struct({
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
