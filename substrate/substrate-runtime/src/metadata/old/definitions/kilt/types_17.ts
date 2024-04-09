import {OldTypes} from '../../types'
import {types12} from './types_12'


export const types17: OldTypes['types'] = {
    ...types12,
    // Delegation updated types
    DelegationNode: {
        hierarchyRootId: 'DelegationNodeIdOf',
        parent: 'Option<DelegationNodeIdOf>',
        children: 'BTreeSet<DelegationNodeIdOf>',
        details: 'DelegationDetails'
    },
    DelegationDetails: {
        owner: 'DelegatorIdOf',
        revoked: 'bool',
        permissions: 'Permissions'
    },
    DelegationHierarchyDetails: {
        ctypeHash: 'CtypeHashOf'
    },
    DelegationStorageVersion: {
        _enum: ['V1', 'V2']
    }
}
