import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9430 from './types/v9430'
import * as v9420 from './types/v9420'
import * as v9370 from './types/v9370'
import * as v9320 from './types/v9320'
import * as v9291 from './types/v9291'
import * as v9160 from './types/v9160'
import * as v9111 from './types/v9111'
import * as v9100 from './types/v9100'
import * as v9090 from './types/v9090'

export const calls = {
    set_async_backing_params: createCall(
        'Configuration.set_async_backing_params',
        {
            v9420: v9420.ConfigurationSetAsyncBackingParamsCall,
        }
    ),
    set_bypass_consistency_check: createCall(
        'Configuration.set_bypass_consistency_check',
        {
            v9160: v9160.ConfigurationSetBypassConsistencyCheckCall,
        }
    ),
    set_chain_availability_period: createCall(
        'Configuration.set_chain_availability_period',
        {
            v9090: v9090.ConfigurationSetChainAvailabilityPeriodCall,
        }
    ),
    set_code_retention_period: createCall(
        'Configuration.set_code_retention_period',
        {
            v9090: v9090.ConfigurationSetCodeRetentionPeriodCall,
        }
    ),
    set_dispute_conclusion_by_time_out_period: createCall(
        'Configuration.set_dispute_conclusion_by_time_out_period',
        {
            v9090: v9090.ConfigurationSetDisputeConclusionByTimeOutPeriodCall,
        }
    ),
    set_dispute_max_spam_slots: createCall(
        'Configuration.set_dispute_max_spam_slots',
        {
            v9090: v9090.ConfigurationSetDisputeMaxSpamSlotsCall,
        }
    ),
    set_dispute_period: createCall(
        'Configuration.set_dispute_period',
        {
            v9090: v9090.ConfigurationSetDisputePeriodCall,
        }
    ),
    set_dispute_post_conclusion_acceptance_period: createCall(
        'Configuration.set_dispute_post_conclusion_acceptance_period',
        {
            v9090: v9090.ConfigurationSetDisputePostConclusionAcceptancePeriodCall,
        }
    ),
    set_executor_params: createCall(
        'Configuration.set_executor_params',
        {
            v9420: v9420.ConfigurationSetExecutorParamsCall,
        }
    ),
    set_group_rotation_frequency: createCall(
        'Configuration.set_group_rotation_frequency',
        {
            v9090: v9090.ConfigurationSetGroupRotationFrequencyCall,
        }
    ),
    set_hrmp_channel_max_capacity: createCall(
        'Configuration.set_hrmp_channel_max_capacity',
        {
            v9090: v9090.ConfigurationSetHrmpChannelMaxCapacityCall,
        }
    ),
    set_hrmp_channel_max_message_size: createCall(
        'Configuration.set_hrmp_channel_max_message_size',
        {
            v9090: v9090.ConfigurationSetHrmpChannelMaxMessageSizeCall,
        }
    ),
    set_hrmp_channel_max_total_size: createCall(
        'Configuration.set_hrmp_channel_max_total_size',
        {
            v9090: v9090.ConfigurationSetHrmpChannelMaxTotalSizeCall,
        }
    ),
    set_hrmp_max_message_num_per_candidate: createCall(
        'Configuration.set_hrmp_max_message_num_per_candidate',
        {
            v9090: v9090.ConfigurationSetHrmpMaxMessageNumPerCandidateCall,
        }
    ),
    set_hrmp_max_parachain_inbound_channels: createCall(
        'Configuration.set_hrmp_max_parachain_inbound_channels',
        {
            v9090: v9090.ConfigurationSetHrmpMaxParachainInboundChannelsCall,
        }
    ),
    set_hrmp_max_parachain_outbound_channels: createCall(
        'Configuration.set_hrmp_max_parachain_outbound_channels',
        {
            v9090: v9090.ConfigurationSetHrmpMaxParachainOutboundChannelsCall,
        }
    ),
    set_hrmp_max_parathread_inbound_channels: createCall(
        'Configuration.set_hrmp_max_parathread_inbound_channels',
        {
            v9090: v9090.ConfigurationSetHrmpMaxParathreadInboundChannelsCall,
        }
    ),
    set_hrmp_max_parathread_outbound_channels: createCall(
        'Configuration.set_hrmp_max_parathread_outbound_channels',
        {
            v9090: v9090.ConfigurationSetHrmpMaxParathreadOutboundChannelsCall,
        }
    ),
    set_hrmp_open_request_ttl: createCall(
        'Configuration.set_hrmp_open_request_ttl',
        {
            v9090: v9090.ConfigurationSetHrmpOpenRequestTtlCall,
            v9100: v9100.ConfigurationSetHrmpOpenRequestTtlCall,
            v9111: v9111.ConfigurationSetHrmpOpenRequestTtlCall,
        }
    ),
    set_hrmp_recipient_deposit: createCall(
        'Configuration.set_hrmp_recipient_deposit',
        {
            v9090: v9090.ConfigurationSetHrmpRecipientDepositCall,
        }
    ),
    set_hrmp_sender_deposit: createCall(
        'Configuration.set_hrmp_sender_deposit',
        {
            v9090: v9090.ConfigurationSetHrmpSenderDepositCall,
        }
    ),
    set_max_code_size: createCall(
        'Configuration.set_max_code_size',
        {
            v9090: v9090.ConfigurationSetMaxCodeSizeCall,
        }
    ),
    set_max_downward_message_size: createCall(
        'Configuration.set_max_downward_message_size',
        {
            v9090: v9090.ConfigurationSetMaxDownwardMessageSizeCall,
        }
    ),
    set_max_head_data_size: createCall(
        'Configuration.set_max_head_data_size',
        {
            v9090: v9090.ConfigurationSetMaxHeadDataSizeCall,
        }
    ),
    set_max_pov_size: createCall(
        'Configuration.set_max_pov_size',
        {
            v9090: v9090.ConfigurationSetMaxPovSizeCall,
        }
    ),
    set_max_upward_message_num_per_candidate: createCall(
        'Configuration.set_max_upward_message_num_per_candidate',
        {
            v9090: v9090.ConfigurationSetMaxUpwardMessageNumPerCandidateCall,
        }
    ),
    set_max_upward_message_size: createCall(
        'Configuration.set_max_upward_message_size',
        {
            v9090: v9090.ConfigurationSetMaxUpwardMessageSizeCall,
        }
    ),
    set_max_upward_queue_count: createCall(
        'Configuration.set_max_upward_queue_count',
        {
            v9090: v9090.ConfigurationSetMaxUpwardQueueCountCall,
        }
    ),
    set_max_upward_queue_size: createCall(
        'Configuration.set_max_upward_queue_size',
        {
            v9090: v9090.ConfigurationSetMaxUpwardQueueSizeCall,
        }
    ),
    set_max_validators: createCall(
        'Configuration.set_max_validators',
        {
            v9090: v9090.ConfigurationSetMaxValidatorsCall,
        }
    ),
    set_max_validators_per_core: createCall(
        'Configuration.set_max_validators_per_core',
        {
            v9090: v9090.ConfigurationSetMaxValidatorsPerCoreCall,
        }
    ),
    set_minimum_validation_upgrade_delay: createCall(
        'Configuration.set_minimum_validation_upgrade_delay',
        {
            v9160: v9160.ConfigurationSetMinimumValidationUpgradeDelayCall,
        }
    ),
    set_n_delay_tranches: createCall(
        'Configuration.set_n_delay_tranches',
        {
            v9090: v9090.ConfigurationSetNDelayTranchesCall,
        }
    ),
    set_needed_approvals: createCall(
        'Configuration.set_needed_approvals',
        {
            v9090: v9090.ConfigurationSetNeededApprovalsCall,
        }
    ),
    set_no_show_slots: createCall(
        'Configuration.set_no_show_slots',
        {
            v9090: v9090.ConfigurationSetNoShowSlotsCall,
        }
    ),
    set_parathread_cores: createCall(
        'Configuration.set_parathread_cores',
        {
            v9090: v9090.ConfigurationSetParathreadCoresCall,
        }
    ),
    set_parathread_retries: createCall(
        'Configuration.set_parathread_retries',
        {
            v9090: v9090.ConfigurationSetParathreadRetriesCall,
        }
    ),
    set_pvf_checking_enabled: createCall(
        'Configuration.set_pvf_checking_enabled',
        {
            v9160: v9160.ConfigurationSetPvfCheckingEnabledCall,
        }
    ),
    set_pvf_voting_ttl: createCall(
        'Configuration.set_pvf_voting_ttl',
        {
            v9160: v9160.ConfigurationSetPvfVotingTtlCall,
        }
    ),
    set_relay_vrf_modulo_samples: createCall(
        'Configuration.set_relay_vrf_modulo_samples',
        {
            v9090: v9090.ConfigurationSetRelayVrfModuloSamplesCall,
        }
    ),
    set_scheduling_lookahead: createCall(
        'Configuration.set_scheduling_lookahead',
        {
            v9090: v9090.ConfigurationSetSchedulingLookaheadCall,
        }
    ),
    set_thread_availability_period: createCall(
        'Configuration.set_thread_availability_period',
        {
            v9090: v9090.ConfigurationSetThreadAvailabilityPeriodCall,
        }
    ),
    set_ump_max_individual_weight: createCall(
        'Configuration.set_ump_max_individual_weight',
        {
            v9100: v9100.ConfigurationSetUmpMaxIndividualWeightCall,
            v9291: v9291.ConfigurationSetUmpMaxIndividualWeightCall,
            v9320: v9320.ConfigurationSetUmpMaxIndividualWeightCall,
        }
    ),
    set_ump_service_total_weight: createCall(
        'Configuration.set_ump_service_total_weight',
        {
            v9090: v9090.ConfigurationSetUmpServiceTotalWeightCall,
            v9291: v9291.ConfigurationSetUmpServiceTotalWeightCall,
            v9320: v9320.ConfigurationSetUmpServiceTotalWeightCall,
        }
    ),
    set_validation_upgrade_cooldown: createCall(
        'Configuration.set_validation_upgrade_cooldown',
        {
            v9160: v9160.ConfigurationSetValidationUpgradeCooldownCall,
        }
    ),
    set_validation_upgrade_delay: createCall(
        'Configuration.set_validation_upgrade_delay',
        {
            v9090: v9090.ConfigurationSetValidationUpgradeDelayCall,
        }
    ),
    set_validation_upgrade_frequency: createCall(
        'Configuration.set_validation_upgrade_frequency',
        {
            v9090: v9090.ConfigurationSetValidationUpgradeFrequencyCall,
        }
    ),
    set_zeroth_delay_tranche_width: createCall(
        'Configuration.set_zeroth_delay_tranche_width',
        {
            v9090: v9090.ConfigurationSetZerothDelayTrancheWidthCall,
        }
    ),
}

export const storage = {
    ActiveConfig: createStorage(
        'Configuration.ActiveConfig',
        {
            v9090: v9090.ConfigurationActiveConfigStorage,
            v9111: v9111.ConfigurationActiveConfigStorage,
            v9160: v9160.ConfigurationActiveConfigStorage,
            v9291: v9291.ConfigurationActiveConfigStorage,
            v9320: v9320.ConfigurationActiveConfigStorage,
            v9370: v9370.ConfigurationActiveConfigStorage,
            v9420: v9420.ConfigurationActiveConfigStorage,
            v9430: v9430.ConfigurationActiveConfigStorage,
        }
    ),
    BypassConsistencyCheck: createStorage(
        'Configuration.BypassConsistencyCheck',
        {
            v9160: v9160.ConfigurationBypassConsistencyCheckStorage,
        }
    ),
    PendingConfig: createStorage(
        'Configuration.PendingConfig',
        {
            v9090: v9090.ConfigurationPendingConfigStorage,
            v9111: v9111.ConfigurationPendingConfigStorage,
        }
    ),
    PendingConfigs: createStorage(
        'Configuration.PendingConfigs',
        {
            v9160: v9160.ConfigurationPendingConfigsStorage,
            v9291: v9291.ConfigurationPendingConfigsStorage,
            v9320: v9320.ConfigurationPendingConfigsStorage,
            v9370: v9370.ConfigurationPendingConfigsStorage,
            v9420: v9420.ConfigurationPendingConfigsStorage,
            v9430: v9430.ConfigurationPendingConfigsStorage,
        }
    ),
}

export default {calls}
