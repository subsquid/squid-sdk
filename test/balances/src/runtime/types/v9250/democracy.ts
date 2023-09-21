import {sts} from '../../pallet.support'

/**
 * A proposal got canceled.
 */
export type DemocracyProposalCanceledEvent = {
    propIndex: number,
}

export const DemocracyProposalCanceledEvent: sts.Type<DemocracyProposalCanceledEvent> = sts.struct(() => {
    return  {
        propIndex: sts.number(),
    }
})
