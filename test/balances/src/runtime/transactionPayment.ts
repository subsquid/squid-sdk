import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9260 from './types/v9260'
import * as v9190 from './types/v9190'
import * as v9111 from './types/v9111'
import * as v2011 from './types/v2011'
import * as v2005 from './types/v2005'
import * as v1020 from './types/v1020'

export const events = {
    TransactionFeePaid: createEvent(
        'TransactionPayment.TransactionFeePaid',
        {
            v9260: v9260.TransactionPaymentTransactionFeePaidEvent,
        }
    ),
}

export const constants = {
    LengthToFee: createConstant(
        'TransactionPayment.LengthToFee',
        {
            v9190: v9190.TransactionPaymentLengthToFeeConstant,
        }
    ),
    OperationalFeeMultiplier: createConstant(
        'TransactionPayment.OperationalFeeMultiplier',
        {
            v9111: v9111.TransactionPaymentOperationalFeeMultiplierConstant,
        }
    ),
    TransactionBaseFee: createConstant(
        'TransactionPayment.TransactionBaseFee',
        {
            v1020: v1020.TransactionPaymentTransactionBaseFeeConstant,
        }
    ),
    TransactionByteFee: createConstant(
        'TransactionPayment.TransactionByteFee',
        {
            v1020: v1020.TransactionPaymentTransactionByteFeeConstant,
        }
    ),
    WeightToFee: createConstant(
        'TransactionPayment.WeightToFee',
        {
            v2005: v2005.TransactionPaymentWeightToFeeConstant,
        }
    ),
}

export const storage = {
    NextFeeMultiplier: createStorage(
        'TransactionPayment.NextFeeMultiplier',
        {
            v1020: v1020.TransactionPaymentNextFeeMultiplierStorage,
        }
    ),
    StorageVersion: createStorage(
        'TransactionPayment.StorageVersion',
        {
            v2011: v2011.TransactionPaymentStorageVersionStorage,
            v9111: v9111.TransactionPaymentStorageVersionStorage,
        }
    ),
}

export default {events, constants}
