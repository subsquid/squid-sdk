import {struct, ref, address, unit, array, u64, u8, fixedArray, i64, i32, binary, u16, sum, option} from '@subsquid/borsh'
import {instruction} from './idl.support'

export const instructions = {
    initialize: instruction(
        {
            d8: '0xafaf6d1f0d989bed',
        },
        {
            payer: 0,
            config: 1,
            systemProgram: 2,
        },
        struct({
            initialConfig: ref(() => Config),
        }),
    ),
    requestGovernanceAuthorityTransfer: instruction(
        {
            d8: '0x5c12439c1b97b7e0',
        },
        {
            payer: 0,
            config: 1,
        },
        struct({
            targetGovernanceAuthority: address,
        }),
    ),
    acceptGovernanceAuthorityTransfer: instruction(
        {
            d8: '0xfe27de4f40d9cd7f',
        },
        {
            payer: 0,
            config: 1,
        },
        unit
    ),
    setDataSources: instruction(
        {
            d8: '0x6b490f77c3745bd2',
        },
        {
            payer: 0,
            config: 1,
        },
        struct({
            validDataSources: array(ref(() => DataSource)),
        }),
    ),
    setFee: instruction(
        {
            d8: '0x129a1812edd61350',
        },
        {
            payer: 0,
            config: 1,
        },
        struct({
            singleUpdateFeeInLamports: u64,
        }),
    ),
    setWormholeAddress: instruction(
        {
            d8: '0x9aaefc9d5bd7b39c',
        },
        {
            payer: 0,
            config: 1,
        },
        struct({
            wormhole: address,
        }),
    ),
    setMinimumSignatures: instruction(
        {
            d8: '0x05d2ce7c2b446895',
        },
        {
            payer: 0,
            config: 1,
        },
        struct({
            minimumSignatures: u8,
        }),
    ),
    /**
     * Post a price update using a VAA and a MerklePriceUpdate.
     * This function allows you to post a price update in a single transaction.
     * Compared to post_update, it is less secure since you won't be able to verify all guardian signatures if you use this function because of transaction size limitations.
     * Typically, you can fit 5 guardian signatures in a transaction that uses this.
     */
    postUpdateAtomic: instruction(
        {
            d8: '0x31ac54c0afb434ea',
        },
        {
            payer: 0,
            /**
             * Instead we do the same steps in deserialize_guardian_set_checked.
             */
            guardianSet: 1,
            config: 2,
            treasury: 3,
            /**
             * The contraint is such that either the price_update_account is uninitialized or the payer is the write_authority.
             * Pubkey::default() is the SystemProgram on Solana and it can't sign so it's impossible that price_update_account.write_authority == Pubkey::default() once the account is initialized
             */
            priceUpdateAccount: 4,
            systemProgram: 5,
            writeAuthority: 6,
        },
        struct({
            params: ref(() => PostUpdateAtomicParams),
        }),
    ),
    /**
     * Post a price update using an encoded_vaa account and a MerklePriceUpdate calldata.
     * This should be called after the client has already verified the Vaa via the Wormhole contract.
     * Check out target_chains/solana/cli/src/main.rs for an example of how to do this.
     */
    postUpdate: instruction(
        {
            d8: '0x855fcfaf0b4f762c',
        },
        {
            payer: 0,
            encodedVaa: 1,
            config: 2,
            treasury: 3,
            /**
             * The contraint is such that either the price_update_account is uninitialized or the payer is the write_authority.
             * Pubkey::default() is the SystemProgram on Solana and it can't sign so it's impossible that price_update_account.write_authority == Pubkey::default() once the account is initialized
             */
            priceUpdateAccount: 4,
            systemProgram: 5,
            writeAuthority: 6,
        },
        struct({
            params: ref(() => PostUpdateParams),
        }),
    ),
    reclaimRent: instruction(
        {
            d8: '0xdac813c5e359c016',
        },
        {
            payer: 0,
            priceUpdateAccount: 1,
        },
        unit
    ),
}

export const PriceFeedMessage = struct({
    feedId: fixedArray(u8, 32),
    price: i64,
    conf: u64,
    exponent: i32,
    publishTime: i64,
    prevPublishTime: i64,
    emaPrice: i64,
    emaConf: u64,
})

export const MerklePriceUpdate = struct({
    message: binary,
    proof: array(fixedArray(u8, 20)),
})

export const DataSource = struct({
    chain: u16,
    emitter: address,
})

export const PostUpdateAtomicParams = struct({
    vaa: binary,
    merklePriceUpdate: ref(() => MerklePriceUpdate),
    treasuryId: u8,
})

export const PostUpdateParams = struct({
    merklePriceUpdate: ref(() => MerklePriceUpdate),
    treasuryId: u8,
})

export const VerificationLevel = sum(1, {
    Partial: {
        discriminator: 0,
        value: struct({
            numSignatures: u8,
        }),
    },
    Full: {
        discriminator: 1,
        value: unit,
    },
})

export const Config = struct({
    governanceAuthority: address,
    targetGovernanceAuthority: option(address),
    wormhole: address,
    validDataSources: array(ref(() => DataSource)),
    singleUpdateFeeInLamports: u64,
    minimumSignatures: u8,
})

export const priceUpdateV2 = struct({
    writeAuthority: address,
    verificationLevel: ref(() => VerificationLevel),
    priceMessage: ref(() => PriceFeedMessage),
    postedSlot: u64,
})
