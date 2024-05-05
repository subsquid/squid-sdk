import {Codec, struct, fixedArray, u8, i64, u64, i32, binary, array, u16, address, ref, unit, sum, option} from '@subsquid/borsh'

export type PriceFeedMessageType = {
    feedId: Array<number>
    price: bigint
    conf: bigint
    exponent: number
    publishTime: bigint
    prevPublishTime: bigint
    emaPrice: bigint
    emaConf: bigint
}

export const PriceFeedMessage: Codec<PriceFeedMessageType> = struct({
    feedId: fixedArray(u8, 32),
    price: i64,
    conf: u64,
    exponent: i32,
    publishTime: i64,
    prevPublishTime: i64,
    emaPrice: i64,
    emaConf: u64,
})

export type MerklePriceUpdateType = {
    message: Uint8Array
    proof: Array<Array<number>>
}

export const MerklePriceUpdate: Codec<MerklePriceUpdateType> = struct({
    message: binary,
    proof: array(fixedArray(u8, 20)),
})

export type DataSourceType = {
    chain: number
    emitter: string
}

export const DataSource: Codec<DataSourceType> = struct({
    chain: u16,
    emitter: address,
})

export type PostUpdateAtomicParamsType = {
    vaa: Uint8Array
    merklePriceUpdate: MerklePriceUpdateType
    treasuryId: number
}

export const PostUpdateAtomicParams: Codec<PostUpdateAtomicParamsType> = struct({
    vaa: binary,
    merklePriceUpdate: ref(() => MerklePriceUpdate),
    treasuryId: u8,
})

export type PostUpdateParamsType = {
    merklePriceUpdate: MerklePriceUpdateType
    treasuryId: number
}

export const PostUpdateParams: Codec<PostUpdateParamsType> = struct({
    merklePriceUpdate: ref(() => MerklePriceUpdate),
    treasuryId: u8,
})

export type VerificationLevelType_Partial = {
    numSignatures: number
}

export const VerificationLevel_Partial = struct({
    numSignatures: u8,
})

export type VerificationLevelType_Full = undefined

export const VerificationLevel_Full = unit

export type VerificationLevelType = 
    | {
        kind: 'Partial'
        value: VerificationLevelType_Partial
    }
    | {
        kind: 'Full'
        value?: VerificationLevelType_Full
    }

export const VerificationLevel: Codec<VerificationLevelType> = sum(1, {
    Partial: {
        discriminator: 0,
        value: VerificationLevel_Partial,
    },
    Full: {
        discriminator: 1,
        value: VerificationLevel_Full,
    },
})

export type ConfigType = {
    governanceAuthority: string
    targetGovernanceAuthority?: string | undefined
    wormhole: string
    validDataSources: Array<DataSourceType>
    singleUpdateFeeInLamports: bigint
    minimumSignatures: number
}

export const Config: Codec<ConfigType> = struct({
    governanceAuthority: address,
    targetGovernanceAuthority: option(address),
    wormhole: address,
    validDataSources: array(ref(() => DataSource)),
    singleUpdateFeeInLamports: u64,
    minimumSignatures: u8,
})

export type PriceUpdateV2Type = {
    writeAuthority: string
    verificationLevel: VerificationLevelType
    priceMessage: PriceFeedMessageType
    postedSlot: bigint
}

export const priceUpdateV2: Codec<PriceUpdateV2Type> = struct({
    writeAuthority: address,
    verificationLevel: ref(() => VerificationLevel),
    priceMessage: ref(() => PriceFeedMessage),
    postedSlot: u64,
})
