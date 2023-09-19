import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    IdentityCleared: createEvent(
        'Identity.IdentityCleared',
        {
            v1030: IdentityIdentityClearedEvent,
            v9130: IdentityIdentityClearedEvent,
        }
    ),
    IdentityKilled: createEvent(
        'Identity.IdentityKilled',
        {
            v1030: IdentityIdentityKilledEvent,
            v9130: IdentityIdentityKilledEvent,
        }
    ),
    IdentitySet: createEvent(
        'Identity.IdentitySet',
        {
            v1030: IdentityIdentitySetEvent,
            v9130: IdentityIdentitySetEvent,
        }
    ),
    JudgementGiven: createEvent(
        'Identity.JudgementGiven',
        {
            v1030: IdentityJudgementGivenEvent,
            v9130: IdentityJudgementGivenEvent,
        }
    ),
    JudgementRequested: createEvent(
        'Identity.JudgementRequested',
        {
            v1030: IdentityJudgementRequestedEvent,
            v9130: IdentityJudgementRequestedEvent,
        }
    ),
    JudgementUnrequested: createEvent(
        'Identity.JudgementUnrequested',
        {
            v1030: IdentityJudgementUnrequestedEvent,
            v9130: IdentityJudgementUnrequestedEvent,
        }
    ),
    RegistrarAdded: createEvent(
        'Identity.RegistrarAdded',
        {
            v1030: IdentityRegistrarAddedEvent,
            v9130: IdentityRegistrarAddedEvent,
        }
    ),
    SubIdentityAdded: createEvent(
        'Identity.SubIdentityAdded',
        {
            v2015: IdentitySubIdentityAddedEvent,
            v9130: IdentitySubIdentityAddedEvent,
        }
    ),
    SubIdentityRemoved: createEvent(
        'Identity.SubIdentityRemoved',
        {
            v2015: IdentitySubIdentityRemovedEvent,
            v9130: IdentitySubIdentityRemovedEvent,
        }
    ),
    SubIdentityRevoked: createEvent(
        'Identity.SubIdentityRevoked',
        {
            v2015: IdentitySubIdentityRevokedEvent,
            v9130: IdentitySubIdentityRevokedEvent,
        }
    ),
}

export const calls = {
    add_registrar: createCall(
        'Identity.add_registrar',
        {
            v1030: IdentityAddRegistrarCall,
            v9291: IdentityAddRegistrarCall,
        }
    ),
    add_sub: createCall(
        'Identity.add_sub',
        {
            v2015: IdentityAddSubCall,
            v2028: IdentityAddSubCall,
            v9111: IdentityAddSubCall,
        }
    ),
    cancel_request: createCall(
        'Identity.cancel_request',
        {
            v1030: IdentityCancelRequestCall,
            v9111: IdentityCancelRequestCall,
        }
    ),
    clear_identity: createCall(
        'Identity.clear_identity',
        {
            v1030: IdentityClearIdentityCall,
        }
    ),
    kill_identity: createCall(
        'Identity.kill_identity',
        {
            v1030: IdentityKillIdentityCall,
            v1050: IdentityKillIdentityCall,
            v2028: IdentityKillIdentityCall,
            v9111: IdentityKillIdentityCall,
        }
    ),
    provide_judgement: createCall(
        'Identity.provide_judgement',
        {
            v1030: IdentityProvideJudgementCall,
            v1050: IdentityProvideJudgementCall,
            v2028: IdentityProvideJudgementCall,
            v9111: IdentityProvideJudgementCall,
            v9300: IdentityProvideJudgementCall,
        }
    ),
    quit_sub: createCall(
        'Identity.quit_sub',
        {
            v2015: IdentityQuitSubCall,
        }
    ),
    remove_sub: createCall(
        'Identity.remove_sub',
        {
            v2015: IdentityRemoveSubCall,
            v2028: IdentityRemoveSubCall,
            v9111: IdentityRemoveSubCall,
        }
    ),
    rename_sub: createCall(
        'Identity.rename_sub',
        {
            v2015: IdentityRenameSubCall,
            v2028: IdentityRenameSubCall,
            v9111: IdentityRenameSubCall,
        }
    ),
    request_judgement: createCall(
        'Identity.request_judgement',
        {
            v1030: IdentityRequestJudgementCall,
            v9111: IdentityRequestJudgementCall,
        }
    ),
    set_account_id: createCall(
        'Identity.set_account_id',
        {
            v1031: IdentitySetAccountIdCall,
            v9291: IdentitySetAccountIdCall,
        }
    ),
    set_fee: createCall(
        'Identity.set_fee',
        {
            v1030: IdentitySetFeeCall,
        }
    ),
    set_fields: createCall(
        'Identity.set_fields',
        {
            v1030: IdentitySetFieldsCall,
        }
    ),
    set_identity: createCall(
        'Identity.set_identity',
        {
            v1030: IdentitySetIdentityCall,
            v1032: IdentitySetIdentityCall,
        }
    ),
    set_subs: createCall(
        'Identity.set_subs',
        {
            v1030: IdentitySetSubsCall,
        }
    ),
}

export const constants = {
    BasicDeposit: createConstant(
        'Identity.BasicDeposit',
        {
            v1062: IdentityBasicDepositConstant,
        }
    ),
    FieldDeposit: createConstant(
        'Identity.FieldDeposit',
        {
            v1062: IdentityFieldDepositConstant,
        }
    ),
    MaxAdditionalFields: createConstant(
        'Identity.MaxAdditionalFields',
        {
            v1062: IdentityMaxAdditionalFieldsConstant,
        }
    ),
    MaxRegistrars: createConstant(
        'Identity.MaxRegistrars',
        {
            v1062: IdentityMaxRegistrarsConstant,
        }
    ),
    MaxSubAccounts: createConstant(
        'Identity.MaxSubAccounts',
        {
            v1062: IdentityMaxSubAccountsConstant,
        }
    ),
    SubAccountDeposit: createConstant(
        'Identity.SubAccountDeposit',
        {
            v1062: IdentitySubAccountDepositConstant,
        }
    ),
}

export const storage = {
    IdentityOf: createStorage(
        'Identity.IdentityOf',
        {
            v1030: IdentityIdentityOfStorage,
            v1032: IdentityIdentityOfStorage,
        }
    ),
    Registrars: createStorage(
        'Identity.Registrars',
        {
            v1030: IdentityRegistrarsStorage,
        }
    ),
    SubsOf: createStorage(
        'Identity.SubsOf',
        {
            v1030: IdentitySubsOfStorage,
            v1031: IdentitySubsOfStorage,
        }
    ),
    SuperOf: createStorage(
        'Identity.SuperOf',
        {
            v1031: IdentitySuperOfStorage,
        }
    ),
}

export default {events, calls, constants}
