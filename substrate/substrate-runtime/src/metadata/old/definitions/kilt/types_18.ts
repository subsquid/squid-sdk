import {OldTypes} from '../../types'
import {types17} from './types_17'


export const types18: OldTypes['types'] = {
    ...types17,
    DidCreationDetails: {
        did: 'DidIdentifierOf',
        newKeyAgreementKeys: 'BTreeSet<DidEncryptionKey>',
        newAttestationKey: 'Option<DidVerificationKey>',
        newDelegationKey: 'Option<DidVerificationKey>',
        newEndpointUrl: 'Option<Url>'
    },
    DidUpdateDetails: {
        newAuthenticationKey: 'Option<DidVerificationKey>',
        newKeyAgreementKeys: 'BTreeSet<DidEncryptionKey>',
        attestationKeyUpdate: 'DidVerificationKeyUpdateAction',
        delegationKeyUpdate: 'DidVerificationKeyUpdateAction',
        publicKeysToRemove: 'BTreeSet<KeyIdOf>',
        newEndpointUrl: 'Option<Url>'
    }
}
