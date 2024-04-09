import {OldTypes} from '../../types'


export const types8: OldTypes['types'] = {
    DispatchError: 'DispatchErrorPre6First',
    AccountInfo: 'AccountInfoWithDualRefCount',
    Address: 'AccountId',
    Attestation: {
        ctypeHash: 'Hash',
        attester: 'AccountId',
        delegationId: 'Option<DelegationNodeId>',
        revoked: 'bool'
    },
    Balance: 'u128',
    DelegationNode: {
        rootId: 'DelegationNodeId',
        parent: 'Option<DelegationNodeId>',
        owner: 'AccountId',
        permissions: 'Permissions',
        revoked: 'bool'
    },
    DelegationNodeId: 'Hash',
    DelegationRoot: {
        ctypeHash: 'Hash',
        owner: 'AccountId',
        revoked: 'bool'
    },
    DidRecord: {
        signKey: 'Hash',
        boxKey: 'Hash',
        docRef: 'Option<Vec<u8>>'
    },
    Index: 'u64',
    LookupSource: 'AccountId',
    Permissions: 'u32',
    PublicBoxKey: 'Hash',
    PublicSigningKey: 'Hash',
    Signature: 'MultiSignature',
    XCurrencyId: {
        chainId: 'ChainId',
        currencyId: 'Vec<u8>'
    },
    ChainId: {
        _enum: {
            RelayChain: 'Null',
            ParaChain: 'ParaId'
        }
    },
    CurrencyIdOf: 'CurrencyId',
    CurrencyId: {
        _enum: {
            DOT: 0,
            KSM: 1,
            KILT: 2
        }
    },
    XcmError: {
        _enum: {
            Undefined: 0,
            Unimplemented: 1,
            UnhandledXcmVersion: 2,
            UnhandledXcmMessage: 3,
            UnhandledEffect: 4,
            EscalationOfPrivilege: 5,
            UntrustedReserveLocation: 6,
            UntrustedTeleportLocation: 7,
            DestinationBufferOverflow: 8,
            CannotReachDestination: 9,
            MultiLocationFull: 10,
            FailedToDecode: 11,
            BadOrigin: 12,
            ExceedsMaxMessageSize: 13,
            FailedToTransactAsset: 14
        }
    },
    ReferendumInfo: {
        _enum: {
            Ongoing: 'ReferendumStatus',
            Finished: 'ReferendumInfoFinished'
        }
    }
}
