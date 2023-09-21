import {sts} from '../../pallet.support'
import {Perquintill} from './types'

/**
 * Reduce or remove an outstanding receipt, placing the according proportion of funds into
 * the account of the owner.
 * 
 * - `origin`: Must be Signed and the account must be the owner of the receipt `index` as
 *   well as any fungible counterpart.
 * - `index`: The index of the receipt.
 * - `portion`: If `Some`, then only the given portion of the receipt should be thawed. If
 *   `None`, then all of it should be.
 */
export type NisThawPrivateCall = {
    index: number,
    maybeProportion?: (Perquintill | undefined),
}

export const NisThawPrivateCall: sts.Type<NisThawPrivateCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        maybeProportion: sts.option(() => Perquintill),
    }
})

/**
 * Reduce or remove an outstanding receipt, placing the according proportion of funds into
 * the account of the owner.
 * 
 * - `origin`: Must be Signed and the account must be the owner of the fungible counterpart
 *   for receipt `index`.
 * - `index`: The index of the receipt.
 */
export type NisThawCommunalCall = {
    index: number,
}

export const NisThawCommunalCall: sts.Type<NisThawCommunalCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * Make a communal receipt private and burn fungible counterparts from its owner.
 */
export type NisPrivatizeCall = {
    index: number,
}

export const NisPrivatizeCall: sts.Type<NisPrivatizeCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * Make a private receipt communal and create fungible counterparts for its owner.
 */
export type NisCommunifyCall = {
    index: number,
}

export const NisCommunifyCall: sts.Type<NisCommunifyCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})
