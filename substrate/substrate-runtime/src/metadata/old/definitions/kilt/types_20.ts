import {OldTypes} from '../../types'
import {types19} from './types_19'


export const types20: OldTypes['types'] = {
    ...types19,
    // Staking
    OrderedSet: 'BoundedVec<Stake, MaxCollatorCandidates>',
    MaxCollatorCandidates: 'u32',
    Collator: {
        id: 'AccountId',
        stake: 'Balance',
        // new
        delegators: 'OrderedSet<Stake, MaxDelegatorsPerCollator>',
        total: 'Balance',
        state: 'CollatorStatus'
    },
    MaxDelegatorsPerCollator: 'u32',
    Delegator: {
        // new
        delegations: 'OrderedSet<Stake, MaxCollatorsPerDelegator>',
        total: 'Balance'
    },
    MaxCollatorsPerDelegator: 'u32',
    StakingStorageVersion: {
        _enum: ['V1_0_0', 'V2_0_0', 'V3_0_0', 'V4']
    },

    // Attestation
    MaxDelegatedAttestations: 'u32',

    // KILT Launch
    MaxClaims: 'u32',

    // Delegation
    DelegationNode: {
        hierarchyRootId: 'DelegationNodeIdOf',
        parent: 'Option<DelegationNodeIdOf>',
        // new
        children: 'BoundedBTreeSet<DelegationNodeIdOf, MaxChildren>',
        details: 'DelegationDetails'
    },
    MaxChildren: 'u32',

    // DIDs
    DidNewKeyAgreementKeys:
        'BoundedBTreeSet<DidEncryptionKey, MaxNewKeyAgreementKeys>',
    DidKeyAgreementKeys: 'BoundedBTreeSet<KeyIdOf, MaxTotalKeyAgreementKeys>',
    DidVerificationKeysToRevoke:
        'BoundedBTreeSet<KeyIdOf, MaxVerificationKeysToRevoke>',
    MaxNewKeyAgreementKeys: 'u32',
    MaxTotalKeyAgreementKeys: 'u32',
    MaxVerificationKeysToRevoke: 'u32',
    MaxPublicKeysPerDid: 'u32',
    DidPublicKeyMap:
        'BoundedBTreeMap<KeyIdOf, DidPublicKeyDetails, MaxPublicKeysPerDid>',
    DidCreationDetails: {
        did: 'DidIdentifierOf',
        newKeyAgreementKeys: 'DidNewKeyAgreementKeys',
        newAttestationKey: 'Option<DidVerificationKey>',
        newDelegationKey: 'Option<DidVerificationKey>',
        newServiceEndpoints: 'Option<ServiceEndpoints>'
    },
    DidUpdateDetails: {
        newAuthenticationKey: 'Option<DidVerificationKey>',
        // new
        newKeyAgreementKeys: 'DidNewKeyAgreementKeys',
        attestationKeyUpdate: 'DidFragmentUpdateAction_DidVerificationKey',
        delegationKeyUpdate: 'DidFragmentUpdateAction_DidVerificationKey',
        // new
        publicKeysToRemove: 'DidVerificationKeysToRevoke',
        serviceEndpointsUpdate: 'DidFragmentUpdateAction_ServiceEndpoints'
    },
    DidDetails: {
        authenticationKey: 'KeyIdOf',
        // new
        keyAgreementKeys: 'DidKeyAgreementKeys',
        delegationKey: 'Option<KeyIdOf>',
        attestationKey: 'Option<KeyIdOf>',
        // new
        publicKeys: 'DidPublicKeyMap',
        serviceEndpoints: 'Option<ServiceEndpoints>',
        lastTxCounter: 'u64'
    },
    ServiceEndpoints: {
        contentHash: 'Hash',
        // new
        urls: 'BoundedVec<Url, MaxEndpointUrlsCount>',
        contentType: 'ContentType'
    },
    MaxUrlLength: 'u32',
    MaxEndpointUrlsCount: 'u32',
    StorageError: {
        _enum: {
            DidAlreadyPresent: 'Null',
            DidNotPresent: 'Null',
            DidKeyNotPresent: 'DidVerificationKeyRelationship',
            VerificationKeyNotPresent: 'Null',
            CurrentlyActiveKey: 'Null',
            MaxTxCounterValue: 'Null',
            // new
            MaxPublicKeysPerDidKeyIdentifierExceeded: 'Null',
            MaxTotalKeyAgreementKeysExceeded: 'Null',
            MaxOldAttestationKeysExceeded: 'Null'
        }
    }
}
