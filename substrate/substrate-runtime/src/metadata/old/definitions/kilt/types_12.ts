import {OldTypes} from '../../types'
import {types10} from './types_10'


export const types12: OldTypes['types'] = {
    ...types10,
    // Staking updated types
    DelegationCounter: {
        round: 'SessionIndex',
        counter: 'u32'
    },
    // DID updated types
    DidVerificationKey: {
        _enum: {
            Ed25519: '[u8; 32]',
            Sr25519: '[u8; 32]',
            Secp256k1: '[u8; 33]'
        }
    },
    DidSignature: {
        _enum: {
            Ed25519: 'Ed25519Signature',
            Sr25519: 'Sr25519Signature',
            'Ecdsa-Secp256k1': 'EcdsaSignature'
        }
    }
}
