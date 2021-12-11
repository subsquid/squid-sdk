import type {OldTypes} from "../../types"
import {ScaleInfoTypes} from "./base"
import {V10} from "./v10"
import {V11} from "./v11"
import {V12} from "./v12"
import {V13} from "./v13"
import {V14} from "./v14"
import {V9} from "./v9"


export const types: OldTypes['types'] = {
    Type: 'Str',
    ...ScaleInfoTypes,
    ...V9,
    ...V10,
    ...V11,
    ...V12,
    ...V13,
    ...V14,
    Metadata: {
        _enum: {
            V0: 'DoNotConstruct',
            V1: 'DoNotConstruct',
            V2: 'DoNotConstruct',
            V3: 'DoNotConstruct',
            V4: 'DoNotConstruct',
            V5: 'DoNotConstruct',
            V6: 'DoNotConstruct',
            V7: 'DoNotConstruct',
            V8: 'DoNotConstruct',
            // First version on Kusama is V9, dropping will be problematic
            V9: 'MetadataV9',
            V10: 'MetadataV10',
            V11: 'MetadataV11',
            V12: 'MetadataV12',
            V13: 'MetadataV13',
            V14: 'MetadataV14'
        }
    }
}
