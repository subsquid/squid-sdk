export function writeJson(value: unknown, write: (s: string) => void): void {
    switch (typeof value) {
        case 'string':
            write(JSON.stringify(value))
            return
        case 'number':
            write(Number.isFinite(value) ? JSON.stringify(value) : 'null')
            return
        case 'boolean':
            write(value ? 'true' : 'false')
            return
        case 'object': {
            if (value === null) {
                write('null')
                return
            }
            if (typeof (value as {toJSON?: unknown}).toJSON === 'function') {
                writeJson((value as {toJSON(): unknown}).toJSON(), write)
                return
            }
            if (Array.isArray(value)) {
                write('[')
                for (let i = 0; i < value.length; i++) {
                    if (i > 0) write(',')
                    let item = value[i]
                    if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
                        write('null')
                    } else {
                        writeJson(item, write)
                    }
                }
                write(']')
                return
            }
            write('{')
            let first = true
            for (let key in value as object) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    let v = (value as Record<string, unknown>)[key]
                    if (v === undefined || typeof v === 'function') continue
                    if (!first) write(',')
                    write(JSON.stringify(key))
                    write(':')
                    writeJson(v, write)
                    first = false
                }
            }
            write('}')
            return
        }
        default:
            write('null')
    }
}
