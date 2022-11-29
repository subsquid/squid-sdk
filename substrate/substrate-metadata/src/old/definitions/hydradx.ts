import { OldTypesBundle } from "../types";

export const bundle: OldTypesBundle = {
    types: {
        AssetPair: {
            asset_in: "AssetId",
            asset_out: "AssetId",
        },
        Amount: "i128",
        AmountOf: "Amount",
        Address: "AccountId",
        OrmlAccountData: {
            free: "Balance",
            frozen: "Balance",
            reserved: "Balance",
        },
        Fee: {
            numerator: "u32",
            denominator: "u32",
        },
        BalanceInfo: {
            amount: "Balance",
            assetId: "AssetId",
        },
        Currency: "AssetId",
        CurrencyId: "AssetId",
        CurrencyIdOf: "AssetId",
        Intention: {
            who: "AccountId",
            asset_sell: "AssetId",
            asset_buy: "AssetId",
            amount: "Balance",
            discount: "bool",
            sell_or_buy: "IntentionType",
        },
        IntentionId: "u128",
        IntentionType: {
            _enum: [
                "SELL",
                "BUY"
            ],
        },
        LookupSource: "AccountId",
        OrderedSet: "Vec<AssetId>",
        Price: "Balance",
        Chain: {
            genesisHash: "Vec<u8>",
            lastBlockHash: "Vec<u8>",
        },
    },
    typesAlias: {
        tokens: {
            AccountData: "OrmlAccountData",
        },
    },
    signedExtensions: {
        ValidateClaim: 'Null'
    }
}
