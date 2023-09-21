import {sts} from '../../pallet.support'
import {EquivocationProof, MembershipProof} from './types'

/**
 * Report authority equivocation/misbehavior. This method will verify
 * the equivocation proof and validate the given key ownership proof
 * against the extracted offender. If both are valid, the offence will
 * be reported.
 * This extrinsic must be called unsigned and it is expected that only
 * block authors will call it (validated in `ValidateUnsigned`), as such
 * if the block author is defined it will be defined as the equivocation
 * reporter.
 */
export type BabeReportEquivocationUnsignedCall = {
    equivocationProof: EquivocationProof,
    keyOwnerProof: MembershipProof,
}

export const BabeReportEquivocationUnsignedCall: sts.Type<BabeReportEquivocationUnsignedCall> = sts.struct(() => {
    return  {
        equivocationProof: EquivocationProof,
        keyOwnerProof: MembershipProof,
    }
})

/**
 * Report authority equivocation/misbehavior. This method will verify
 * the equivocation proof and validate the given key ownership proof
 * against the extracted offender. If both are valid, the offence will
 * be reported.
 */
export type BabeReportEquivocationCall = {
    equivocationProof: EquivocationProof,
    keyOwnerProof: MembershipProof,
}

export const BabeReportEquivocationCall: sts.Type<BabeReportEquivocationCall> = sts.struct(() => {
    return  {
        equivocationProof: EquivocationProof,
        keyOwnerProof: MembershipProof,
    }
})
