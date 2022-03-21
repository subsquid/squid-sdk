import { OldTypesBundle } from "../types"

const sharedTypes = {
    TAssetBalance: 'u128',
    ProxyType: {
        _enum: [
            'Any',
            'NonTransfer',
            'CancelProxy',
            'Assets',
            'AssetOwner',
            'AssetManager',
            'Staking'
        ]
    }
};

// these are override types for Statemine, Statemint, Westmint
export const bundle: OldTypesBundle = {
    types: {},
    versions: [
        {
            minmax: [0, 3],
            types: {
                ...sharedTypes,
                AssetInstance: "AssetInstanceV0",
                Fungibility: "FungibilityV0",
                Junction: "JunctionV0",
                Junctions: "JunctionsV0",
                MultiAsset: "MultiAssetV0",
                MultiAssetFilter: "MultiAssetFilterV0",
                MultiLocation: "MultiLocationV0",
                Response: "ResponseV0",
                WildFungibility: "WildFungibilityV0",
                WildMultiAsset: "WildMultiAssetV0",
                Xcm: "XcmV0",
                XcmError: "XcmErrorV0",
                XcmOrder: "XcmOrderV0"
            }
        },
        {
            minmax: [4, 5],
            types: {
                ...sharedTypes,
                AssetInstance: "AssetInstanceV1",
                Fungibility: "FungibilityV1",
                Junction: "JunctionV1",
                Junctions: "JunctionsV1",
                MultiAsset: "MultiAssetV1",
                MultiAssetFilter: "MultiAssetFilterV1",
                MultiLocation: "MultiLocationV1",
                Response: "ResponseV1",
                WildFungibility: "WildFungibilityV1",
                WildMultiAsset: "WildMultiAssetV1",
                Xcm: "XcmV1",
                XcmError: "XcmErrorV1",
                XcmOrder: "XcmOrderV1"
            }
        },
        {
            // metadata V14
            minmax: [500, null],
            types: {}
        }
    ]
}