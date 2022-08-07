import {unexpectedCase} from "@subsquid/util-internal"
import {FieldRequest} from "./ir/fields"


export function getSize(fields: FieldRequest[]): number {
    let total = 0
    for (let req of fields) {
        let size = getFieldSize(req)
        if (Number.isFinite(size)) {
            total += size * req.aliases.length
        } else {
            return Infinity
        }
    }
    return total
}


function getFieldSize(req: FieldRequest): number {
    switch(req.kind) {
        case "scalar":
        case "list":
            return req.prop.byteWeight || 1
        case "enum":
            return 1
        case "object":
        case "fk":
        case "lookup":
        case "union":
            return getSize(req.children) + 1
        case "list-lookup": {
            let limit = Math.min(req.args?.limit ?? Infinity, req.prop.cardinality ?? Infinity)
            if (Number.isFinite(limit)) {
                return limit * Math.max(getSize(req.children), 1)
            } else {
                return Infinity
            }
        }
        default:
            throw unexpectedCase()
    }
}




