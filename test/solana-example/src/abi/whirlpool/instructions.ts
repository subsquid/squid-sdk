import {address, bool, i32, option, struct, u128, u16, u32, u64, u8, unit} from '@subsquid/borsh'
import {instruction} from '../abi.support'
import {LockType, OpenPositionBumps, OpenPositionWithMetadataBumps, RemainingAccountsInfo, WhirlpoolBumps} from './types'

export interface InitializeConfig {
    feeAuthority: string
    collectProtocolFeesAuthority: string
    rewardEmissionsSuperAuthority: string
    defaultProtocolFeeRate: number
}

export const initializeConfig = instruction(
    {
        d8: '0xd07f1501c2bec446',
    },
    {
        config: 0,
        funder: 1,
        systemProgram: 2,
    },
    struct({
        feeAuthority: address,
        collectProtocolFeesAuthority: address,
        rewardEmissionsSuperAuthority: address,
        defaultProtocolFeeRate: u16,
    }),
)

export interface InitializePool {
    bumps: WhirlpoolBumps
    tickSpacing: number
    initialSqrtPrice: bigint
}

export const initializePool = instruction(
    {
        d8: '0x5fb40aac54aee828',
    },
    {
        whirlpoolsConfig: 0,
        tokenMintA: 1,
        tokenMintB: 2,
        funder: 3,
        whirlpool: 4,
        tokenVaultA: 5,
        tokenVaultB: 6,
        feeTier: 7,
        tokenProgram: 8,
        systemProgram: 9,
        rent: 10,
    },
    struct({
        bumps: WhirlpoolBumps,
        tickSpacing: u16,
        initialSqrtPrice: u128,
    }),
)

export interface InitializeTickArray {
    startTickIndex: number
}

export const initializeTickArray = instruction(
    {
        d8: '0x0bbcc1d68d5b95b8',
    },
    {
        whirlpool: 0,
        funder: 1,
        tickArray: 2,
        systemProgram: 3,
    },
    struct({
        startTickIndex: i32,
    }),
)

export interface InitializeFeeTier {
    tickSpacing: number
    defaultFeeRate: number
}

export const initializeFeeTier = instruction(
    {
        d8: '0xb74a9ca070022a1e',
    },
    {
        config: 0,
        feeTier: 1,
        funder: 2,
        feeAuthority: 3,
        systemProgram: 4,
    },
    struct({
        tickSpacing: u16,
        defaultFeeRate: u16,
    }),
)

export interface InitializeReward {
    rewardIndex: number
}

export const initializeReward = instruction(
    {
        d8: '0x5f87c0c4f281e644',
    },
    {
        rewardAuthority: 0,
        funder: 1,
        whirlpool: 2,
        rewardMint: 3,
        rewardVault: 4,
        tokenProgram: 5,
        systemProgram: 6,
        rent: 7,
    },
    struct({
        rewardIndex: u8,
    }),
)

export interface SetRewardEmissions {
    rewardIndex: number
    emissionsPerSecondX64: bigint
}

export const setRewardEmissions = instruction(
    {
        d8: '0x0dc556a86db01bf4',
    },
    {
        whirlpool: 0,
        rewardAuthority: 1,
        rewardVault: 2,
    },
    struct({
        rewardIndex: u8,
        emissionsPerSecondX64: u128,
    }),
)

export interface OpenPosition {
    bumps: OpenPositionBumps
    tickLowerIndex: number
    tickUpperIndex: number
}

export const openPosition = instruction(
    {
        d8: '0x87802f4d0f98f031',
    },
    {
        funder: 0,
        owner: 1,
        position: 2,
        positionMint: 3,
        positionTokenAccount: 4,
        whirlpool: 5,
        tokenProgram: 6,
        systemProgram: 7,
        rent: 8,
        associatedTokenProgram: 9,
    },
    struct({
        bumps: OpenPositionBumps,
        tickLowerIndex: i32,
        tickUpperIndex: i32,
    }),
)

export interface OpenPositionWithMetadata {
    bumps: OpenPositionWithMetadataBumps
    tickLowerIndex: number
    tickUpperIndex: number
}

export const openPositionWithMetadata = instruction(
    {
        d8: '0xf21d86303a6e0e3c',
    },
    {
        funder: 0,
        owner: 1,
        position: 2,
        positionMint: 3,
        positionMetadataAccount: 4,
        positionTokenAccount: 5,
        whirlpool: 6,
        tokenProgram: 7,
        systemProgram: 8,
        rent: 9,
        associatedTokenProgram: 10,
        metadataProgram: 11,
        metadataUpdateAuth: 12,
    },
    struct({
        bumps: OpenPositionWithMetadataBumps,
        tickLowerIndex: i32,
        tickUpperIndex: i32,
    }),
)

export interface IncreaseLiquidity {
    liquidityAmount: bigint
    tokenMaxA: bigint
    tokenMaxB: bigint
}

export const increaseLiquidity = instruction(
    {
        d8: '0x2e9cf3760dcdfbb2',
    },
    {
        whirlpool: 0,
        tokenProgram: 1,
        positionAuthority: 2,
        position: 3,
        positionTokenAccount: 4,
        tokenOwnerAccountA: 5,
        tokenOwnerAccountB: 6,
        tokenVaultA: 7,
        tokenVaultB: 8,
        tickArrayLower: 9,
        tickArrayUpper: 10,
    },
    struct({
        liquidityAmount: u128,
        tokenMaxA: u64,
        tokenMaxB: u64,
    }),
)

export interface DecreaseLiquidity {
    liquidityAmount: bigint
    tokenMinA: bigint
    tokenMinB: bigint
}

export const decreaseLiquidity = instruction(
    {
        d8: '0xa026d06f685b2c01',
    },
    {
        whirlpool: 0,
        tokenProgram: 1,
        positionAuthority: 2,
        position: 3,
        positionTokenAccount: 4,
        tokenOwnerAccountA: 5,
        tokenOwnerAccountB: 6,
        tokenVaultA: 7,
        tokenVaultB: 8,
        tickArrayLower: 9,
        tickArrayUpper: 10,
    },
    struct({
        liquidityAmount: u128,
        tokenMinA: u64,
        tokenMinB: u64,
    }),
)

export type UpdateFeesAndRewards = undefined

export const updateFeesAndRewards = instruction(
    {
        d8: '0x9ae6fa0decd14bdf',
    },
    {
        whirlpool: 0,
        position: 1,
        tickArrayLower: 2,
        tickArrayUpper: 3,
    },
    unit,
)

export type CollectFees = undefined

export const collectFees = instruction(
    {
        d8: '0xa498cf631eba13b6',
    },
    {
        whirlpool: 0,
        positionAuthority: 1,
        position: 2,
        positionTokenAccount: 3,
        tokenOwnerAccountA: 4,
        tokenVaultA: 5,
        tokenOwnerAccountB: 6,
        tokenVaultB: 7,
        tokenProgram: 8,
    },
    unit,
)

export interface CollectReward {
    rewardIndex: number
}

export const collectReward = instruction(
    {
        d8: '0x4605845756ebb122',
    },
    {
        whirlpool: 0,
        positionAuthority: 1,
        position: 2,
        positionTokenAccount: 3,
        rewardOwnerAccount: 4,
        rewardVault: 5,
        tokenProgram: 6,
    },
    struct({
        rewardIndex: u8,
    }),
)

export type CollectProtocolFees = undefined

export const collectProtocolFees = instruction(
    {
        d8: '0x1643176296b246dc',
    },
    {
        whirlpoolsConfig: 0,
        whirlpool: 1,
        collectProtocolFeesAuthority: 2,
        tokenVaultA: 3,
        tokenVaultB: 4,
        tokenDestinationA: 5,
        tokenDestinationB: 6,
        tokenProgram: 7,
    },
    unit,
)

export interface Swap {
    amount: bigint
    otherAmountThreshold: bigint
    sqrtPriceLimit: bigint
    amountSpecifiedIsInput: boolean
    aToB: boolean
}

export const swap = instruction(
    {
        d8: '0xf8c69e91e17587c8',
    },
    {
        tokenProgram: 0,
        tokenAuthority: 1,
        whirlpool: 2,
        tokenOwnerAccountA: 3,
        tokenVaultA: 4,
        tokenOwnerAccountB: 5,
        tokenVaultB: 6,
        tickArray0: 7,
        tickArray1: 8,
        tickArray2: 9,
        oracle: 10,
    },
    struct({
        amount: u64,
        otherAmountThreshold: u64,
        sqrtPriceLimit: u128,
        amountSpecifiedIsInput: bool,
        aToB: bool,
    }),
)

export type ClosePosition = undefined

export const closePosition = instruction(
    {
        d8: '0x7b86510031446262',
    },
    {
        positionAuthority: 0,
        receiver: 1,
        position: 2,
        positionMint: 3,
        positionTokenAccount: 4,
        tokenProgram: 5,
    },
    unit,
)

export interface SetDefaultFeeRate {
    defaultFeeRate: number
}

export const setDefaultFeeRate = instruction(
    {
        d8: '0x76d7d69db6e5d0e4',
    },
    {
        whirlpoolsConfig: 0,
        feeTier: 1,
        feeAuthority: 2,
    },
    struct({
        defaultFeeRate: u16,
    }),
)

export interface SetDefaultProtocolFeeRate {
    defaultProtocolFeeRate: number
}

export const setDefaultProtocolFeeRate = instruction(
    {
        d8: '0x6bcdf9e297235600',
    },
    {
        whirlpoolsConfig: 0,
        feeAuthority: 1,
    },
    struct({
        defaultProtocolFeeRate: u16,
    }),
)

export interface SetFeeRate {
    feeRate: number
}

export const setFeeRate = instruction(
    {
        d8: '0x35f38941088c9e06',
    },
    {
        whirlpoolsConfig: 0,
        whirlpool: 1,
        feeAuthority: 2,
    },
    struct({
        feeRate: u16,
    }),
)

export interface SetProtocolFeeRate {
    protocolFeeRate: number
}

export const setProtocolFeeRate = instruction(
    {
        d8: '0x5f0704329a4f9c83',
    },
    {
        whirlpoolsConfig: 0,
        whirlpool: 1,
        feeAuthority: 2,
    },
    struct({
        protocolFeeRate: u16,
    }),
)

export type SetFeeAuthority = undefined

export const setFeeAuthority = instruction(
    {
        d8: '0x1f013257ed656184',
    },
    {
        whirlpoolsConfig: 0,
        feeAuthority: 1,
        newFeeAuthority: 2,
    },
    unit,
)

export type SetCollectProtocolFeesAuthority = undefined

export const setCollectProtocolFeesAuthority = instruction(
    {
        d8: '0x22965df48be1e943',
    },
    {
        whirlpoolsConfig: 0,
        collectProtocolFeesAuthority: 1,
        newCollectProtocolFeesAuthority: 2,
    },
    unit,
)

export interface SetRewardAuthority {
    rewardIndex: number
}

export const setRewardAuthority = instruction(
    {
        d8: '0x2227b7fc531c557f',
    },
    {
        whirlpool: 0,
        rewardAuthority: 1,
        newRewardAuthority: 2,
    },
    struct({
        rewardIndex: u8,
    }),
)

export interface SetRewardAuthorityBySuperAuthority {
    rewardIndex: number
}

export const setRewardAuthorityBySuperAuthority = instruction(
    {
        d8: '0xf09ac9c6945d3819',
    },
    {
        whirlpoolsConfig: 0,
        whirlpool: 1,
        rewardEmissionsSuperAuthority: 2,
        newRewardAuthority: 3,
    },
    struct({
        rewardIndex: u8,
    }),
)

export type SetRewardEmissionsSuperAuthority = undefined

export const setRewardEmissionsSuperAuthority = instruction(
    {
        d8: '0xcf05c8d17a3852b7',
    },
    {
        whirlpoolsConfig: 0,
        rewardEmissionsSuperAuthority: 1,
        newRewardEmissionsSuperAuthority: 2,
    },
    unit,
)

export interface TwoHopSwap {
    amount: bigint
    otherAmountThreshold: bigint
    amountSpecifiedIsInput: boolean
    aToBOne: boolean
    aToBTwo: boolean
    sqrtPriceLimitOne: bigint
    sqrtPriceLimitTwo: bigint
}

export const twoHopSwap = instruction(
    {
        d8: '0xc360ed6c44a2dbe6',
    },
    {
        tokenProgram: 0,
        tokenAuthority: 1,
        whirlpoolOne: 2,
        whirlpoolTwo: 3,
        tokenOwnerAccountOneA: 4,
        tokenVaultOneA: 5,
        tokenOwnerAccountOneB: 6,
        tokenVaultOneB: 7,
        tokenOwnerAccountTwoA: 8,
        tokenVaultTwoA: 9,
        tokenOwnerAccountTwoB: 10,
        tokenVaultTwoB: 11,
        tickArrayOne0: 12,
        tickArrayOne1: 13,
        tickArrayOne2: 14,
        tickArrayTwo0: 15,
        tickArrayTwo1: 16,
        tickArrayTwo2: 17,
        oracleOne: 18,
        oracleTwo: 19,
    },
    struct({
        amount: u64,
        otherAmountThreshold: u64,
        amountSpecifiedIsInput: bool,
        aToBOne: bool,
        aToBTwo: bool,
        sqrtPriceLimitOne: u128,
        sqrtPriceLimitTwo: u128,
    }),
)

export type InitializePositionBundle = undefined

export const initializePositionBundle = instruction(
    {
        d8: '0x752df1951812c241',
    },
    {
        positionBundle: 0,
        positionBundleMint: 1,
        positionBundleTokenAccount: 2,
        positionBundleOwner: 3,
        funder: 4,
        tokenProgram: 5,
        systemProgram: 6,
        rent: 7,
        associatedTokenProgram: 8,
    },
    unit,
)

export type InitializePositionBundleWithMetadata = undefined

export const initializePositionBundleWithMetadata = instruction(
    {
        d8: '0x5d7c10b3f98373f5',
    },
    {
        positionBundle: 0,
        positionBundleMint: 1,
        positionBundleMetadata: 2,
        positionBundleTokenAccount: 3,
        positionBundleOwner: 4,
        funder: 5,
        metadataUpdateAuth: 6,
        tokenProgram: 7,
        systemProgram: 8,
        rent: 9,
        associatedTokenProgram: 10,
        metadataProgram: 11,
    },
    unit,
)

export type DeletePositionBundle = undefined

export const deletePositionBundle = instruction(
    {
        d8: '0x64196302d9ef7cad',
    },
    {
        positionBundle: 0,
        positionBundleMint: 1,
        positionBundleTokenAccount: 2,
        positionBundleOwner: 3,
        receiver: 4,
        tokenProgram: 5,
    },
    unit,
)

export interface OpenBundledPosition {
    bundleIndex: number
    tickLowerIndex: number
    tickUpperIndex: number
}

export const openBundledPosition = instruction(
    {
        d8: '0xa9717eabd5acd431',
    },
    {
        bundledPosition: 0,
        positionBundle: 1,
        positionBundleTokenAccount: 2,
        positionBundleAuthority: 3,
        whirlpool: 4,
        funder: 5,
        systemProgram: 6,
        rent: 7,
    },
    struct({
        bundleIndex: u16,
        tickLowerIndex: i32,
        tickUpperIndex: i32,
    }),
)

export interface CloseBundledPosition {
    bundleIndex: number
}

export const closeBundledPosition = instruction(
    {
        d8: '0x2924d8f51b556743',
    },
    {
        bundledPosition: 0,
        positionBundle: 1,
        positionBundleTokenAccount: 2,
        positionBundleAuthority: 3,
        receiver: 4,
    },
    struct({
        bundleIndex: u16,
    }),
)

export interface OpenPositionWithTokenExtensions {
    tickLowerIndex: number
    tickUpperIndex: number
    withTokenMetadataExtension: boolean
}

export const openPositionWithTokenExtensions = instruction(
    {
        d8: '0xd42f5f5c726683fa',
    },
    {
        funder: 0,
        owner: 1,
        position: 2,
        positionMint: 3,
        positionTokenAccount: 4,
        whirlpool: 5,
        token2022Program: 6,
        systemProgram: 7,
        associatedTokenProgram: 8,
        metadataUpdateAuth: 9,
    },
    struct({
        tickLowerIndex: i32,
        tickUpperIndex: i32,
        withTokenMetadataExtension: bool,
    }),
)

export type ClosePositionWithTokenExtensions = undefined

export const closePositionWithTokenExtensions = instruction(
    {
        d8: '0x01b6873b9b1963df',
    },
    {
        positionAuthority: 0,
        receiver: 1,
        position: 2,
        positionMint: 3,
        positionTokenAccount: 4,
        token2022Program: 5,
    },
    unit,
)

export interface LockPosition {
    lockType: LockType
}

export const lockPosition = instruction(
    {
        d8: '0xe33e02fcf70aabb9',
    },
    {
        funder: 0,
        positionAuthority: 1,
        position: 2,
        positionMint: 3,
        positionTokenAccount: 4,
        lockConfig: 5,
        whirlpool: 6,
        token2022Program: 7,
        systemProgram: 8,
    },
    struct({
        lockType: LockType,
    }),
)

export interface ResetPositionRange {
    newTickLowerIndex: number
    newTickUpperIndex: number
}

export const resetPositionRange = instruction(
    {
        d8: '0xa47bb48dc264a0af',
    },
    {
        funder: 0,
        positionAuthority: 1,
        whirlpool: 2,
        position: 3,
        positionTokenAccount: 4,
        systemProgram: 5,
    },
    struct({
        newTickLowerIndex: i32,
        newTickUpperIndex: i32,
    }),
)

export type TransferLockedPosition = undefined

export const transferLockedPosition = instruction(
    {
        d8: '0xb379e52e438ac28a',
    },
    {
        positionAuthority: 0,
        receiver: 1,
        position: 2,
        positionMint: 3,
        positionTokenAccount: 4,
        destinationTokenAccount: 5,
        lockConfig: 6,
        token2022Program: 7,
    },
    unit,
)

export interface InitializeAdaptiveFeeTier {
    feeTierIndex: number
    tickSpacing: number
    initializePoolAuthority: string
    delegatedFeeAuthority: string
    defaultBaseFeeRate: number
    filterPeriod: number
    decayPeriod: number
    reductionFactor: number
    adaptiveFeeControlFactor: number
    maxVolatilityAccumulator: number
    tickGroupSize: number
    majorSwapThresholdTicks: number
}

export const initializeAdaptiveFeeTier = instruction(
    {
        d8: '0x4d63d0c88d7b7530',
    },
    {
        whirlpoolsConfig: 0,
        adaptiveFeeTier: 1,
        funder: 2,
        feeAuthority: 3,
        systemProgram: 4,
    },
    struct({
        feeTierIndex: u16,
        tickSpacing: u16,
        initializePoolAuthority: address,
        delegatedFeeAuthority: address,
        defaultBaseFeeRate: u16,
        filterPeriod: u16,
        decayPeriod: u16,
        reductionFactor: u16,
        adaptiveFeeControlFactor: u32,
        maxVolatilityAccumulator: u32,
        tickGroupSize: u16,
        majorSwapThresholdTicks: u16,
    }),
)

export interface SetDefaultBaseFeeRate {
    defaultBaseFeeRate: number
}

export const setDefaultBaseFeeRate = instruction(
    {
        d8: '0xe54254fba486b707',
    },
    {
        whirlpoolsConfig: 0,
        adaptiveFeeTier: 1,
        feeAuthority: 2,
    },
    struct({
        defaultBaseFeeRate: u16,
    }),
)

export type SetDelegatedFeeAuthority = undefined

export const setDelegatedFeeAuthority = instruction(
    {
        d8: '0xc1eae7938a39037a',
    },
    {
        whirlpoolsConfig: 0,
        adaptiveFeeTier: 1,
        feeAuthority: 2,
        newDelegatedFeeAuthority: 3,
    },
    unit,
)

export type SetInitializePoolAuthority = undefined

export const setInitializePoolAuthority = instruction(
    {
        d8: '0x7d2b7feb951a6aec',
    },
    {
        whirlpoolsConfig: 0,
        adaptiveFeeTier: 1,
        feeAuthority: 2,
        newInitializePoolAuthority: 3,
    },
    unit,
)

export interface SetPresetAdaptiveFeeConstants {
    filterPeriod: number
    decayPeriod: number
    reductionFactor: number
    adaptiveFeeControlFactor: number
    maxVolatilityAccumulator: number
    tickGroupSize: number
    majorSwapThresholdTicks: number
}

export const setPresetAdaptiveFeeConstants = instruction(
    {
        d8: '0x84b94294535886c6',
    },
    {
        whirlpoolsConfig: 0,
        adaptiveFeeTier: 1,
        feeAuthority: 2,
    },
    struct({
        filterPeriod: u16,
        decayPeriod: u16,
        reductionFactor: u16,
        adaptiveFeeControlFactor: u32,
        maxVolatilityAccumulator: u32,
        tickGroupSize: u16,
        majorSwapThresholdTicks: u16,
    }),
)

export interface InitializePoolWithAdaptiveFee {
    initialSqrtPrice: bigint
    tradeEnableTimestamp?: bigint | undefined
}

export const initializePoolWithAdaptiveFee = instruction(
    {
        d8: '0x8f5e604cac7c77c7',
    },
    {
        whirlpoolsConfig: 0,
        tokenMintA: 1,
        tokenMintB: 2,
        tokenBadgeA: 3,
        tokenBadgeB: 4,
        funder: 5,
        initializePoolAuthority: 6,
        whirlpool: 7,
        oracle: 8,
        tokenVaultA: 9,
        tokenVaultB: 10,
        adaptiveFeeTier: 11,
        tokenProgramA: 12,
        tokenProgramB: 13,
        systemProgram: 14,
        rent: 15,
    },
    struct({
        initialSqrtPrice: u128,
        tradeEnableTimestamp: option(u64),
    }),
)

export interface SetFeeRateByDelegatedFeeAuthority {
    feeRate: number
}

export const setFeeRateByDelegatedFeeAuthority = instruction(
    {
        d8: '0x7979367283e6a268',
    },
    {
        whirlpool: 0,
        adaptiveFeeTier: 1,
        delegatedFeeAuthority: 2,
    },
    struct({
        feeRate: u16,
    }),
)

export interface CollectFeesV2 {
    remainingAccountsInfo?: RemainingAccountsInfo | undefined
}

export const collectFeesV2 = instruction(
    {
        d8: '0xcf755fbfe5b4e20f',
    },
    {
        whirlpool: 0,
        positionAuthority: 1,
        position: 2,
        positionTokenAccount: 3,
        tokenMintA: 4,
        tokenMintB: 5,
        tokenOwnerAccountA: 6,
        tokenVaultA: 7,
        tokenOwnerAccountB: 8,
        tokenVaultB: 9,
        tokenProgramA: 10,
        tokenProgramB: 11,
        memoProgram: 12,
    },
    struct({
        remainingAccountsInfo: option(RemainingAccountsInfo),
    }),
)

export interface CollectProtocolFeesV2 {
    remainingAccountsInfo?: RemainingAccountsInfo | undefined
}

export const collectProtocolFeesV2 = instruction(
    {
        d8: '0x6780de8672c816c8',
    },
    {
        whirlpoolsConfig: 0,
        whirlpool: 1,
        collectProtocolFeesAuthority: 2,
        tokenMintA: 3,
        tokenMintB: 4,
        tokenVaultA: 5,
        tokenVaultB: 6,
        tokenDestinationA: 7,
        tokenDestinationB: 8,
        tokenProgramA: 9,
        tokenProgramB: 10,
        memoProgram: 11,
    },
    struct({
        remainingAccountsInfo: option(RemainingAccountsInfo),
    }),
)

export interface CollectRewardV2 {
    rewardIndex: number
    remainingAccountsInfo?: RemainingAccountsInfo | undefined
}

export const collectRewardV2 = instruction(
    {
        d8: '0xb16b25b4a01331d1',
    },
    {
        whirlpool: 0,
        positionAuthority: 1,
        position: 2,
        positionTokenAccount: 3,
        rewardOwnerAccount: 4,
        rewardMint: 5,
        rewardVault: 6,
        rewardTokenProgram: 7,
        memoProgram: 8,
    },
    struct({
        rewardIndex: u8,
        remainingAccountsInfo: option(RemainingAccountsInfo),
    }),
)

export interface DecreaseLiquidityV2 {
    liquidityAmount: bigint
    tokenMinA: bigint
    tokenMinB: bigint
    remainingAccountsInfo?: RemainingAccountsInfo | undefined
}

export const decreaseLiquidityV2 = instruction(
    {
        d8: '0x3a7fbc3e4f52c460',
    },
    {
        whirlpool: 0,
        tokenProgramA: 1,
        tokenProgramB: 2,
        memoProgram: 3,
        positionAuthority: 4,
        position: 5,
        positionTokenAccount: 6,
        tokenMintA: 7,
        tokenMintB: 8,
        tokenOwnerAccountA: 9,
        tokenOwnerAccountB: 10,
        tokenVaultA: 11,
        tokenVaultB: 12,
        tickArrayLower: 13,
        tickArrayUpper: 14,
    },
    struct({
        liquidityAmount: u128,
        tokenMinA: u64,
        tokenMinB: u64,
        remainingAccountsInfo: option(RemainingAccountsInfo),
    }),
)

export interface IncreaseLiquidityV2 {
    liquidityAmount: bigint
    tokenMaxA: bigint
    tokenMaxB: bigint
    remainingAccountsInfo?: RemainingAccountsInfo | undefined
}

export const increaseLiquidityV2 = instruction(
    {
        d8: '0x851d59df45eeb00a',
    },
    {
        whirlpool: 0,
        tokenProgramA: 1,
        tokenProgramB: 2,
        memoProgram: 3,
        positionAuthority: 4,
        position: 5,
        positionTokenAccount: 6,
        tokenMintA: 7,
        tokenMintB: 8,
        tokenOwnerAccountA: 9,
        tokenOwnerAccountB: 10,
        tokenVaultA: 11,
        tokenVaultB: 12,
        tickArrayLower: 13,
        tickArrayUpper: 14,
    },
    struct({
        liquidityAmount: u128,
        tokenMaxA: u64,
        tokenMaxB: u64,
        remainingAccountsInfo: option(RemainingAccountsInfo),
    }),
)

export interface InitializePoolV2 {
    tickSpacing: number
    initialSqrtPrice: bigint
}

export const initializePoolV2 = instruction(
    {
        d8: '0xcf2d57f21b3fcc43',
    },
    {
        whirlpoolsConfig: 0,
        tokenMintA: 1,
        tokenMintB: 2,
        tokenBadgeA: 3,
        tokenBadgeB: 4,
        funder: 5,
        whirlpool: 6,
        tokenVaultA: 7,
        tokenVaultB: 8,
        feeTier: 9,
        tokenProgramA: 10,
        tokenProgramB: 11,
        systemProgram: 12,
        rent: 13,
    },
    struct({
        tickSpacing: u16,
        initialSqrtPrice: u128,
    }),
)

export interface InitializeRewardV2 {
    rewardIndex: number
}

export const initializeRewardV2 = instruction(
    {
        d8: '0x5b014d32ebe58531',
    },
    {
        rewardAuthority: 0,
        funder: 1,
        whirlpool: 2,
        rewardMint: 3,
        rewardTokenBadge: 4,
        rewardVault: 5,
        rewardTokenProgram: 6,
        systemProgram: 7,
        rent: 8,
    },
    struct({
        rewardIndex: u8,
    }),
)

export interface SetRewardEmissionsV2 {
    rewardIndex: number
    emissionsPerSecondX64: bigint
}

export const setRewardEmissionsV2 = instruction(
    {
        d8: '0x72e44820c130a066',
    },
    {
        whirlpool: 0,
        rewardAuthority: 1,
        rewardVault: 2,
    },
    struct({
        rewardIndex: u8,
        emissionsPerSecondX64: u128,
    }),
)

export interface SwapV2 {
    amount: bigint
    otherAmountThreshold: bigint
    sqrtPriceLimit: bigint
    amountSpecifiedIsInput: boolean
    aToB: boolean
    remainingAccountsInfo?: RemainingAccountsInfo | undefined
}

export const swapV2 = instruction(
    {
        d8: '0x2b04ed0b1ac91e62',
    },
    {
        tokenProgramA: 0,
        tokenProgramB: 1,
        memoProgram: 2,
        tokenAuthority: 3,
        whirlpool: 4,
        tokenMintA: 5,
        tokenMintB: 6,
        tokenOwnerAccountA: 7,
        tokenVaultA: 8,
        tokenOwnerAccountB: 9,
        tokenVaultB: 10,
        tickArray0: 11,
        tickArray1: 12,
        tickArray2: 13,
        oracle: 14,
    },
    struct({
        amount: u64,
        otherAmountThreshold: u64,
        sqrtPriceLimit: u128,
        amountSpecifiedIsInput: bool,
        aToB: bool,
        remainingAccountsInfo: option(RemainingAccountsInfo),
    }),
)

export interface TwoHopSwapV2 {
    amount: bigint
    otherAmountThreshold: bigint
    amountSpecifiedIsInput: boolean
    aToBOne: boolean
    aToBTwo: boolean
    sqrtPriceLimitOne: bigint
    sqrtPriceLimitTwo: bigint
    remainingAccountsInfo?: RemainingAccountsInfo | undefined
}

export const twoHopSwapV2 = instruction(
    {
        d8: '0xba8fd11dfe02c275',
    },
    {
        whirlpoolOne: 0,
        whirlpoolTwo: 1,
        tokenMintInput: 2,
        tokenMintIntermediate: 3,
        tokenMintOutput: 4,
        tokenProgramInput: 5,
        tokenProgramIntermediate: 6,
        tokenProgramOutput: 7,
        tokenOwnerAccountInput: 8,
        tokenVaultOneInput: 9,
        tokenVaultOneIntermediate: 10,
        tokenVaultTwoIntermediate: 11,
        tokenVaultTwoOutput: 12,
        tokenOwnerAccountOutput: 13,
        tokenAuthority: 14,
        tickArrayOne0: 15,
        tickArrayOne1: 16,
        tickArrayOne2: 17,
        tickArrayTwo0: 18,
        tickArrayTwo1: 19,
        tickArrayTwo2: 20,
        oracleOne: 21,
        oracleTwo: 22,
        memoProgram: 23,
    },
    struct({
        amount: u64,
        otherAmountThreshold: u64,
        amountSpecifiedIsInput: bool,
        aToBOne: bool,
        aToBTwo: bool,
        sqrtPriceLimitOne: u128,
        sqrtPriceLimitTwo: u128,
        remainingAccountsInfo: option(RemainingAccountsInfo),
    }),
)

export type InitializeConfigExtension = undefined

export const initializeConfigExtension = instruction(
    {
        d8: '0x370935097239d134',
    },
    {
        config: 0,
        configExtension: 1,
        funder: 2,
        feeAuthority: 3,
        systemProgram: 4,
    },
    unit,
)

export type SetConfigExtensionAuthority = undefined

export const setConfigExtensionAuthority = instruction(
    {
        d8: '0x2c5ef17418bc3c8f',
    },
    {
        whirlpoolsConfig: 0,
        whirlpoolsConfigExtension: 1,
        configExtensionAuthority: 2,
        newConfigExtensionAuthority: 3,
    },
    unit,
)

export type SetTokenBadgeAuthority = undefined

export const setTokenBadgeAuthority = instruction(
    {
        d8: '0xcfca0420cd4f0db2',
    },
    {
        whirlpoolsConfig: 0,
        whirlpoolsConfigExtension: 1,
        configExtensionAuthority: 2,
        newTokenBadgeAuthority: 3,
    },
    unit,
)

export type InitializeTokenBadge = undefined

export const initializeTokenBadge = instruction(
    {
        d8: '0xfd4dcd5f1be059df',
    },
    {
        whirlpoolsConfig: 0,
        whirlpoolsConfigExtension: 1,
        tokenBadgeAuthority: 2,
        tokenMint: 3,
        tokenBadge: 4,
        funder: 5,
        systemProgram: 6,
    },
    unit,
)

export type DeleteTokenBadge = undefined

export const deleteTokenBadge = instruction(
    {
        d8: '0x35924408127511b9',
    },
    {
        whirlpoolsConfig: 0,
        whirlpoolsConfigExtension: 1,
        tokenBadgeAuthority: 2,
        tokenMint: 3,
        tokenBadge: 4,
        receiver: 5,
    },
    unit,
)
