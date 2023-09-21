import {sts} from '../../pallet.support'
import {GrandpaEquivocationProof, KeyOwnerProof} from './types'

/**
 *  Report voter equivocation/misbehavior. This method will verify the
 *  equivocation proof and validate the given key ownership proof
 *  against the extracted offender. If both are valid, the offence
 *  will be reported.
 * 
 *  Since the weight of the extrinsic is 0, in order to avoid DoS by
 *  submission of invalid equivocation reports, a mandatory pre-validation of
 *  the extrinsic is implemented in a `SignedExtension`.
 */
export type GrandpaReportEquivocationCall = {
    equivocation_proof: GrandpaEquivocationProof,
    key_owner_proof: KeyOwnerProof,
}

export const GrandpaReportEquivocationCall: sts.Type<GrandpaReportEquivocationCall> = sts.struct(() => {
    return  {
        equivocation_proof: GrandpaEquivocationProof,
        key_owner_proof: KeyOwnerProof,
    }
})
