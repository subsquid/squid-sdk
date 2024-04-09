import {toHex} from "@subsquid/util-internal-hex"


export function toJSON(val: unknown): any {
    let json: any
    switch(typeof val) {
        case 'bigint':
            return val.toString()
        case 'object':
            if (val == null) return null
            if (val instanceof Uint8Array) {
                return toHex(val)
            } else if (val instanceof Date) {
                return val.toISOString()
            } else if (typeof (val as any).toJSON == 'function' && (json = (val as any).toJSON()) !== val) {
                return toJSON(json)
            } else if (val instanceof Error) {
                json = {}
                if (val.stack) {
                    json.stack = val.stack
                } else {
                    json.stack = val.toString()
                }
                json = toJsonObject(val, json)
                return json
            } else if (val instanceof Map) {
                let entries: {k: unknown, v: unknown}[] = []
                for (let [k, v] of val.entries()) {
                    entries.push({k, v})
                }
                return toJSON({map: entries})
            } else if (val instanceof Set) {
                return toJSON({set: [...val]})
            } else if (Array.isArray(val)) {
                return toJsonArray(val)
            }  else {
                return toJsonObject(val)
            }
        default:
            return val
    }
}


function toJsonArray(val: unknown[]): any[] {
    let arr = new Array(val.length)
    for (let i = 0; i < val.length; i++) {
        arr[i] = toJSON(val[i])
    }
    return arr
}


function toJsonObject(val: any, result?: any): any {
    result = result || {}
    for (let key in val) {
        result[key] = toJSON(val[key])
    }
    return result
}
