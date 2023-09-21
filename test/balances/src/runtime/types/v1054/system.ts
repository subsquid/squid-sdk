import {sts} from '../../pallet.support'
import {AccountId} from './types'

export type SystemMigrateAccountsCall = {
    accounts: AccountId[],
}

export const SystemMigrateAccountsCall: sts.Type<SystemMigrateAccountsCall> = sts.struct(() => {
    return  {
        accounts: sts.array(() => AccountId),
    }
})
