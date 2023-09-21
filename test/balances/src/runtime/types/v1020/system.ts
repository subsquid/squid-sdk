import {sts} from '../../pallet.support'
import {KeyValue, Key, DispatchInfo, DispatchError} from './types'

/**
 *  Set some items of storage.
 */
export type SystemSetStorageCall = {
    items: KeyValue[],
}

export const SystemSetStorageCall: sts.Type<SystemSetStorageCall> = sts.struct(() => {
    return  {
        items: sts.array(() => KeyValue),
    }
})

/**
 *  Set the number of pages in the WebAssembly environment's heap.
 */
export type SystemSetHeapPagesCall = {
    pages: bigint,
}

export const SystemSetHeapPagesCall: sts.Type<SystemSetHeapPagesCall> = sts.struct(() => {
    return  {
        pages: sts.bigint(),
    }
})

/**
 *  Set the new code.
 */
export type SystemSetCodeCall = {
    new: Bytes,
}

export const SystemSetCodeCall: sts.Type<SystemSetCodeCall> = sts.struct(() => {
    return  {
        new: sts.bytes(),
    }
})

/**
 *  Make some on-chain remark.
 */
export type SystemRemarkCall = {
    _remark: Bytes,
}

export const SystemRemarkCall: sts.Type<SystemRemarkCall> = sts.struct(() => {
    return  {
        _remark: sts.bytes(),
    }
})

/**
 *  Kill some items from storage.
 */
export type SystemKillStorageCall = {
    keys: Key[],
}

export const SystemKillStorageCall: sts.Type<SystemKillStorageCall> = sts.struct(() => {
    return  {
        keys: sts.array(() => Key),
    }
})

/**
 *  Kill all storage items with a key that starts with the given prefix.
 */
export type SystemKillPrefixCall = {
    prefix: Key,
}

export const SystemKillPrefixCall: sts.Type<SystemKillPrefixCall> = sts.struct(() => {
    return  {
        prefix: Key,
    }
})

/**
 *  A big dispatch that will disallow any other transaction to be included.
 */
export type SystemFillBlockCall = null

export const SystemFillBlockCall: sts.Type<SystemFillBlockCall> = sts.unit()

/**
 *  An extrinsic completed successfully.
 */
export type SystemExtrinsicSuccessEvent = [DispatchInfo]

export const SystemExtrinsicSuccessEvent: sts.Type<SystemExtrinsicSuccessEvent> = sts.tuple(() => DispatchInfo)

/**
 *  An extrinsic failed.
 */
export type SystemExtrinsicFailedEvent = [DispatchError, DispatchInfo]

export const SystemExtrinsicFailedEvent: sts.Type<SystemExtrinsicFailedEvent> = sts.tuple(() => DispatchError, DispatchInfo)
