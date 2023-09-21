import {sts} from '../../pallet.support'
import {LookupSource, Hash} from './types'

/**
 *  Set the off-boarding information for a parachain.
 * 
 *  The origin *must* be a parachain account.
 * 
 *  - `dest` is the destination account to receive the parachain's deposit.
 */
export type SlotsSetOffboardingCall = {
    dest: LookupSource,
}

export const SlotsSetOffboardingCall: sts.Type<SlotsSetOffboardingCall> = sts.struct(() => {
    return  {
        dest: LookupSource,
    }
})

/**
 *  Set the deploy information for a successful bid to deploy a new parachain.
 * 
 *  - `origin` must be the successful bidder account.
 *  - `sub` is the sub-bidder ID of the bidder.
 *  - `para_id` is the parachain ID allotted to the winning bidder.
 *  - `code_hash` is the hash of the parachain's Wasm validation function.
 *  - `initial_head_data` is the parachain's initial head data.
 */
export type SlotsFixDeployDataCall = {
    sub: number,
    para_id: number,
    code_hash: Hash,
    code_size: number,
    initial_head_data: Bytes,
}

export const SlotsFixDeployDataCall: sts.Type<SlotsFixDeployDataCall> = sts.struct(() => {
    return  {
        sub: sts.number(),
        para_id: sts.number(),
        code_hash: Hash,
        code_size: sts.number(),
        initial_head_data: sts.bytes(),
    }
})
