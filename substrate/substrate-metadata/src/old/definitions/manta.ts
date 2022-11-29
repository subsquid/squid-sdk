import { OldTypesBundle } from "../types";

export const bundle: OldTypesBundle = {
    types: {
        CurrencyId: {
            _enum: [
                'MA'
            ]
        },
        CurrencyIdOf: 'CurrencyId',
        Amount: 'i128',
        AmountOf: 'Amount',
        AccountInfo: 'AccountInfoWithDualRefCount'
    }
}