import {sts} from '../../pallet.support'
import {MultiSigner, Id, Type_52} from './types'

/**
 * Edit the configuration for an in-progress crowdloan.
 * 
 * Can only be called by Root origin.
 */
export type CrowdloanEditCall = {
    index: number,
    cap: bigint,
    firstPeriod: number,
    lastPeriod: number,
    end: number,
    verifier?: (MultiSigner | undefined),
}

export const CrowdloanEditCall: sts.Type<CrowdloanEditCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        cap: sts.bigint(),
        firstPeriod: sts.number(),
        lastPeriod: sts.number(),
        end: sts.number(),
        verifier: sts.option(() => MultiSigner),
    }
})

/**
 * Create a new crowdloaning campaign for a parachain slot with the given lease period range.
 * 
 * This applies a lock to your parachain configuration, ensuring that it cannot be changed
 * by the parachain manager.
 */
export type CrowdloanCreateCall = {
    index: number,
    cap: bigint,
    firstPeriod: number,
    lastPeriod: number,
    end: number,
    verifier?: (MultiSigner | undefined),
}

export const CrowdloanCreateCall: sts.Type<CrowdloanCreateCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        cap: sts.bigint(),
        firstPeriod: sts.number(),
        lastPeriod: sts.number(),
        end: sts.number(),
        verifier: sts.option(() => MultiSigner),
    }
})

/**
 * The result of trying to submit a new bid to the Slots pallet.
 */
export type CrowdloanHandleBidResultEvent = [Id, Type_52]

export const CrowdloanHandleBidResultEvent: sts.Type<CrowdloanHandleBidResultEvent> = sts.tuple(() => Id, Type_52)
