import {toHex} from "@subsquid/util-internal-hex"
import {toJSON} from '@subsquid/util-internal-json'
import assert from "assert"
import {stderr as stderrColor} from "supports-color"
import {LogLevel} from "../level"
import {LogRecord} from "../logger"


export class Printer {
    private prefix?: Prefix
    private color?: string

    constructor(private out: (line: string) => void, private hasColor: boolean) {}

    private applyColor(s: string): string {
        if (this.hasColor && this.color && s) {
            return `\u001b[${this.color}m${s}\u001b[0m`
        } else {
            return s
        }
    }

    private style(style: string, s: string): string {
        if (this.hasColor && style && s) {
            s = style + s + '\u001b[0m'
            if (this.color) {
                s = `\u001b[0m` + s + `\u001b[${this.color}m`
            }
        }
        return s
    }

    private line(s: string): void {
        s = this.applyColor(s)
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
        this.prefix = new Prefix(
            this.applyColor(prefix),
            width,
            this.prefix
        )
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
                } else if (val == null) {
                    this.line(`${prefix} null`)
                } else {
                    let text
                    try {
                        text = JSON.stringify(toJSON(val))
                    } catch(e: any) {
                        text = this.style('\u001b[31m', `failed to serialize logged value: ${e}`)
                    }
                    this.line(`${prefix} ${text}`)
                }
                break
        }
    }

    print(rec: LogRecord) {
        this.begin(this.formatHead(rec), 14 + (rec.ns ? rec.ns.length + 1 : 0))
        if (rec.msg) {
            this.text(rec.msg)
        }
        this.color = '2' // dim
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
                    if (key == 'err' && rec.err instanceof Error) {
                        // already printed the stack trace above
                        // print only the rest of props and indented like the stack trace
                        for (let k in rec.err) {
                            this.property(`    ${k}:`, (rec.err as any)[k])
                        }
                    } else {
                        this.property(key + ':', (rec as any)[key])
                    }
            }
        }
        this.end()
    }

    private formatHead(rec: LogRecord): string {
        let time = formatTime(rec.time)
        let level = LogLevel[rec.level].padEnd(5, ' ')
        let ns = rec.ns
        if (this.hasColor) {
            level = `\u001b[1m\u001b[${getLevelColor(rec.level)}m${level}\u001b[0m`
            ns = `\u001b[1m\u001b[34m${ns}\u001b[0m`
        }
        let head = time + ' ' + level
        if (rec.ns) {
            head += ' ' + ns
        }
        return head
    }

    reset(): void {
        this.prefix = undefined
        this.color = undefined
    }
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
