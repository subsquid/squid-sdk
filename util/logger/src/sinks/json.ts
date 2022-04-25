import {LogLevel} from "../level"
import {LogRecord} from "../logger"


export function jsonLinesStderrSink(rec: LogRecord): void {
    process.stderr.write(stringify(rec) + '\n')
}


function stringify(rec: LogRecord): string {
    try {
        return JSON.stringify(toJSON(rec))
    } catch(e: any) {
        return stringify({
            ns: 'sys',
            time: Date.now(),
            level: LogLevel.ERROR,
            msg: `Failed to serialize log record from ${rec.ns}`,
            err: e
        })
    }
}


function toJSON(val: unknown): any {
    switch(typeof val) {
        case 'bigint':
            return val.toString()
        case 'object':
            if (val instanceof Uint8Array) {
                return toHex(val)
            } else if (val instanceof Date) {
                return val.toISOString()
            } else if (typeof (val as any)?.toJSON == 'function') {
                return toJSON((val as any).toJSON())
            } else if (val instanceof Error) {
                let props = toJsonObject(val)
                if (val.stack) {
                    props.stack = val.stack
                } else {
                    props.stack = val.toString()
                }
                return props
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


function toJsonObject(val: any): any {
    let result: any = {}
    for (let key in val) {
        result[key] = toJSON(val[key])
    }
    return result
}


export function toHex(data: Uint8Array): string {
    if (Buffer.isBuffer(data)) {
        return '0x' + data.toString('hex')
    } else {
        return '0x' + Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('hex')
    }
}
