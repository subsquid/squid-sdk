import {OldTypesBundle} from "../types"


export const bundle: OldTypesBundle = {
    types: {
        ParachainAccountIdOf: "AccountId",
        Proof: {
            leafHash: "Hash",
            sortedHashes: "Vec<Hash>"
        },
        ProxyType: {
            _enum: [
                "Any",
                "NonTransfer",
                "Governance",
                "_Staking",
                "NonProxy"
            ]
        },
        RelayChainAccountId: "AccountId",
        RootHashOf: "Hash"
    }
}
