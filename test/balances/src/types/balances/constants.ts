import {sts, Block, Bytes, Option, Result, ConstantType, constant, RuntimeCtx} from '../support'
import * as v1020 from '../v1020'

export const existentialDeposit = constant('Balances.ExistentialDeposit', {
    /**
     *  The minimum amount required to keep an account open.
     */
    v1020: new ConstantType(
        'Balances.ExistentialDeposit',
        v1020.Balance
    ),
})

export const transferFee = constant('Balances.TransferFee', {
    /**
     *  The fee required to make a transfer.
     */
    v1020: new ConstantType(
        'Balances.TransferFee',
        v1020.Balance
    ),
})

export const creationFee = constant('Balances.CreationFee', {
    /**
     *  The fee required to create an account.
     */
    v1020: new ConstantType(
        'Balances.CreationFee',
        v1020.Balance
    ),
})

export const maxLocks = constant('Balances.MaxLocks', {
    /**
     *  The maximum number of locks that should exist on an account.
     *  Not strictly enforced, but used for weight estimation.
     */
    v9090: new ConstantType(
        'Balances.MaxLocks',
        sts.number()
    ),
})

export const maxReserves = constant('Balances.MaxReserves', {
    /**
     *  The maximum number of named reserves that can exist on an account.
     */
    v9090: new ConstantType(
        'Balances.MaxReserves',
        sts.number()
    ),
})

export const maxHolds = constant('Balances.MaxHolds', {
    /**
     *  The maximum number of holds that can exist on an account at any time.
     */
    v9420: new ConstantType(
        'Balances.MaxHolds',
        sts.number()
    ),
})

export const maxFreezes = constant('Balances.MaxFreezes', {
    /**
     *  The maximum number of individual freeze locks that can exist on an account at any time.
     */
    v9420: new ConstantType(
        'Balances.MaxFreezes',
        sts.number()
    ),
})
