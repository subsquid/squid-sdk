import {sts, Result, Option, Bytes} from '../../pallet.support'

export type ValidatorPrefs = {
    commission: number,
    blocked: boolean,
}

export const ValidatorPrefs: sts.Type<ValidatorPrefs> = sts.struct(() => {
    return  {
        commission: sts.number(),
        blocked: sts.boolean(),
    }
})

export type AccountId32 = Bytes

export const AccountId32: sts.Type<AccountId32> = sts.bytes()
