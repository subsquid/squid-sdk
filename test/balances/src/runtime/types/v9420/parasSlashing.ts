import {sts} from '../../pallet.support'
import {DisputeProof, MembershipProof} from './types'

export type ParasSlashingReportDisputeLostUnsignedCall = {
    disputeProof: DisputeProof,
    keyOwnerProof: MembershipProof,
}

export const ParasSlashingReportDisputeLostUnsignedCall: sts.Type<ParasSlashingReportDisputeLostUnsignedCall> = sts.struct(() => {
    return  {
        disputeProof: DisputeProof,
        keyOwnerProof: MembershipProof,
    }
})
