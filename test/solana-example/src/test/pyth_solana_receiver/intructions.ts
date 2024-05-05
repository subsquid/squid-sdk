import {struct, ref, address, unit, array, u64, u8} from '@subsquid/borsh'
import {instruction} from '../idl.support'
import {ConfigType, Config, DataSourceType, DataSource, PostUpdateAtomicParamsType, PostUpdateAtomicParams, PostUpdateParamsType, PostUpdateParams} from './types'

export type InitializeType = {
    initialConfig: ConfigType
}

export const initialize = instruction(
    {
        d8: '0xafaf6d1f0d989bed',
    },
    {
        payer: 0,
        config: 1,
        systemProgram: 2,
    },
    struct({
        initialConfig: Config,
    }),
)

export type RequestGovernanceAuthorityTransferType = {
    targetGovernanceAuthority: string
}

export const requestGovernanceAuthorityTransfer = instruction(
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
)

export type AcceptGovernanceAuthorityTransferType = {
}

export const acceptGovernanceAuthorityTransfer = instruction(
    {
        d8: '0xfe27de4f40d9cd7f',
    },
    {
        payer: 0,
        config: 1,
    },
    unit
)

export type SetDataSourcesType = {
    validDataSources: Array<DataSourceType>
}

export const setDataSources = instruction(
    {
        d8: '0x6b490f77c3745bd2',
    },
    {
        payer: 0,
        config: 1,
    },
    struct({
        validDataSources: array(DataSource),
    }),
)

export type SetFeeType = {
    singleUpdateFeeInLamports: bigint
}

export const setFee = instruction(
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
)

export type SetWormholeAddressType = {
    wormhole: string
}

export const setWormholeAddress = instruction(
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
)

export type SetMinimumSignaturesType = {
    minimumSignatures: number
}

export const setMinimumSignatures = instruction(
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
)

/**
 * Post a price update using a VAA and a MerklePriceUpdate.
 * This function allows you to post a price update in a single transaction.
 * Compared to post_update, it is less secure since you won't be able to verify all guardian signatures if you use this function because of transaction size limitations.
 * Typically, you can fit 5 guardian signatures in a transaction that uses this.
 */
export type PostUpdateAtomicType = {
    params: PostUpdateAtomicParamsType
}

/**
 * Post a price update using a VAA and a MerklePriceUpdate.
 * This function allows you to post a price update in a single transaction.
 * Compared to post_update, it is less secure since you won't be able to verify all guardian signatures if you use this function because of transaction size limitations.
 * Typically, you can fit 5 guardian signatures in a transaction that uses this.
 */
export const postUpdateAtomic = instruction(
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
        params: PostUpdateAtomicParams,
    }),
)

/**
 * Post a price update using an encoded_vaa account and a MerklePriceUpdate calldata.
 * This should be called after the client has already verified the Vaa via the Wormhole contract.
 * Check out target_chains/solana/cli/src/main.rs for an example of how to do this.
 */
export type PostUpdateType = {
    params: PostUpdateParamsType
}

/**
 * Post a price update using an encoded_vaa account and a MerklePriceUpdate calldata.
 * This should be called after the client has already verified the Vaa via the Wormhole contract.
 * Check out target_chains/solana/cli/src/main.rs for an example of how to do this.
 */
export const postUpdate = instruction(
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
        params: PostUpdateParams,
    }),
)

export type ReclaimRentType = {
}

export const reclaimRent = instruction(
    {
        d8: '0xdac813c5e359c016',
    },
    {
        payer: 0,
        priceUpdateAccount: 1,
    },
    unit
)
