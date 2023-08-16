import {OldTypes} from "../../types"
import {V0} from "./v0"
import {V1} from "./v1"
import {V2} from "./v2"


export const types: OldTypes['types'] = {
    ...V0,
    ...V1,
    ...V2,
    VersionedXcm: {
        _enum: {
            V0: 'XcmV0',
            V1: 'XcmV1',
            V2: 'XcmV2'
        }
    },
    XcmVersion: 'u32',
    VersionedMultiLocation: {
        _enum: {
            V0: 'MultiLocationV0',
            V1: 'MultiLocationV1',
        }
    },
    VersionedResponse: {
        _enum: {
            V0: 'XcmResponseV0',
            V1: 'XcmResponseV1',
            V2: 'XcmResponseV2',
        }
    },
    VersionedMultiAsset: {
        _enum: {
            V0: 'MultiAssetV0',
            V1: 'MultiAssetV1',
        }
    },
    VersionedMultiAssets: {
        _enum: {
            V0: 'Vec<MultiAssetV0>',
            V1: 'MultiAssetsV1',
        }
    }
}
