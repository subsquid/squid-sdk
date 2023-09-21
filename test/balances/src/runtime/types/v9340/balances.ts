import {sts} from '../../pallet.support'

/**
 *  The total units of outstanding deactivated balance in the system.
 */
export type BalancesInactiveIssuanceStorage = [null, bigint]

export const BalancesInactiveIssuanceStorage: sts.Type<BalancesInactiveIssuanceStorage> = sts.tuple([sts.unit(), sts.bigint()])
