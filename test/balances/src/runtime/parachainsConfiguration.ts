import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9040 from './types/v9040'
import * as v9010 from './types/v9010'

export const calls = {
    set_chain_availability_period: createCall(
        'ParachainsConfiguration.set_chain_availability_period',
        {
            v9010: v9010.ParachainsConfigurationSetChainAvailabilityPeriodCall,
        }
    ),
    set_code_retention_period: createCall(
        'ParachainsConfiguration.set_code_retention_period',
        {
            v9010: v9010.ParachainsConfigurationSetCodeRetentionPeriodCall,
        }
    ),
    set_dispute_conclusion_by_time_out_period: createCall(
        'ParachainsConfiguration.set_dispute_conclusion_by_time_out_period',
        {
            v9010: v9010.ParachainsConfigurationSetDisputeConclusionByTimeOutPeriodCall,
        }
    ),
    set_dispute_max_spam_slots: createCall(
        'ParachainsConfiguration.set_dispute_max_spam_slots',
        {
            v9010: v9010.ParachainsConfigurationSetDisputeMaxSpamSlotsCall,
        }
    ),
    set_dispute_period: createCall(
        'ParachainsConfiguration.set_dispute_period',
        {
            v9010: v9010.ParachainsConfigurationSetDisputePeriodCall,
        }
    ),
    set_dispute_post_conclusion_acceptance_period: createCall(
        'ParachainsConfiguration.set_dispute_post_conclusion_acceptance_period',
        {
            v9010: v9010.ParachainsConfigurationSetDisputePostConclusionAcceptancePeriodCall,
        }
    ),
    set_group_rotation_frequency: createCall(
        'ParachainsConfiguration.set_group_rotation_frequency',
        {
            v9010: v9010.ParachainsConfigurationSetGroupRotationFrequencyCall,
        }
    ),
    set_hrmp_channel_max_capacity: createCall(
        'ParachainsConfiguration.set_hrmp_channel_max_capacity',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpChannelMaxCapacityCall,
        }
    ),
    set_hrmp_channel_max_message_size: createCall(
        'ParachainsConfiguration.set_hrmp_channel_max_message_size',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpChannelMaxMessageSizeCall,
        }
    ),
    set_hrmp_channel_max_total_size: createCall(
        'ParachainsConfiguration.set_hrmp_channel_max_total_size',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpChannelMaxTotalSizeCall,
        }
    ),
    set_hrmp_max_message_num_per_candidate: createCall(
        'ParachainsConfiguration.set_hrmp_max_message_num_per_candidate',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpMaxMessageNumPerCandidateCall,
        }
    ),
    set_hrmp_max_parachain_inbound_channels: createCall(
        'ParachainsConfiguration.set_hrmp_max_parachain_inbound_channels',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpMaxParachainInboundChannelsCall,
        }
    ),
    set_hrmp_max_parachain_outbound_channels: createCall(
        'ParachainsConfiguration.set_hrmp_max_parachain_outbound_channels',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpMaxParachainOutboundChannelsCall,
        }
    ),
    set_hrmp_max_parathread_inbound_channels: createCall(
        'ParachainsConfiguration.set_hrmp_max_parathread_inbound_channels',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpMaxParathreadInboundChannelsCall,
        }
    ),
    set_hrmp_max_parathread_outbound_channels: createCall(
        'ParachainsConfiguration.set_hrmp_max_parathread_outbound_channels',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpMaxParathreadOutboundChannelsCall,
        }
    ),
    set_hrmp_open_request_ttl: createCall(
        'ParachainsConfiguration.set_hrmp_open_request_ttl',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpOpenRequestTtlCall,
        }
    ),
    set_hrmp_recipient_deposit: createCall(
        'ParachainsConfiguration.set_hrmp_recipient_deposit',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpRecipientDepositCall,
        }
    ),
    set_hrmp_sender_deposit: createCall(
        'ParachainsConfiguration.set_hrmp_sender_deposit',
        {
            v9010: v9010.ParachainsConfigurationSetHrmpSenderDepositCall,
        }
    ),
    set_max_code_size: createCall(
        'ParachainsConfiguration.set_max_code_size',
        {
            v9010: v9010.ParachainsConfigurationSetMaxCodeSizeCall,
        }
    ),
    set_max_downward_message_size: createCall(
        'ParachainsConfiguration.set_max_downward_message_size',
        {
            v9010: v9010.ParachainsConfigurationSetMaxDownwardMessageSizeCall,
        }
    ),
    set_max_head_data_size: createCall(
        'ParachainsConfiguration.set_max_head_data_size',
        {
            v9010: v9010.ParachainsConfigurationSetMaxHeadDataSizeCall,
        }
    ),
    set_max_pov_size: createCall(
        'ParachainsConfiguration.set_max_pov_size',
        {
            v9010: v9010.ParachainsConfigurationSetMaxPovSizeCall,
        }
    ),
    set_max_upward_message_num_per_candidate: createCall(
        'ParachainsConfiguration.set_max_upward_message_num_per_candidate',
        {
            v9010: v9010.ParachainsConfigurationSetMaxUpwardMessageNumPerCandidateCall,
        }
    ),
    set_max_upward_message_size: createCall(
        'ParachainsConfiguration.set_max_upward_message_size',
        {
            v9010: v9010.ParachainsConfigurationSetMaxUpwardMessageSizeCall,
        }
    ),
    set_max_upward_queue_count: createCall(
        'ParachainsConfiguration.set_max_upward_queue_count',
        {
            v9010: v9010.ParachainsConfigurationSetMaxUpwardQueueCountCall,
        }
    ),
    set_max_upward_queue_size: createCall(
        'ParachainsConfiguration.set_max_upward_queue_size',
        {
            v9010: v9010.ParachainsConfigurationSetMaxUpwardQueueSizeCall,
        }
    ),
    set_max_validators: createCall(
        'ParachainsConfiguration.set_max_validators',
        {
            v9010: v9010.ParachainsConfigurationSetMaxValidatorsCall,
        }
    ),
    set_max_validators_per_core: createCall(
        'ParachainsConfiguration.set_max_validators_per_core',
        {
            v9010: v9010.ParachainsConfigurationSetMaxValidatorsPerCoreCall,
        }
    ),
    set_n_delay_tranches: createCall(
        'ParachainsConfiguration.set_n_delay_tranches',
        {
            v9010: v9010.ParachainsConfigurationSetNDelayTranchesCall,
        }
    ),
    set_needed_approvals: createCall(
        'ParachainsConfiguration.set_needed_approvals',
        {
            v9010: v9010.ParachainsConfigurationSetNeededApprovalsCall,
        }
    ),
    set_no_show_slots: createCall(
        'ParachainsConfiguration.set_no_show_slots',
        {
            v9010: v9010.ParachainsConfigurationSetNoShowSlotsCall,
        }
    ),
    set_parathread_cores: createCall(
        'ParachainsConfiguration.set_parathread_cores',
        {
            v9010: v9010.ParachainsConfigurationSetParathreadCoresCall,
        }
    ),
    set_parathread_retries: createCall(
        'ParachainsConfiguration.set_parathread_retries',
        {
            v9010: v9010.ParachainsConfigurationSetParathreadRetriesCall,
        }
    ),
    set_preferred_dispatchable_upward_messages_step_weight: createCall(
        'ParachainsConfiguration.set_preferred_dispatchable_upward_messages_step_weight',
        {
            v9010: v9010.ParachainsConfigurationSetPreferredDispatchableUpwardMessagesStepWeightCall,
        }
    ),
    set_relay_vrf_modulo_samples: createCall(
        'ParachainsConfiguration.set_relay_vrf_modulo_samples',
        {
            v9010: v9010.ParachainsConfigurationSetRelayVrfModuloSamplesCall,
        }
    ),
    set_scheduling_lookahead: createCall(
        'ParachainsConfiguration.set_scheduling_lookahead',
        {
            v9010: v9010.ParachainsConfigurationSetSchedulingLookaheadCall,
        }
    ),
    set_thread_availability_period: createCall(
        'ParachainsConfiguration.set_thread_availability_period',
        {
            v9010: v9010.ParachainsConfigurationSetThreadAvailabilityPeriodCall,
        }
    ),
    set_ump_service_total_weight: createCall(
        'ParachainsConfiguration.set_ump_service_total_weight',
        {
            v9040: v9040.ParachainsConfigurationSetUmpServiceTotalWeightCall,
        }
    ),
    set_validation_upgrade_delay: createCall(
        'ParachainsConfiguration.set_validation_upgrade_delay',
        {
            v9010: v9010.ParachainsConfigurationSetValidationUpgradeDelayCall,
        }
    ),
    set_validation_upgrade_frequency: createCall(
        'ParachainsConfiguration.set_validation_upgrade_frequency',
        {
            v9010: v9010.ParachainsConfigurationSetValidationUpgradeFrequencyCall,
        }
    ),
    set_zeroth_delay_tranche_width: createCall(
        'ParachainsConfiguration.set_zeroth_delay_tranche_width',
        {
            v9010: v9010.ParachainsConfigurationSetZerothDelayTrancheWidthCall,
        }
    ),
}

export const storage = {
    ActiveConfig: createStorage(
        'ParachainsConfiguration.ActiveConfig',
        {
            v9010: v9010.ParachainsConfigurationActiveConfigStorage,
        }
    ),
    PendingConfig: createStorage(
        'ParachainsConfiguration.PendingConfig',
        {
            v9010: v9010.ParachainsConfigurationPendingConfigStorage,
        }
    ),
}

export default {calls}
