import {OldTypes} from '../../types'
import {types20} from './types_20'


export const types21: OldTypes['types'] = {
    ...types20,
    StorageError: {
        _enum: {
            DidAlreadyPresent: 'Null',
            DidNotPresent: 'Null',
            DidKeyNotPresent: 'DidVerificationKeyRelationship',
            VerificationKeyNotPresent: 'Null',
            CurrentlyActiveKey: 'Null',
            MaxTxCounterValue: 'Null',
            MaxPublicKeysPerDidKeyIdentifierExceeded: 'Null',
            MaxTotalKeyAgreementKeysExceeded: 'Null',
            MaxOldAttestationKeysExceeded: 'Null'
        }
    },
    DidCreationDetails: {
        did: 'DidIdentifierOf',
        newKeyAgreementKeys: 'DidNewKeyAgreementKeys',
        newAssertionMethodKey: 'Option<DidVerificationKey>',
        newCapabilityDelegationKey: 'Option<DidVerificationKey>',
        newServiceEndpoints: 'Option<ServiceEndpoints>'
    },
    DidDetails: {
        authenticationKey: 'KeyIdOf',
        keyAgreementKeys: 'DidKeyAgreementKeys',
        capabilityDelegationKey: 'Option<KeyIdOf>',
        assertionMethodKey: 'Option<KeyIdOf>',
        publicKeys: 'DidPublicKeyMap',
        serviceEndpoints: 'Option<ServiceEndpoints>',
        lastTxCounter: 'u64'
    },
    DelegateSignatureTypeOf: 'DidSignature',
    ContentType: {
        _enum: ['application/json', 'application/ld+json']
    },
    Collator: {
        id: 'AccountId',
        stake: 'Balance',
        delegators: 'Vec<Stake>',
        total: 'Balance',
        state: 'CollatorStatus'
    },
    Delegator: {
        delegations: 'Vec<Stake>',
        total: 'Balance'
    },
    Keys: 'SessionKeys1'
}
