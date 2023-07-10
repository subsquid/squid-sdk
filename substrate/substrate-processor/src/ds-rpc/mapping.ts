import * as base from '@subsquid/substrate-data'
import {RangeRequest} from '@subsquid/util-internal-processor-tools'
import {DataRequest} from '../interfaces/data-request'


export function toBaseRangeRequest(req: RangeRequest<DataRequest>): RangeRequest<base.DataRequest> {
    return {
        range: req.range,
        request: toBaseDataRequest(req.request)
    }
}


function toBaseDataRequest(req: DataRequest): base.DataRequest {
    let events = !!req.events?.length
        || req.fields?.extrinsic?.success
        || req.fields?.call?.success

    let extrinsics = !!req.calls?.length
        || req.events?.some(e => e.extrinsic || e.call || e.stack)
        || req.fields?.block?.timestamp

    return {
        events,
        extrinsics,
        extrinsicHash: req.fields?.extrinsic?.hash,
        validator: req.fields?.block?.validator
    }
}
