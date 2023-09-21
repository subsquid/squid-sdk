import {sts} from '../../pallet.support'
import {BlockNumber, Weight, Balance, SessionIndex} from './types'

/**
 *  Set the zeroth delay tranche width.
 */
export type ConfigurationSetZerothDelayTrancheWidthCall = {
    new: number,
}

export const ConfigurationSetZerothDelayTrancheWidthCall: sts.Type<ConfigurationSetZerothDelayTrancheWidthCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the validation upgrade frequency.
 */
export type ConfigurationSetValidationUpgradeFrequencyCall = {
    new: BlockNumber,
}

export const ConfigurationSetValidationUpgradeFrequencyCall: sts.Type<ConfigurationSetValidationUpgradeFrequencyCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the validation upgrade delay.
 */
export type ConfigurationSetValidationUpgradeDelayCall = {
    new: BlockNumber,
}

export const ConfigurationSetValidationUpgradeDelayCall: sts.Type<ConfigurationSetValidationUpgradeDelayCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Sets the soft limit for the phase of dispatching dispatchable upward messages.
 */
export type ConfigurationSetUmpServiceTotalWeightCall = {
    new: Weight,
}

export const ConfigurationSetUmpServiceTotalWeightCall: sts.Type<ConfigurationSetUmpServiceTotalWeightCall> = sts.struct(() => {
    return  {
        new: Weight,
    }
})

/**
 *  Set the availability period for parathreads.
 */
export type ConfigurationSetThreadAvailabilityPeriodCall = {
    new: BlockNumber,
}

export const ConfigurationSetThreadAvailabilityPeriodCall: sts.Type<ConfigurationSetThreadAvailabilityPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the scheduling lookahead, in expected number of blocks at peak throughput.
 */
export type ConfigurationSetSchedulingLookaheadCall = {
    new: number,
}

export const ConfigurationSetSchedulingLookaheadCall: sts.Type<ConfigurationSetSchedulingLookaheadCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the number of samples to do of the `RelayVRFModulo` approval assignment criterion.
 */
export type ConfigurationSetRelayVrfModuloSamplesCall = {
    new: number,
}

export const ConfigurationSetRelayVrfModuloSamplesCall: sts.Type<ConfigurationSetRelayVrfModuloSamplesCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the number of retries for a particular parathread.
 */
export type ConfigurationSetParathreadRetriesCall = {
    new: number,
}

export const ConfigurationSetParathreadRetriesCall: sts.Type<ConfigurationSetParathreadRetriesCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the number of parathread execution cores.
 */
export type ConfigurationSetParathreadCoresCall = {
    new: number,
}

export const ConfigurationSetParathreadCoresCall: sts.Type<ConfigurationSetParathreadCoresCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the no show slots, in number of number of consensus slots.
 *  Must be at least 1.
 */
export type ConfigurationSetNoShowSlotsCall = {
    new: number,
}

export const ConfigurationSetNoShowSlotsCall: sts.Type<ConfigurationSetNoShowSlotsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the number of validators needed to approve a block.
 */
export type ConfigurationSetNeededApprovalsCall = {
    new: number,
}

export const ConfigurationSetNeededApprovalsCall: sts.Type<ConfigurationSetNeededApprovalsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the total number of delay tranches.
 */
export type ConfigurationSetNDelayTranchesCall = {
    new: number,
}

export const ConfigurationSetNDelayTranchesCall: sts.Type<ConfigurationSetNDelayTranchesCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the maximum number of validators to assign to any core.
 */
export type ConfigurationSetMaxValidatorsPerCoreCall = {
    new?: (number | undefined),
}

export const ConfigurationSetMaxValidatorsPerCoreCall: sts.Type<ConfigurationSetMaxValidatorsPerCoreCall> = sts.struct(() => {
    return  {
        new: sts.option(() => sts.number()),
    }
})

/**
 *  Set the maximum number of validators to use in parachain consensus.
 */
export type ConfigurationSetMaxValidatorsCall = {
    new?: (number | undefined),
}

export const ConfigurationSetMaxValidatorsCall: sts.Type<ConfigurationSetMaxValidatorsCall> = sts.struct(() => {
    return  {
        new: sts.option(() => sts.number()),
    }
})

/**
 *  Sets the maximum total size of items that can present in a upward dispatch queue at once.
 */
export type ConfigurationSetMaxUpwardQueueSizeCall = {
    new: number,
}

export const ConfigurationSetMaxUpwardQueueSizeCall: sts.Type<ConfigurationSetMaxUpwardQueueSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum items that can present in a upward dispatch queue at once.
 */
export type ConfigurationSetMaxUpwardQueueCountCall = {
    new: number,
}

export const ConfigurationSetMaxUpwardQueueCountCall: sts.Type<ConfigurationSetMaxUpwardQueueCountCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum size of an upward message that can be sent by a candidate.
 */
export type ConfigurationSetMaxUpwardMessageSizeCall = {
    new: number,
}

export const ConfigurationSetMaxUpwardMessageSizeCall: sts.Type<ConfigurationSetMaxUpwardMessageSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of messages that a candidate can contain.
 */
export type ConfigurationSetMaxUpwardMessageNumPerCandidateCall = {
    new: number,
}

export const ConfigurationSetMaxUpwardMessageNumPerCandidateCall: sts.Type<ConfigurationSetMaxUpwardMessageNumPerCandidateCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the max POV block size for incoming upgrades.
 */
export type ConfigurationSetMaxPovSizeCall = {
    new: number,
}

export const ConfigurationSetMaxPovSizeCall: sts.Type<ConfigurationSetMaxPovSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the max head data size for paras.
 */
export type ConfigurationSetMaxHeadDataSizeCall = {
    new: number,
}

export const ConfigurationSetMaxHeadDataSizeCall: sts.Type<ConfigurationSetMaxHeadDataSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the critical downward message size.
 */
export type ConfigurationSetMaxDownwardMessageSizeCall = {
    new: number,
}

export const ConfigurationSetMaxDownwardMessageSizeCall: sts.Type<ConfigurationSetMaxDownwardMessageSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the max validation code size for incoming upgrades.
 */
export type ConfigurationSetMaxCodeSizeCall = {
    new: number,
}

export const ConfigurationSetMaxCodeSizeCall: sts.Type<ConfigurationSetMaxCodeSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the amount of funds that the sender should provide for opening an HRMP channel.
 */
export type ConfigurationSetHrmpSenderDepositCall = {
    new: Balance,
}

export const ConfigurationSetHrmpSenderDepositCall: sts.Type<ConfigurationSetHrmpSenderDepositCall> = sts.struct(() => {
    return  {
        new: Balance,
    }
})

/**
 *  Sets the amount of funds that the recipient should provide for accepting opening an HRMP
 *  channel.
 */
export type ConfigurationSetHrmpRecipientDepositCall = {
    new: Balance,
}

export const ConfigurationSetHrmpRecipientDepositCall: sts.Type<ConfigurationSetHrmpRecipientDepositCall> = sts.struct(() => {
    return  {
        new: Balance,
    }
})

/**
 *  Sets the number of sessions after which an HRMP open channel request expires.
 */
export type ConfigurationSetHrmpOpenRequestTtlCall = {
    new: number,
}

export const ConfigurationSetHrmpOpenRequestTtlCall: sts.Type<ConfigurationSetHrmpOpenRequestTtlCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of outbound HRMP channels a parathread is allowed to open.
 */
export type ConfigurationSetHrmpMaxParathreadOutboundChannelsCall = {
    new: number,
}

export const ConfigurationSetHrmpMaxParathreadOutboundChannelsCall: sts.Type<ConfigurationSetHrmpMaxParathreadOutboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of inbound HRMP channels a parathread is allowed to accept.
 */
export type ConfigurationSetHrmpMaxParathreadInboundChannelsCall = {
    new: number,
}

export const ConfigurationSetHrmpMaxParathreadInboundChannelsCall: sts.Type<ConfigurationSetHrmpMaxParathreadInboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of outbound HRMP channels a parachain is allowed to open.
 */
export type ConfigurationSetHrmpMaxParachainOutboundChannelsCall = {
    new: number,
}

export const ConfigurationSetHrmpMaxParachainOutboundChannelsCall: sts.Type<ConfigurationSetHrmpMaxParachainOutboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of inbound HRMP channels a parachain is allowed to accept.
 */
export type ConfigurationSetHrmpMaxParachainInboundChannelsCall = {
    new: number,
}

export const ConfigurationSetHrmpMaxParachainInboundChannelsCall: sts.Type<ConfigurationSetHrmpMaxParachainInboundChannelsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of outbound HRMP messages can be sent by a candidate.
 */
export type ConfigurationSetHrmpMaxMessageNumPerCandidateCall = {
    new: number,
}

export const ConfigurationSetHrmpMaxMessageNumPerCandidateCall: sts.Type<ConfigurationSetHrmpMaxMessageNumPerCandidateCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum total size of messages in bytes allowed in an HRMP channel at once.
 */
export type ConfigurationSetHrmpChannelMaxTotalSizeCall = {
    new: number,
}

export const ConfigurationSetHrmpChannelMaxTotalSizeCall: sts.Type<ConfigurationSetHrmpChannelMaxTotalSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum size of a message that could ever be put into an HRMP channel.
 */
export type ConfigurationSetHrmpChannelMaxMessageSizeCall = {
    new: number,
}

export const ConfigurationSetHrmpChannelMaxMessageSizeCall: sts.Type<ConfigurationSetHrmpChannelMaxMessageSizeCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Sets the maximum number of messages allowed in an HRMP channel at once.
 */
export type ConfigurationSetHrmpChannelMaxCapacityCall = {
    new: number,
}

export const ConfigurationSetHrmpChannelMaxCapacityCall: sts.Type<ConfigurationSetHrmpChannelMaxCapacityCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the parachain validator-group rotation frequency
 */
export type ConfigurationSetGroupRotationFrequencyCall = {
    new: BlockNumber,
}

export const ConfigurationSetGroupRotationFrequencyCall: sts.Type<ConfigurationSetGroupRotationFrequencyCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the dispute post conclusion acceptance period.
 */
export type ConfigurationSetDisputePostConclusionAcceptancePeriodCall = {
    new: BlockNumber,
}

export const ConfigurationSetDisputePostConclusionAcceptancePeriodCall: sts.Type<ConfigurationSetDisputePostConclusionAcceptancePeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the dispute period, in number of sessions to keep for disputes.
 */
export type ConfigurationSetDisputePeriodCall = {
    new: SessionIndex,
}

export const ConfigurationSetDisputePeriodCall: sts.Type<ConfigurationSetDisputePeriodCall> = sts.struct(() => {
    return  {
        new: SessionIndex,
    }
})

/**
 *  Set the maximum number of dispute spam slots.
 */
export type ConfigurationSetDisputeMaxSpamSlotsCall = {
    new: number,
}

export const ConfigurationSetDisputeMaxSpamSlotsCall: sts.Type<ConfigurationSetDisputeMaxSpamSlotsCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  Set the dispute conclusion by time out period.
 */
export type ConfigurationSetDisputeConclusionByTimeOutPeriodCall = {
    new: BlockNumber,
}

export const ConfigurationSetDisputeConclusionByTimeOutPeriodCall: sts.Type<ConfigurationSetDisputeConclusionByTimeOutPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the acceptance period for an included candidate.
 */
export type ConfigurationSetCodeRetentionPeriodCall = {
    new: BlockNumber,
}

export const ConfigurationSetCodeRetentionPeriodCall: sts.Type<ConfigurationSetCodeRetentionPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})

/**
 *  Set the availability period for parachains.
 */
export type ConfigurationSetChainAvailabilityPeriodCall = {
    new: BlockNumber,
}

export const ConfigurationSetChainAvailabilityPeriodCall: sts.Type<ConfigurationSetChainAvailabilityPeriodCall> = sts.struct(() => {
    return  {
        new: BlockNumber,
    }
})
