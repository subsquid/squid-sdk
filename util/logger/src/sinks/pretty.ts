import {toHex} from "@subsquid/util-internal-hex"
import assert from "assert"
import {stderr as stderrColor} from "supports-color"
import {LogLevel} from "../level"
import {LogRecord} from "../logger"


export class Printer {
    private prefix?: Prefix
    private visited = new Set()
    private style?: {open: string, close: string}
    private seenRecursion = false

    constructor(private out: (line: string) => void, private hasColor: boolean) {}

    private line(s: string): void {
        if (s && this.hasColor && this.style) {
            s = this.style.open + s + this.style.close
        }
        if (this.prefix) {
            this.out(this.prefix.prepend(s))
        } else {
            this.out(s)
        }
    }

    private text(text: string): void {
        for (let line of text.split(/\r?\n/)) {
            this.line(line)
        }
    }

    private begin(prefix: string, width?: number): void {
        width = width == null ? prefix.length : width
        if (this.hasColor && this.style) {
            prefix = this.style.open + prefix + this.style.close
        }
        this.prefix = new Prefix(prefix, width, this.prefix)
    }

    private end(): void {
        assert(this.prefix != null)
        this.prefix = this.prefix.prev
    }

    private property(prefix: string, val: unknown): void {
        switch(typeof val) {
            case "symbol":
            case "string":
                this.begin(prefix)
                this.text(val.toString())
                this.end()
                break
            case "boolean":
            case "bigint":
            case "number":
                this.line(`${prefix} ${val}`)
                break
            case "object":
                if (val instanceof Uint8Array) {
                    this.line(`${prefix} ${toHex(val)}`)
                } else if (val instanceof Date) {
                    this.line(`${prefix} ${val}`)
                } else if (typeof (val as any)?.toJSON == 'function') {
                    this.property(prefix, (val as any).toJSON())
                } else if (Array.isArray(val)) {
                    if (val.length == 0) {
                        this.line(`${prefix} []`)
                    } else {
                        if (this.visited.has(val)) {
                            this.seenRecursion = true
                            return
                        } else {
                            this.visited.add(val)
                        }
                        this.line(prefix)
                        for (let item of val) {
                            this.property('  -', item)
                        }
                        this.visited.delete(val)
                    }
                } else if (val == null) {
                    this.line(`${prefix} null`)
                } else {
                    if (this.visited.has(val)) {
                        this.seenRecursion = true
                        return
                    } else {
                        this.visited.add(val)
                    }
                    let has = false
                    for (let key in val) {
                        if (!has) {
                            this.line(prefix)
                            this.begin(' ')
                        }
                        has = true
                        this.property(key + ':', (val as any)[key])
                    }
                    if (has) {
                        this.end()
                    }
                    this.visited.delete(val)
                }
                break
        }
    }

    print(rec: LogRecord) {
        this.begin(formatHead(rec, this.hasColor), 14 + (rec.ns ? rec.ns.length + 1 : 0))
        if (rec.msg) {
            this.text(rec.msg)
        }
        this.style = {open: '\u001b[2m', close: '\u001b[22m'} // dim
        if (rec.err instanceof Error) {
            this.text(rec.err.stack || rec.err.toString())
        }
        for (let key in rec) {
            switch(key) {
                case 'time':
                case 'ns':
                case 'level':
                case 'msg':
                    break
                default:
                    this.property(key + ':', (rec as any)[key])
            }
        }
        this.end()
        if (this.seenRecursion) {
            this.reset()
            this.print({
                ns: 'sys',
                time: Date.now(),
                level: LogLevel.ERROR,
                msg: 'Previous record contained recursive data.\n' +
                    'Serialisation of such records is not supported in production.'
            })
        }
    }

    reset(): void {
        this.visited.clear()
        this.prefix = undefined
        this.style = undefined
        this.seenRecursion = false
    }
}


function formatHead(rec: LogRecord, withColor?: boolean): string {
    let time = formatTime(rec.time)
    let level = LogLevel[rec.level].padEnd(5, ' ')
    let ns = rec.ns
    if (withColor) {
        level = `\u001b[1m\u001b[${getLevelColor(rec.level)}m${level}\u001b[0m`
        ns = `\u001b[1m\u001b[34m${ns}\u001b[0m`
    }
    let head = time + ' ' + level
    if (rec.ns) {
        head += ' ' + ns
    }
    return head
}


function getLevelColor(level: LogLevel): number {
    switch(level) {
        case LogLevel.TRACE:
            return 35
        case LogLevel.DEBUG:
            return 32
        case LogLevel.INFO:
            return 36
        case LogLevel.WARN:
            return 33
        case LogLevel.ERROR:
        case LogLevel.FATAL:
            return 31
        default:
            return 0
    }
}


function formatTime(time: number): string {
    let date = new Date(time)
    let hour = date.getHours().toString().padStart(2, '0')
    let minutes = date.getMinutes().toString().padStart(2, '0')
    let seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hour}:${minutes}:${seconds}`
}


class Prefix {
    private indent = ''
    public readonly offset: number

    constructor(
        private value: string,
        width: number,
        readonly prev?: Prefix
    ) {
        this.offset = (this.prev?.offset || 0) + width + 1
    }

    prepend(s: string): string {
        if (this.value) {
            let val = this.value
            if (this.prev) {
                val = this.prev.prepend(val)
            }
            this.value = ''
            return s ? val + ' ' + s : val
        } else if (s) {
            this.indent = this.indent || ''.padEnd(this.offset, ' ')
            return this.indent + s
        } else {
            return s
        }
    }
}


const PRINTER = new Printer(line => {
    process.stderr.write(line + '\n')
}, !!stderrColor)


export function prettyStderrSink(rec: LogRecord): void {
    try {
        PRINTER.print(rec)
    } catch(e: any) {
        PRINTER.reset()
        PRINTER.print({
            ns: 'sys',
            level: LogLevel.ERROR,
            time: Date.now(),
            msg: e.stack || e.toString()
        })
    } finally {
        PRINTER.reset()
    }
}
