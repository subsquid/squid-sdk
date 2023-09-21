import {sts} from '../../pallet.support'
import {Perbill, AccountId} from './types'

/**
 *  Kill the sending account, assuming there are no references outstanding and the composite
 *  data is equal to its default value.
 */
export type SystemSuicideCall = null

export const SystemSuicideCall: sts.Type<SystemSuicideCall> = sts.unit()

/**
 *  A dispatch that will fill the block weight up to the given ratio.
 */
export type SystemFillBlockCall = {
    _ratio: Perbill,
}

export const SystemFillBlockCall: sts.Type<SystemFillBlockCall> = sts.struct(() => {
    return  {
        _ratio: Perbill,
    }
})

/**
 *  A new account was created.
 */
export type SystemNewAccountEvent = [AccountId]

export const SystemNewAccountEvent: sts.Type<SystemNewAccountEvent> = sts.tuple(() => AccountId)

/**
 *  An account was reaped.
 */
export type SystemKilledAccountEvent = [AccountId]

export const SystemKilledAccountEvent: sts.Type<SystemKilledAccountEvent> = sts.tuple(() => AccountId)
