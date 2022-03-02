import {OldTypesBundle} from "../types"


const TokenSymbol = {
    _enum: [
        'ASG',
        'BNC',
        'KUSD',
        'DOT',
        'KSM',
        'KAR',
        'ZLK',
        'PHA',
        'RMRK'
    ]
}


const xcmV0 = {
    MultiAsset: 'MultiAssetV0',
    Xcm: 'XcmV0',
    XcmOrder: 'XcmOrderV0',
    MultiLocation: 'MultiLocationV0',
    XcmError: 'XcmErrorV0',
    Response: 'ResponseV0'
}


const xcmV1 = {
    MultiAsset: 'MultiAssetV1',
    Xcm: 'XcmV1',
    XcmOrder: 'XcmOrderV1',
    MultiLocation: 'MultiLocationV1',
    XcmError: 'XcmErrorV1',
    Response: 'ResponseV1'
}


export const bundle: OldTypesBundle = {
    types: {},
    versions: [
        {
            minmax: [0, 901],
            types: {
                TokenSymbol,
                ...xcmV0
            }
        },
        {
            minmax: [902, null],
            types: {
                TokenSymbol,
                ...xcmV1
            }
        }
    ]
}
