import {struct, address, u16, ref, u128, i32, u8, u64, unit, bool, i128, fixedArray, sum} from '@subsquid/borsh'
import {instruction} from './idl.support'

export const instructions = {
    initializeConfig: instruction(
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
    ),
    initializePool: instruction(
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
            bumps: ref(() => WhirlpoolBumps),
            tickSpacing: u16,
            initialSqrtPrice: u128,
        }),
    ),
    initializeTickArray: instruction(
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
    ),
    initializeFeeTier: instruction(
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
    ),
    initializeReward: instruction(
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
    ),
    setRewardEmissions: instruction(
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
    ),
    openPosition: instruction(
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
            bumps: ref(() => OpenPositionBumps),
            tickLowerIndex: i32,
            tickUpperIndex: i32,
        }),
    ),
    openPositionWithMetadata: instruction(
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
            bumps: ref(() => OpenPositionWithMetadataBumps),
            tickLowerIndex: i32,
            tickUpperIndex: i32,
        }),
    ),
    increaseLiquidity: instruction(
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
    ),
    decreaseLiquidity: instruction(
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
    ),
    updateFeesAndRewards: instruction(
        {
            d8: '0x9ae6fa0decd14bdf',
        },
        {
            whirlpool: 0,
            position: 1,
            tickArrayLower: 2,
            tickArrayUpper: 3,
        },
        unit
    ),
    collectFees: instruction(
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
        unit
    ),
    collectReward: instruction(
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
    ),
    collectProtocolFees: instruction(
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
        unit
    ),
    swap: instruction(
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
    ),
    closePosition: instruction(
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
        unit
    ),
    setDefaultFeeRate: instruction(
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
    ),
    setDefaultProtocolFeeRate: instruction(
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
    ),
    setFeeRate: instruction(
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
    ),
    setProtocolFeeRate: instruction(
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
    ),
    setFeeAuthority: instruction(
        {
            d8: '0x1f013257ed656184',
        },
        {
            whirlpoolsConfig: 0,
            feeAuthority: 1,
            newFeeAuthority: 2,
        },
        unit
    ),
    setCollectProtocolFeesAuthority: instruction(
        {
            d8: '0x22965df48be1e943',
        },
        {
            whirlpoolsConfig: 0,
            collectProtocolFeesAuthority: 1,
            newCollectProtocolFeesAuthority: 2,
        },
        unit
    ),
    setRewardAuthority: instruction(
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
    ),
    setRewardAuthorityBySuperAuthority: instruction(
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
    ),
    setRewardEmissionsSuperAuthority: instruction(
        {
            d8: '0xcf05c8d17a3852b7',
        },
        {
            whirlpoolsConfig: 0,
            rewardEmissionsSuperAuthority: 1,
            newRewardEmissionsSuperAuthority: 2,
        },
        unit
    ),
    twoHopSwap: instruction(
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
    ),
    initializePositionBundle: instruction(
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
        unit
    ),
    initializePositionBundleWithMetadata: instruction(
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
        unit
    ),
    deletePositionBundle: instruction(
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
        unit
    ),
    openBundledPosition: instruction(
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
    ),
    closeBundledPosition: instruction(
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
    ),
}

export const OpenPositionBumps = struct({
    positionBump: u8,
})

export const OpenPositionWithMetadataBumps = struct({
    positionBump: u8,
    metadataBump: u8,
})

export const PositionRewardInfo = struct({
    growthInsideCheckpoint: u128,
    amountOwed: u64,
})

export const Tick = struct({
    initialized: bool,
    liquidityNet: i128,
    liquidityGross: u128,
    feeGrowthOutsideA: u128,
    feeGrowthOutsideB: u128,
    rewardGrowthsOutside: fixedArray(u128, 3),
})

export const WhirlpoolRewardInfo = struct({
    mint: address,
    vault: address,
    authority: address,
    emissionsPerSecondX64: u128,
    growthGlobalX64: u128,
})

export const WhirlpoolBumps = struct({
    whirlpoolBump: u8,
})

export const CurrIndex = sum(1, {
    Below: {
        discriminator: 0,
        value: unit,
    },
    Inside: {
        discriminator: 1,
        value: unit,
    },
    Above: {
        discriminator: 2,
        value: unit,
    },
})

export const TickLabel = sum(1, {
    Upper: {
        discriminator: 0,
        value: unit,
    },
    Lower: {
        discriminator: 1,
        value: unit,
    },
})

export const Direction = sum(1, {
    Left: {
        discriminator: 0,
        value: unit,
    },
    Right: {
        discriminator: 1,
        value: unit,
    },
})

export const WhirlpoolsConfig = struct({
    feeAuthority: address,
    collectProtocolFeesAuthority: address,
    rewardEmissionsSuperAuthority: address,
    defaultProtocolFeeRate: u16,
})

export const FeeTier = struct({
    whirlpoolsConfig: address,
    tickSpacing: u16,
    defaultFeeRate: u16,
})

export const PositionBundle = struct({
    positionBundleMint: address,
    positionBitmap: fixedArray(u8, 32),
})

export const Position = struct({
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

export const TickArray = struct({
    startTickIndex: i32,
    ticks: fixedArray(ref(() => Tick), 88),
    whirlpool: address,
})

export const Whirlpool = struct({
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
