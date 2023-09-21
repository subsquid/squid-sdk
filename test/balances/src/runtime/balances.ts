import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9130 from './types/v9130'
import * as v1050 from './types/v1050'
import * as v1020 from './types/v1020'

export const events = {
    Transfer: createEvent(
        'Balances.Transfer',
        {
            v1020: v1020.BalancesTransferEvent,
            v1050: v1050.BalancesTransferEvent,
            v9130: v9130.BalancesTransferEvent,
        }
    ),
}

export default {events}
