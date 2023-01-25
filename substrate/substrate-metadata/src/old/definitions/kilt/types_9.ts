import {OldTypes} from '../../types'


export const types9: OldTypes['types'] = {
    // Runtime types
    DispatchError: 'DispatchErrorPre6First',
    AccountInfo: 'AccountInfoWithTripleRefCount',
    Address: 'MultiAddress',
    AmountOf: 'i128',
    Balance: 'u128',
    BlockNumber: 'u64',
    Index: 'u64',
    LookupSource: 'MultiAddress',

    // Ctype types
    CtypeCreatorOf: 'DidIdentifierOf',
    CtypeHashOf: 'Hash',

    // Attestation types
    ClaimHashOf: 'Hash',
    AttesterOf: 'DidIdentifierOf',
    AttestationDetails: {
        ctypeHash: 'CtypeHashOf',
        attester: 'AttesterOf',
        delegationId: 'Option<DelegationNodeIdOf>',
        revoked: 'bool'
    },

    // Delegation types
    Permissions: 'u32',
    DelegationNodeIdOf: 'Hash',
    DelegatorIdOf: 'DidIdentifierOf',
    DelegationSignature: 'DidSignature',
    DelegationRoot: {
        ctypeHash: 'CtypeHashOf',
        owner: 'DelegatorIdOf',
        revoked: 'bool'
    },
    DelegationNode: {
        rootId: 'DelegationNodeIdOf',
        parent: 'Option<DelegationNodeIdOf>',
        owner: 'DelegatorIdOf',
        permissions: 'Permissions',
        revoked: 'bool'
    },

    // Did types
    KeyIdOf: 'Hash',
    DidIdentifierOf: 'AccountId',
    AccountIdentifierOf: 'AccountId',
    BlockNumberOf: 'BlockNumber',
    DidCallableOf: 'Call',
    DidVerificationKey: {
        _enum: {
            Ed25519: '[u8; 32]',
            Sr25519: '[u8; 32]'
        }
    },
    DidEncryptionKey: {
        _enum: {
            X25519: '[u8; 32]'
        }
    },
    DidPublicKey: {
        _enum: {
            PublicVerificationKey: 'DidVerificationKey',
            PublicEncryptionKey: 'DidEncryptionKey'
        }
    },
    DidVerificationKeyRelationship: {
        _enum: [
            'Authentication',
            'CapabilityDelegation',
            'CapabilityInvocation',
            'AssertionMethod'
        ]
    },
    DidSignature: {
        _enum: {
            Ed25519: 'Ed25519Signature',
            Sr25519: 'Sr25519Signature'
        }
    },
    DidError: {
        _enum: {
            StorageError: 'StorageError',
            SignatureError: 'SignatureError',
            UrlError: 'UrlError',
            InternalError: 'Null'
        }
    },
    StorageError: {
        _enum: {
            DidAlreadyPresent: 'Null',
            DidNotPresent: 'Null',
            DidKeyNotPresent: 'DidVerificationKeyRelationship',
            VerificationKeyNotPresent: 'Null',
            CurrentlyActiveKey: 'Null',
            MaxTxCounterValue: 'Null'
        }
    },
    SignatureError: {
        _enum: ['InvalidSignatureFormat', 'InvalidSignature', 'InvalidNonce']
    },
    KeyError: {
        _enum: ['InvalidVerificationKeyFormat', 'InvalidEncryptionKeyFormat']
    },
    UrlError: {
        _enum: ['InvalidUrlEncoding', 'InvalidUrlScheme']
    },
    DidPublicKeyDetails: {
        key: 'DidPublicKey',
        blockNumber: 'BlockNumberOf'
    },
    DidDetails: {
        authenticationKey: 'KeyIdOf',
        keyAgreementKeys: 'BTreeSet<KeyIdOf>',
        delegationKey: 'Option<KeyIdOf>',
        attestationKey: 'Option<KeyIdOf>',
        publicKeys: 'BTreeMap<KeyIdOf, DidPublicKeyDetails>',
        endpointUrl: 'Option<Url>',
        lastTxCounter: 'u64'
    },
    DidCreationOperation: {
        did: 'DidIdentifierOf',
        newAuthenticationKey: 'DidVerificationKey',
        newKeyAgreementKeys: 'BTreeSet<DidEncryptionKey>',
        newAttestationKey: 'Option<DidVerificationKey>',
        newDelegationKey: 'Option<DidVerificationKey>',
        newEndpointUrl: 'Option<Url>'
    },
    DidUpdateOperation: {
        did: 'DidIdentifierOf',
        newAuthenticationKey: 'Option<DidVerificationKey>',
        newKeyAgreementKeys: 'BTreeSet<DidEncryptionKey>',
        attestationKeyUpdate: 'DidVerificationKeyUpdateAction',
        delegationKeyUpdate: 'DidVerificationKeyUpdateAction',
        publicKeysToRemove: 'BTreeSet<KeyIdOf>',
        newEndpointUrl: 'Option<Url>',
        txCounter: 'u64'
    },
    DidVerificationKeyUpdateAction: {
        _enum: {
            Ignore: 'Null',
            Change: 'DidVerificationKey',
            Delete: 'Null'
        }
    },
    DidDeletionOperation: {
        did: 'DidIdentifierOf',
        txCounter: 'u64'
    },
    DidAuthorizedCallOperation: {
        did: 'DidIdentifierOf',
        txCounter: 'u64',
        call: 'DidCallableOf'
    },
    HttpUrl: {
        payload: 'Text'
    },
    FtpUrl: {
        payload: 'Text'
    },
    IpfsUrl: {
        payload: 'Text'
    },
    Url: {
        _enum: {
            Http: 'HttpUrl',
            Ftp: 'FtpUrl',
            Ipfs: 'IpfsUrl'
        }
    },
    // Launch types
    LockedBalance: {
        block: 'BlockNumber',
        amount: 'Balance'
    }
}
