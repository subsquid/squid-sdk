import {OldTypes} from '../../types'
import { types23 } from './types_23'


export const types25: OldTypes['types'] = {
    ...types23,
    DidAuthorizedCallOperation: {
        did: 'DidIdentifierOf',
        txCounter: 'u64',
        call: 'DidCallableOf',
        submitter: 'AccountId'
    }
}
