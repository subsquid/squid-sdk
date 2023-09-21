import {sts} from '../../pallet.support'
import {ChangesTrieConfiguration} from './types'

/**
 *  Set the new runtime code without doing any checks of the given `code`.
 */
export type SystemSetCodeWithoutChecksCall = {
    code: Bytes,
}

export const SystemSetCodeWithoutChecksCall: sts.Type<SystemSetCodeWithoutChecksCall> = sts.struct(() => {
    return  {
        code: sts.bytes(),
    }
})

/**
 *  Set the new runtime code.
 */
export type SystemSetCodeCall = {
    code: Bytes,
}

export const SystemSetCodeCall: sts.Type<SystemSetCodeCall> = sts.struct(() => {
    return  {
        code: sts.bytes(),
    }
})

/**
 *  Set the new changes trie configuration.
 */
export type SystemSetChangesTrieConfigCall = {
    changes_trie_config?: (ChangesTrieConfiguration | undefined),
}

export const SystemSetChangesTrieConfigCall: sts.Type<SystemSetChangesTrieConfigCall> = sts.struct(() => {
    return  {
        changes_trie_config: sts.option(() => ChangesTrieConfiguration),
    }
})
