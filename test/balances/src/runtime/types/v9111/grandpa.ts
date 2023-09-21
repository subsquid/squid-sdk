import {sts} from '../../pallet.support'
import {Type_251, MembershipProof} from './types'

/**
 * Report voter equivocation/misbehavior. This method will verify the
 * equivocation proof and validate the given key ownership proof
 * against the extracted offender. If both are valid, the offence
 * will be reported.
 * 
 * This extrinsic must be called unsigned and it is expected that only
 * block authors will call it (validated in `ValidateUnsigned`), as such
 * if the block author is defined it will be defined as the equivocation
 * reporter.
 */
export type GrandpaReportEquivocationUnsignedCall = {
    equivocationProof: Type_251,
    keyOwnerProof: MembershipProof,
}

export const GrandpaReportEquivocationUnsignedCall: sts.Type<GrandpaReportEquivocationUnsignedCall> = sts.struct(() => {
    return  {
        equivocationProof: Type_251,
        keyOwnerProof: MembershipProof,
    }
})

/**
 * Report voter equivocation/misbehavior. This method will verify the
 * equivocation proof and validate the given key ownership proof
 * against the extracted offender. If both are valid, the offence
 * will be reported.
 */
export type GrandpaReportEquivocationCall = {
    equivocationProof: Type_251,
    keyOwnerProof: MembershipProof,
}

export const GrandpaReportEquivocationCall: sts.Type<GrandpaReportEquivocationCall> = sts.struct(() => {
    return  {
        equivocationProof: Type_251,
        keyOwnerProof: MembershipProof,
    }
})

/**
 * Note that the current authority set of the GRANDPA finality gadget has
 * stalled. This will trigger a forced authority set change at the beginning
 * of the next session, to be enacted `delay` blocks after that. The delay
 * should be high enough to safely assume that the block signalling the
 * forced change will not be re-orged (e.g. 1000 blocks). The GRANDPA voters
 * will start the new authority set using the given finalized block as base.
 * Only callable by root.
 */
export type GrandpaNoteStalledCall = {
    delay: number,
    bestFinalizedBlockNumber: number,
}

export const GrandpaNoteStalledCall: sts.Type<GrandpaNoteStalledCall> = sts.struct(() => {
    return  {
        delay: sts.number(),
        bestFinalizedBlockNumber: sts.number(),
    }
})
