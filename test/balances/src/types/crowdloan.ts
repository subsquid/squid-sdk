import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    AddedToNewRaise: createEvent(
        'Crowdloan.AddedToNewRaise',
        {
            v9010: CrowdloanAddedToNewRaiseEvent,
            v9230: CrowdloanAddedToNewRaiseEvent,
        }
    ),
    AllRefunded: createEvent(
        'Crowdloan.AllRefunded',
        {
            v9010: CrowdloanAllRefundedEvent,
            v9230: CrowdloanAllRefundedEvent,
        }
    ),
    Contributed: createEvent(
        'Crowdloan.Contributed',
        {
            v9010: CrowdloanContributedEvent,
            v9230: CrowdloanContributedEvent,
        }
    ),
    Created: createEvent(
        'Crowdloan.Created',
        {
            v9010: CrowdloanCreatedEvent,
            v9230: CrowdloanCreatedEvent,
        }
    ),
    DeployDataFixed: createEvent(
        'Crowdloan.DeployDataFixed',
        {
            v9010: CrowdloanDeployDataFixedEvent,
        }
    ),
    Dissolved: createEvent(
        'Crowdloan.Dissolved',
        {
            v9010: CrowdloanDissolvedEvent,
            v9230: CrowdloanDissolvedEvent,
        }
    ),
    Edited: createEvent(
        'Crowdloan.Edited',
        {
            v9010: CrowdloanEditedEvent,
            v9230: CrowdloanEditedEvent,
        }
    ),
    HandleBidResult: createEvent(
        'Crowdloan.HandleBidResult',
        {
            v9010: CrowdloanHandleBidResultEvent,
            v9111: CrowdloanHandleBidResultEvent,
            v9160: CrowdloanHandleBidResultEvent,
            v9170: CrowdloanHandleBidResultEvent,
            v9190: CrowdloanHandleBidResultEvent,
            v9230: CrowdloanHandleBidResultEvent,
            v9320: CrowdloanHandleBidResultEvent,
            v9420: CrowdloanHandleBidResultEvent,
            v9430: CrowdloanHandleBidResultEvent,
        }
    ),
    MemoUpdated: createEvent(
        'Crowdloan.MemoUpdated',
        {
            v9010: CrowdloanMemoUpdatedEvent,
            v9230: CrowdloanMemoUpdatedEvent,
        }
    ),
    Onboarded: createEvent(
        'Crowdloan.Onboarded',
        {
            v9010: CrowdloanOnboardedEvent,
        }
    ),
    PartiallyRefunded: createEvent(
        'Crowdloan.PartiallyRefunded',
        {
            v9010: CrowdloanPartiallyRefundedEvent,
            v9230: CrowdloanPartiallyRefundedEvent,
        }
    ),
    Withdrew: createEvent(
        'Crowdloan.Withdrew',
        {
            v9010: CrowdloanWithdrewEvent,
            v9230: CrowdloanWithdrewEvent,
        }
    ),
}

export const calls = {
    add_memo: createCall(
        'Crowdloan.add_memo',
        {
            v9010: CrowdloanAddMemoCall,
        }
    ),
    contribute: createCall(
        'Crowdloan.contribute',
        {
            v9010: CrowdloanContributeCall,
        }
    ),
    contribute_all: createCall(
        'Crowdloan.contribute_all',
        {
            v9160: CrowdloanContributeAllCall,
        }
    ),
    create: createCall(
        'Crowdloan.create',
        {
            v9010: CrowdloanCreateCall,
            v9111: CrowdloanCreateCall,
        }
    ),
    dissolve: createCall(
        'Crowdloan.dissolve',
        {
            v9010: CrowdloanDissolveCall,
        }
    ),
    edit: createCall(
        'Crowdloan.edit',
        {
            v9010: CrowdloanEditCall,
            v9111: CrowdloanEditCall,
        }
    ),
    poke: createCall(
        'Crowdloan.poke',
        {
            v9010: CrowdloanPokeCall,
        }
    ),
    refund: createCall(
        'Crowdloan.refund',
        {
            v9010: CrowdloanRefundCall,
        }
    ),
    withdraw: createCall(
        'Crowdloan.withdraw',
        {
            v9010: CrowdloanWithdrawCall,
        }
    ),
}

export const constants = {
    MinContribution: createConstant(
        'Crowdloan.MinContribution',
        {
            v9010: CrowdloanMinContributionConstant,
        }
    ),
    PalletId: createConstant(
        'Crowdloan.PalletId',
        {
            v9010: CrowdloanPalletIdConstant,
        }
    ),
    RemoveKeysLimit: createConstant(
        'Crowdloan.RemoveKeysLimit',
        {
            v9010: CrowdloanRemoveKeysLimitConstant,
        }
    ),
}

export const storage = {
    EndingsCount: createStorage(
        'Crowdloan.EndingsCount',
        {
            v9010: CrowdloanEndingsCountStorage,
        }
    ),
    Funds: createStorage(
        'Crowdloan.Funds',
        {
            v9010: CrowdloanFundsStorage,
            v9180: CrowdloanFundsStorage,
        }
    ),
    NewRaise: createStorage(
        'Crowdloan.NewRaise',
        {
            v9010: CrowdloanNewRaiseStorage,
        }
    ),
    NextFundIndex: createStorage(
        'Crowdloan.NextFundIndex',
        {
            v9180: CrowdloanNextFundIndexStorage,
        }
    ),
    NextTrieIndex: createStorage(
        'Crowdloan.NextTrieIndex',
        {
            v9010: CrowdloanNextTrieIndexStorage,
        }
    ),
}

export default {events, calls, constants}
