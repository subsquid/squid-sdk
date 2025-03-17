import {Codec, unit, sum, struct, u8, u128, u64, bool, i128, fixedArray, address, array, ref, u16, i32} from '@subsquid/borsh'

export type LockType_Permanent = undefined

export const LockType_Permanent = unit

export type LockType = 
    | {
        kind: 'Permanent'
        value?: LockType_Permanent
      }

export const LockType: Codec<LockType> = sum(1, {
    Permanent: {
        discriminator: 0,
        value: LockType_Permanent,
    },
})

export type LockTypeLabel_Permanent = undefined

export const LockTypeLabel_Permanent = unit

export type LockTypeLabel = 
    | {
        kind: 'Permanent'
        value?: LockTypeLabel_Permanent
      }

export const LockTypeLabel: Codec<LockTypeLabel> = sum(1, {
    Permanent: {
        discriminator: 0,
        value: LockTypeLabel_Permanent,
    },
})

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

export interface WhirlpoolBumps {
    whirlpoolBump: number
}

export const WhirlpoolBumps: Codec<WhirlpoolBumps> = struct({
    whirlpoolBump: u8,
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

export type AccountsType_TransferHookA = undefined

export const AccountsType_TransferHookA = unit

export type AccountsType_TransferHookB = undefined

export const AccountsType_TransferHookB = unit

export type AccountsType_TransferHookReward = undefined

export const AccountsType_TransferHookReward = unit

export type AccountsType_TransferHookInput = undefined

export const AccountsType_TransferHookInput = unit

export type AccountsType_TransferHookIntermediate = undefined

export const AccountsType_TransferHookIntermediate = unit

export type AccountsType_TransferHookOutput = undefined

export const AccountsType_TransferHookOutput = unit

export type AccountsType_SupplementalTickArrays = undefined

export const AccountsType_SupplementalTickArrays = unit

export type AccountsType_SupplementalTickArraysOne = undefined

export const AccountsType_SupplementalTickArraysOne = unit

export type AccountsType_SupplementalTickArraysTwo = undefined

export const AccountsType_SupplementalTickArraysTwo = unit

export type AccountsType = 
    | {
        kind: 'TransferHookA'
        value?: AccountsType_TransferHookA
      }
    | {
        kind: 'TransferHookB'
        value?: AccountsType_TransferHookB
      }
    | {
        kind: 'TransferHookReward'
        value?: AccountsType_TransferHookReward
      }
    | {
        kind: 'TransferHookInput'
        value?: AccountsType_TransferHookInput
      }
    | {
        kind: 'TransferHookIntermediate'
        value?: AccountsType_TransferHookIntermediate
      }
    | {
        kind: 'TransferHookOutput'
        value?: AccountsType_TransferHookOutput
      }
    | {
        kind: 'SupplementalTickArrays'
        value?: AccountsType_SupplementalTickArrays
      }
    | {
        kind: 'SupplementalTickArraysOne'
        value?: AccountsType_SupplementalTickArraysOne
      }
    | {
        kind: 'SupplementalTickArraysTwo'
        value?: AccountsType_SupplementalTickArraysTwo
      }

export const AccountsType: Codec<AccountsType> = sum(1, {
    TransferHookA: {
        discriminator: 0,
        value: AccountsType_TransferHookA,
    },
    TransferHookB: {
        discriminator: 1,
        value: AccountsType_TransferHookB,
    },
    TransferHookReward: {
        discriminator: 2,
        value: AccountsType_TransferHookReward,
    },
    TransferHookInput: {
        discriminator: 3,
        value: AccountsType_TransferHookInput,
    },
    TransferHookIntermediate: {
        discriminator: 4,
        value: AccountsType_TransferHookIntermediate,
    },
    TransferHookOutput: {
        discriminator: 5,
        value: AccountsType_TransferHookOutput,
    },
    SupplementalTickArrays: {
        discriminator: 6,
        value: AccountsType_SupplementalTickArrays,
    },
    SupplementalTickArraysOne: {
        discriminator: 7,
        value: AccountsType_SupplementalTickArraysOne,
    },
    SupplementalTickArraysTwo: {
        discriminator: 8,
        value: AccountsType_SupplementalTickArraysTwo,
    },
})

export interface RemainingAccountsInfo {
    slices: Array<RemainingAccountsSlice>
}

export const RemainingAccountsInfo: Codec<RemainingAccountsInfo> = struct({
    slices: array(ref(() => RemainingAccountsSlice)),
})

export interface RemainingAccountsSlice {
    accountsType: AccountsType
    length: number
}

export const RemainingAccountsSlice: Codec<RemainingAccountsSlice> = struct({
    accountsType: ref(() => AccountsType),
    length: u8,
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

export interface WhirlpoolsConfigExtension {
    whirlpoolsConfig: string
    configExtensionAuthority: string
    tokenBadgeAuthority: string
}

export const WhirlpoolsConfigExtension: Codec<WhirlpoolsConfigExtension> = struct({
    whirlpoolsConfig: address,
    configExtensionAuthority: address,
    tokenBadgeAuthority: address,
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

export interface LockConfig {
    position: string
    positionOwner: string
    whirlpool: string
    lockedTimestamp: bigint
    lockType: LockTypeLabel
}

export const LockConfig: Codec<LockConfig> = struct({
    position: address,
    positionOwner: address,
    whirlpool: address,
    lockedTimestamp: u64,
    lockType: ref(() => LockTypeLabel),
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

export interface PositionBundle {
    positionBundleMint: string
    positionBitmap: Array<number>
}

export const PositionBundle: Codec<PositionBundle> = struct({
    positionBundleMint: address,
    positionBitmap: fixedArray(u8, 32),
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

export interface TokenBadge {
    whirlpoolsConfig: string
    tokenMint: string
}

export const TokenBadge: Codec<TokenBadge> = struct({
    whirlpoolsConfig: address,
    tokenMint: address,
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

export interface LiquidityDecreased {
    whirlpool: string
    position: string
    tickLowerIndex: number
    tickUpperIndex: number
    liquidity: bigint
    tokenAAmount: bigint
    tokenBAmount: bigint
    tokenATransferFee: bigint
    tokenBTransferFee: bigint
}

export const LiquidityDecreased: Codec<LiquidityDecreased> = struct({
    whirlpool: address,
    position: address,
    tickLowerIndex: i32,
    tickUpperIndex: i32,
    liquidity: u128,
    tokenAAmount: u64,
    tokenBAmount: u64,
    tokenATransferFee: u64,
    tokenBTransferFee: u64,
})

export interface LiquidityIncreased {
    whirlpool: string
    position: string
    tickLowerIndex: number
    tickUpperIndex: number
    liquidity: bigint
    tokenAAmount: bigint
    tokenBAmount: bigint
    tokenATransferFee: bigint
    tokenBTransferFee: bigint
}

export const LiquidityIncreased: Codec<LiquidityIncreased> = struct({
    whirlpool: address,
    position: address,
    tickLowerIndex: i32,
    tickUpperIndex: i32,
    liquidity: u128,
    tokenAAmount: u64,
    tokenBAmount: u64,
    tokenATransferFee: u64,
    tokenBTransferFee: u64,
})

export interface PoolInitialized {
    whirlpool: string
    whirlpoolsConfig: string
    tokenMintA: string
    tokenMintB: string
    tickSpacing: number
    tokenProgramA: string
    tokenProgramB: string
    decimalsA: number
    decimalsB: number
    initialSqrtPrice: bigint
}

export const PoolInitialized: Codec<PoolInitialized> = struct({
    whirlpool: address,
    whirlpoolsConfig: address,
    tokenMintA: address,
    tokenMintB: address,
    tickSpacing: u16,
    tokenProgramA: address,
    tokenProgramB: address,
    decimalsA: u8,
    decimalsB: u8,
    initialSqrtPrice: u128,
})

export interface Traded {
    whirlpool: string
    aToB: boolean
    preSqrtPrice: bigint
    postSqrtPrice: bigint
    inputAmount: bigint
    outputAmount: bigint
    inputTransferFee: bigint
    outputTransferFee: bigint
    lpFee: bigint
    protocolFee: bigint
}

export const Traded: Codec<Traded> = struct({
    whirlpool: address,
    aToB: bool,
    preSqrtPrice: u128,
    postSqrtPrice: u128,
    inputAmount: u64,
    outputAmount: u64,
    inputTransferFee: u64,
    outputTransferFee: u64,
    lpFee: u64,
    protocolFee: u64,
})
