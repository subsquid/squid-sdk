import {sts} from '../../pallet.support'
import {ChangesTrieConfiguration, Perbill, DispatchError, DispatchInfo} from './types'

/**
 * Set the new changes trie configuration.
 * 
 * # <weight>
 * - `O(1)`
 * - 1 storage write or delete (codec `O(1)`).
 * - 1 call to `deposit_log`: Uses `append` API, so O(1)
 * - Base Weight: 7.218 µs
 * - DB Weight:
 *     - Writes: Changes Trie, System Digest
 * # </weight>
 */
export type SystemSetChangesTrieConfigCall = {
    changesTrieConfig?: (ChangesTrieConfiguration | undefined),
}

export const SystemSetChangesTrieConfigCall: sts.Type<SystemSetChangesTrieConfigCall> = sts.struct(() => {
    return  {
        changesTrieConfig: sts.option(() => ChangesTrieConfiguration),
    }
})

/**
 * Make some on-chain remark.
 * 
 * # <weight>
 * - `O(1)`
 * # </weight>
 */
export type SystemRemarkCall = {
    remark: Bytes,
}

export const SystemRemarkCall: sts.Type<SystemRemarkCall> = sts.struct(() => {
    return  {
        remark: sts.bytes(),
    }
})

/**
 * Kill all storage items with a key that starts with the given prefix.
 * 
 * **NOTE:** We rely on the Root origin to provide us the number of subkeys under
 * the prefix we are removing to accurately calculate the weight of this function.
 * 
 * # <weight>
 * - `O(P)` where `P` amount of keys with prefix `prefix`
 * - `P` storage deletions.
 * - Base Weight: 0.834 * P µs
 * - Writes: Number of subkeys + 1
 * # </weight>
 */
export type SystemKillPrefixCall = {
    prefix: Bytes,
    subkeys: number,
}

export const SystemKillPrefixCall: sts.Type<SystemKillPrefixCall> = sts.struct(() => {
    return  {
        prefix: sts.bytes(),
        subkeys: sts.number(),
    }
})

/**
 * A dispatch that will fill the block weight up to the given ratio.
 */
export type SystemFillBlockCall = {
    ratio: Perbill,
}

export const SystemFillBlockCall: sts.Type<SystemFillBlockCall> = sts.struct(() => {
    return  {
        ratio: Perbill,
    }
})

/**
 * An extrinsic failed. \[error, info\]
 */
export type SystemExtrinsicFailedEvent = [DispatchError, DispatchInfo]

export const SystemExtrinsicFailedEvent: sts.Type<SystemExtrinsicFailedEvent> = sts.tuple(() => DispatchError, DispatchInfo)
