import {OldTypesAlias} from "../../types"


export const typesAlias: OldTypesAlias = {
    assets: {
        Approval: 'AssetApproval',
        ApprovalKey: 'AssetApprovalKey',
        Balance: 'TAssetBalance',
        DestroyWitness: 'AssetDestroyWitness'
    },
    babe: {
        EquivocationProof: 'BabeEquivocationProof'
    },
    balances: {
        Status: 'BalanceStatus'
    },
    beefy: {
        AuthorityId: 'BeefyId'
    },
    contracts: {
        StorageKey: 'ContractStorageKey'
    },
    electionProviderMultiPhase: {
        Phase: 'ElectionPhase'
    },
    ethereum: {
        Block: 'EthBlock',
        Header: 'EthHeader',
        Receipt: 'EthReceipt',
        Transaction: 'EthTransaction',
        TransactionStatus: 'EthTransactionStatus'
    },
    evm: {
        Account: 'EvmAccount',
        Log: 'EvmLog',
        Vicinity: 'EvmVicinity'
    },
    grandpa: {
        Equivocation: 'GrandpaEquivocation',
        EquivocationProof: 'GrandpaEquivocationProof'
    },
    identity: {
        Judgement: 'IdentityJudgement'
    },
    inclusion: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    paraDisputes: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    paraInclusion: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    paraScheduler: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    paraShared: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    parachains: {
        Id: 'ParaId'
    },
    parasDisputes: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    parasInclusion: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    parasScheduler: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    parasShared: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    proposeParachain: {
        Proposal: 'ParachainProposal'
    },
    proxy: {
        Announcement: 'ProxyAnnouncement'
    },
    scheduler: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    shared: {
        ValidatorIndex: 'ParaValidatorIndex'
    },
    society: {
        Judgement: 'SocietyJudgement',
        Vote: 'SocietyVote'
    },
    staking: {
        // Compact: 'CompactAssignments'
        // The above alias caused types like `Compact<Balance>` to be treated
        // as `CompactAssignments` which is incorrect.
        // Remove it until further investigations.
    },
    treasury: {
        Proposal: 'TreasuryProposal'
    },
    xcm: {
        AssetId: 'XcmAssetId'
    },
    xcmPallet: {
        AssetId: 'XcmAssetId'
    }
}
