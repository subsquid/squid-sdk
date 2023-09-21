import {sts} from '../../pallet.support'
import {BlockNumber, Weight, Balance, SessionIndex} from './types'

/**
 *  Set the zeroth delay tranche width.
 */
export type ParachainsConfigurationSetZerothDelayTrancheWidthCall = {
    new: number,
}

export const ParachainsConfigurationSetZerothDelayTrancheWidthCall: sts.Type<ParachainsConfigurationSetZerothDelayTrancheWidthCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the validation upgrade frequency.
 */
export type ParachainsConfigurationSetValidationUpgradeFrequencyCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetValidationUpgradeFrequencyCall: sts.Type<ParachainsConfigurationSetValidationUpgradeFrequencyCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the validation upgrade delay.
 */
export type ParachainsConfigurationSetValidationUpgradeDelayCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetValidationUpgradeDelayCall: sts.Type<ParachainsConfigurationSetValidationUpgradeDelayCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the availability period for parathreads.
 */
export type ParachainsConfigurationSetThreadAvailabilityPeriodCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetThreadAvailabilityPeriodCall: sts.Type<ParachainsConfigurationSetThreadAvailabilityPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the scheduling lookahead, in expected number of blocks at peak throughput.
 */
export type ParachainsConfigurationSetSchedulingLookaheadCall = {
    new: number,
}

export const ParachainsConfigurationSetSchedulingLookaheadCall: sts.Type<ParachainsConfigurationSetSchedulingLookaheadCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the number of samples to do of the RelayVRFModulo approval assignment criterion.
 */
export type ParachainsConfigurationSetRelayVrfModuloSamplesCall = {
    new: number,
}

export const ParachainsConfigurationSetRelayVrfModuloSamplesCall: sts.Type<ParachainsConfigurationSetRelayVrfModuloSamplesCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the soft limit for the phase of dispatching dispatchable upward messages.
 */
export type ParachainsConfigurationSetPreferredDispatchableUpwardMessagesStepWeightCall = {
    new: Weight,
}

export const ParachainsConfigurationSetPreferredDispatchableUpwardMessagesStepWeightCall: sts.Type<ParachainsConfigurationSetPreferredDispatchableUpwardMessagesStepWeightCall> = sts.struct(() => {
    return  {
        new: Weight,
    }
})

/**
 *  Set the number of retries for a particular parathread.
 */
export type ParachainsConfigurationSetParathreadRetriesCall = {
    new: number,
}

export const ParachainsConfigurationSetParathreadRetriesCall: sts.Type<ParachainsConfigurationSetParathreadRetriesCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the number of parathread execution cores.
 */
export type ParachainsConfigurationSetParathreadCoresCall = {
    new: number,
}

export const ParachainsConfigurationSetParathreadCoresCall: sts.Type<ParachainsConfigurationSetParathreadCoresCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the no show slots, in number of number of consensus slots.
 *  Must be at least 1.
 */
export type ParachainsConfigurationSetNoShowSlotsCall = {
    new: number,
}

export const ParachainsConfigurationSetNoShowSlotsCall: sts.Type<ParachainsConfigurationSetNoShowSlotsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the number of validators needed to approve a block.
 */
export type ParachainsConfigurationSetNeededApprovalsCall = {
    new: number,
}

export const ParachainsConfigurationSetNeededApprovalsCall: sts.Type<ParachainsConfigurationSetNeededApprovalsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the total number of delay tranches.
 */
export type ParachainsConfigurationSetNDelayTranchesCall = {
    new: number,
}

export const ParachainsConfigurationSetNDelayTranchesCall: sts.Type<ParachainsConfigurationSetNDelayTranchesCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the maximum number of validators to assign to any core.
 */
export type ParachainsConfigurationSetMaxValidatorsPerCoreCall = {
    new?: (number | undefined),
}

export const ParachainsConfigurationSetMaxValidatorsPerCoreCall: sts.Type<ParachainsConfigurationSetMaxValidatorsPerCoreCall> = sts.struct(() => {
    return  {
        new: sts.option(() => sts.number()),
    }
})

/**
 *  Set the maximum number of validators to use in parachain consensus.
 */
export type ParachainsConfigurationSetMaxValidatorsCall = {
    new?: (number | undefined),
}

export const ParachainsConfigurationSetMaxValidatorsCall: sts.Type<ParachainsConfigurationSetMaxValidatorsCall> = sts.struct(() => {
    return  {
        new: sts.option(() => sts.number()),
    }
})

/**
 *  Sets the maximum total size of items that can present in a upward dispatch queue at once.
 */
export type ParachainsConfigurationSetMaxUpwardQueueSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxUpwardQueueSizeCall: sts.Type<ParachainsConfigurationSetMaxUpwardQueueSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum items that can present in a upward dispatch queue at once.
 */
export type ParachainsConfigurationSetMaxUpwardQueueCountCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxUpwardQueueCountCall: sts.Type<ParachainsConfigurationSetMaxUpwardQueueCountCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum size of an upward message that can be sent by a candidate.
 */
export type ParachainsConfigurationSetMaxUpwardMessageSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxUpwardMessageSizeCall: sts.Type<ParachainsConfigurationSetMaxUpwardMessageSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of messages that a candidate can contain.
 */
export type ParachainsConfigurationSetMaxUpwardMessageNumPerCandidateCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxUpwardMessageNumPerCandidateCall: sts.Type<ParachainsConfigurationSetMaxUpwardMessageNumPerCandidateCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the max POV block size for incoming upgrades.
 */
export type ParachainsConfigurationSetMaxPovSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxPovSizeCall: sts.Type<ParachainsConfigurationSetMaxPovSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the max head data size for paras.
 */
export type ParachainsConfigurationSetMaxHeadDataSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxHeadDataSizeCall: sts.Type<ParachainsConfigurationSetMaxHeadDataSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the critical downward message size.
 */
export type ParachainsConfigurationSetMaxDownwardMessageSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxDownwardMessageSizeCall: sts.Type<ParachainsConfigurationSetMaxDownwardMessageSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the max validation code size for incoming upgrades.
 */
export type ParachainsConfigurationSetMaxCodeSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetMaxCodeSizeCall: sts.Type<ParachainsConfigurationSetMaxCodeSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the amount of funds that the sender should provide for opening an HRMP channel.
 */
export type ParachainsConfigurationSetHrmpSenderDepositCall = {
    new: Balance,
}

export const ParachainsConfigurationSetHrmpSenderDepositCall: sts.Type<ParachainsConfigurationSetHrmpSenderDepositCall> = sts.struct(() => {
    return  {
        new: Balance,
    }
})

/**
 *  Sets the amount of funds that the recipient should provide for accepting opening an HRMP
 *  channel.
 */
export type ParachainsConfigurationSetHrmpRecipientDepositCall = {
    new: Balance,
}

export const ParachainsConfigurationSetHrmpRecipientDepositCall: sts.Type<ParachainsConfigurationSetHrmpRecipientDepositCall> = sts.struct(() => {
    return  {
        new: Balance,
    }
})

/**
 *  Sets the number of sessions after which an HRMP open channel request expires.
 */
export type ParachainsConfigurationSetHrmpOpenRequestTtlCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpOpenRequestTtlCall: sts.Type<ParachainsConfigurationSetHrmpOpenRequestTtlCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of outbound HRMP channels a parathread is allowed to open.
 */
export type ParachainsConfigurationSetHrmpMaxParathreadOutboundChannelsCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpMaxParathreadOutboundChannelsCall: sts.Type<ParachainsConfigurationSetHrmpMaxParathreadOutboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of inbound HRMP channels a parathread is allowed to accept.
 */
export type ParachainsConfigurationSetHrmpMaxParathreadInboundChannelsCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpMaxParathreadInboundChannelsCall: sts.Type<ParachainsConfigurationSetHrmpMaxParathreadInboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of outbound HRMP channels a parachain is allowed to open.
 */
export type ParachainsConfigurationSetHrmpMaxParachainOutboundChannelsCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpMaxParachainOutboundChannelsCall: sts.Type<ParachainsConfigurationSetHrmpMaxParachainOutboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of inbound HRMP channels a parachain is allowed to accept.
 */
export type ParachainsConfigurationSetHrmpMaxParachainInboundChannelsCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpMaxParachainInboundChannelsCall: sts.Type<ParachainsConfigurationSetHrmpMaxParachainInboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of outbound HRMP messages can be sent by a candidate.
 */
export type ParachainsConfigurationSetHrmpMaxMessageNumPerCandidateCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpMaxMessageNumPerCandidateCall: sts.Type<ParachainsConfigurationSetHrmpMaxMessageNumPerCandidateCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum total size of messages in bytes allowed in an HRMP channel at once.
 */
export type ParachainsConfigurationSetHrmpChannelMaxTotalSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpChannelMaxTotalSizeCall: sts.Type<ParachainsConfigurationSetHrmpChannelMaxTotalSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum size of a message that could ever be put into an HRMP channel.
 */
export type ParachainsConfigurationSetHrmpChannelMaxMessageSizeCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpChannelMaxMessageSizeCall: sts.Type<ParachainsConfigurationSetHrmpChannelMaxMessageSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of messages allowed in an HRMP channel at once.
 */
export type ParachainsConfigurationSetHrmpChannelMaxCapacityCall = {
    new: number,
}

export const ParachainsConfigurationSetHrmpChannelMaxCapacityCall: sts.Type<ParachainsConfigurationSetHrmpChannelMaxCapacityCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the parachain validator-group rotation frequency
 */
export type ParachainsConfigurationSetGroupRotationFrequencyCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetGroupRotationFrequencyCall: sts.Type<ParachainsConfigurationSetGroupRotationFrequencyCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the dispute post conclusion acceptance period.
 */
export type ParachainsConfigurationSetDisputePostConclusionAcceptancePeriodCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetDisputePostConclusionAcceptancePeriodCall: sts.Type<ParachainsConfigurationSetDisputePostConclusionAcceptancePeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the dispute period, in number of sessions to keep for disputes.
 */
export type ParachainsConfigurationSetDisputePeriodCall = {
    new: SessionIndex,
}

export const ParachainsConfigurationSetDisputePeriodCall: sts.Type<ParachainsConfigurationSetDisputePeriodCall> = sts.struct(() => {
    return  {
        new: SessionIndex,
    }
})

/**
 *  Set the maximum number of dispute spam slots.
 */
export type ParachainsConfigurationSetDisputeMaxSpamSlotsCall = {
    new: number,
}

export const ParachainsConfigurationSetDisputeMaxSpamSlotsCall: sts.Type<ParachainsConfigurationSetDisputeMaxSpamSlotsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the dispute conclusion by time out period.
 */
export type ParachainsConfigurationSetDisputeConclusionByTimeOutPeriodCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetDisputeConclusionByTimeOutPeriodCall: sts.Type<ParachainsConfigurationSetDisputeConclusionByTimeOutPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the acceptance period for an included candidate.
 */
export type ParachainsConfigurationSetCodeRetentionPeriodCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetCodeRetentionPeriodCall: sts.Type<ParachainsConfigurationSetCodeRetentionPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the availability period for parachains.
 */
export type ParachainsConfigurationSetChainAvailabilityPeriodCall = {
    new: BlockNumber,
}

export const ParachainsConfigurationSetChainAvailabilityPeriodCall: sts.Type<ParachainsConfigurationSetChainAvailabilityPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})
