import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    TransactionFeePaid: createEvent(
        'TransactionPayment.TransactionFeePaid',
        {
            v9260: TransactionPaymentTransactionFeePaidEvent,
        }
    ),
}

export const constants = {
    LengthToFee: createConstant(
        'TransactionPayment.LengthToFee',
        {
            v9190: TransactionPaymentLengthToFeeConstant,
        }
    ),
    OperationalFeeMultiplier: createConstant(
        'TransactionPayment.OperationalFeeMultiplier',
        {
            v9111: TransactionPaymentOperationalFeeMultiplierConstant,
        }
    ),
    TransactionBaseFee: createConstant(
        'TransactionPayment.TransactionBaseFee',
        {
            v1020: TransactionPaymentTransactionBaseFeeConstant,
        }
    ),
    TransactionByteFee: createConstant(
        'TransactionPayment.TransactionByteFee',
        {
            v1020: TransactionPaymentTransactionByteFeeConstant,
        }
    ),
    WeightToFee: createConstant(
        'TransactionPayment.WeightToFee',
        {
            v2005: TransactionPaymentWeightToFeeConstant,
        }
    ),
}

export const storage = {
    NextFeeMultiplier: createStorage(
        'TransactionPayment.NextFeeMultiplier',
        {
            v1020: TransactionPaymentNextFeeMultiplierStorage,
        }
    ),
    StorageVersion: createStorage(
        'TransactionPayment.StorageVersion',
        {
            v2011: TransactionPaymentStorageVersionStorage,
            v9111: TransactionPaymentStorageVersionStorage,
        }
    ),
}

export default {events, constants}
