import {OldTypes} from '../../types'


export const types10: OldTypes['types'] = {
    // Runtime
    DispatchError: 'DispatchErrorPre6First',
    AccountInfo: 'AccountInfoWithTripleRefCount',
    Address: 'MultiAddress',
    AmountOf: 'i128',
    Balance: 'u128',
    BlockNumber: 'u64',
    Index: 'u64',
    LookupSource: 'MultiAddress',

    // Ctypes
    CtypeCreatorOf: 'AccountId',
    CtypeHashOf: 'Hash',
    ClaimHashOf: 'Hash',

    // Attestations
    AttesterOf: 'AccountId',
    AttestationDetails: {
        ctypeHash: 'CtypeHashOf',
        attester: 'AttesterOf',
        delegationId: 'Option<DelegationNodeIdOf>',
        revoked: 'bool'
    },

    // Delegations
    Permissions: 'u32',
    DelegationNodeIdOf: 'Hash',
    DelegatorIdOf: 'AccountId',
    DelegateSignatureTypeOf: 'Vec<u8>',
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

    // DIDs
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
            InputError: 'InputError',
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
    InputError: {
        _enum: [
            'MaxKeyAgreementKeysLimitExceeded',
            'MaxVerificationKeysToRemoveLimitExceeded',
            'MaxUrlLengthExceeded'
        ]
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

    // LaunchPallet
    LockedBalance: {
        block: 'BlockNumber',
        amount: 'Balance'
    },

    // Staking
    BalanceOf: 'Balance',
    RoundInfo: {
        current: 'SessionIndex',
        first: 'BlockNumber',
        length: 'BlockNumber'
    },
    OrderedSet: 'Vec<Stake>',
    Stake: {
        owner: 'AccountId',
        amount: 'Balance'
    },
    TotalStake: {
        collators: 'Balance',
        delegators: 'Balance'
    },
    InflationInfo: {
        collator: 'StakingInfo',
        delegator: 'StakingInfo'
    },
    StakingInfo: {
        maxRate: 'Perquintill',
        rewardRate: 'RewardRate'
    },
    RewardRate: {
        annual: 'Perquintill',
        perBlock: 'Perquintill'
    },
    Delegator: {
        delegations: 'Vec<Stake>',
        total: 'Balance'
    },
    CollatorSnapshot: {
        stake: 'Balance',
        delegators: 'Vec<Stake>',
        total: 'Balance'
    },
    Collator: {
        id: 'AccountId',
        stake: 'Balance',
        delegators: 'Vec<Stake>',
        total: 'Balance',
        state: 'CollatorStatus'
    },
    CollatorStatus: {
        _enum: {
            Active: 'Null',
            Leaving: 'SessionIndex'
        }
    }
}
