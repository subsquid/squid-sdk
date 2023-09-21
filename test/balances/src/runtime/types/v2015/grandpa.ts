import {sts} from '../../pallet.support'
import {GrandpaEquivocationProof, KeyOwnerProof} from './types'

/**
 *  Report voter equivocation/misbehavior. This method will verify the
 *  equivocation proof and validate the given key ownership proof
 *  against the extracted offender. If both are valid, the offence
 *  will be reported.
 * 
 *  This extrinsic must be called unsigned and it is expected that only
 *  block authors will call it (validated in `ValidateUnsigned`), as such
 *  if the block author is defined it will be defined as the equivocation
 *  reporter.
 */
export type GrandpaReportEquivocationUnsignedCall = {
    equivocation_proof: GrandpaEquivocationProof,
    key_owner_proof: KeyOwnerProof,
}

export const GrandpaReportEquivocationUnsignedCall: sts.Type<GrandpaReportEquivocationUnsignedCall> = sts.struct(() => {
    return  {
        equivocation_proof: GrandpaEquivocationProof,
        key_owner_proof: KeyOwnerProof,
    }
})
