import {sts} from '../../pallet.support'
import {MultiSignature, Id, Type_49} from './types'

/**
 * Contribute your entire balance to a crowd sale. This will transfer the entire balance of a user over to fund a parachain
 * slot. It will be withdrawable when the crowdloan has ended and the funds are unused.
 */
export type CrowdloanContributeAllCall = {
    index: number,
    signature?: (MultiSignature | undefined),
}

export const CrowdloanContributeAllCall: sts.Type<CrowdloanContributeAllCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        signature: sts.option(() => MultiSignature),
    }
})

/**
 * The result of trying to submit a new bid to the Slots pallet.
 */
export type CrowdloanHandleBidResultEvent = [Id, Type_49]

export const CrowdloanHandleBidResultEvent: sts.Type<CrowdloanHandleBidResultEvent> = sts.tuple(() => Id, Type_49)
