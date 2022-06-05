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
    }
}
