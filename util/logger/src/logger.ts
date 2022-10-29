import {toJSON} from '@subsquid/util-internal-json'
import {LEVELS, LogLevel} from './level'


export interface LogRecord {
    time: number
    level: LogLevel
    ns: string
    msg?: string
    err?: Error
}


export type Sink = (rec: LogRecord) => void


export class Logger {
    constructor(
        private sink: Sink,
        private ns: string,
        private attributes?: object
    ) {
    }

    get level(): LogLevel {
        return LEVELS.get(this.ns)
    }

    child(attributes: object): Logger
    child(ns: string, attributes?: object): Logger
    child(nsOrAttributes: string | object, attributes?: object): Logger {
        let ns = this.ns
        if (typeof nsOrAttributes == 'string') {
            ns = ns ? `${ns}:${nsOrAttributes}` : nsOrAttributes
        } else {
            attributes = nsOrAttributes
        }
        if (this.attributes) {
            if (attributes) {
                attributes = {...this.attributes, ...attributes}
            } else {
                attributes = this.attributes
            }
        }
        return new Logger(this.sink, ns, attributes)
    }

    write(level: LogLevel, msg?: string): void
    write(level: LogLevel, attributes?: object, msg?: string): void
    write(level: LogLevel, attributes?: any, msg?: any) {
        if (attributes == null) return
        if (level < this.level) return
        if (typeof attributes == 'string') {
            msg = attributes
            attributes = null
        }
        if (attributes instanceof Error) {
            attributes = {err: attributes}
        } else if (attributes instanceof Map || attributes instanceof Set) {
            attributes = toJSON(attributes)
        }
        let rec: any = {
            level,
            time: Date.now(),
            ns: this.ns,
            msg
        }
        addAttributes(this.attributes, rec)
        addAttributes(attributes, rec)
        this.sink(rec)
    }

    trace(msg?: string): void
    trace(attributes?: object, msg?: string): void
    trace(attributes?: any, msg?: any): void {
        this.write(LogLevel.TRACE, attributes, msg)
    }

    debug(msg?: string): void
    debug(attributes?: object, msg?: string): void
    debug(attributes?: any, msg?: any): void {
        this.write(LogLevel.DEBUG, attributes, msg)
    }

    info(msg?: string): void
    info(attributes?: object, msg?: string): void
    info(attributes?: any, msg?: any): void {
        this.write(LogLevel.INFO, attributes, msg)
    }

    warn(msg?: string): void
    warn(attributes?: object, msg?: string): void
    warn(attributes?: any, msg?: any): void {
        this.write(LogLevel.WARN, attributes, msg)
    }

    error(msg?: string): void
    error(attributes?: object, msg?: string): void
    error(attributes?: any, msg?: any): void {
        this.write(LogLevel.ERROR, attributes, msg)
    }

    fatal(msg?: string | null): void
    fatal(attributes?: object | null, msg?: string): void
    fatal(attributes?: any, msg?: any): void {
        this.write(LogLevel.FATAL, attributes, msg)
    }

    isTrace(): boolean {
        return this.level <= LogLevel.TRACE
    }

    isDebug(): boolean {
        return this.level <= LogLevel.DEBUG
    }

    isInfo(): boolean {
        return this.level <= LogLevel.INFO
    }

    isWarn(): boolean {
        return this.level <= LogLevel.WARN
    }

    isError(): boolean {
        return this.level <= LogLevel.ERROR
    }

    isFatal(): boolean {
        return this.level <= LogLevel.FATAL
    }
}


function addAttributes(src: any, target: any) {
    for (let key in src) {
        let val = src[key]
        switch (key) {
            case 'time':
            case 'level':
            case 'ns':
            case 'msg':
                break
            default:
                target[key] = val
        }
    }
}

