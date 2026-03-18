import {LEVELS, LogLevel} from './level'
import {Logger, LogRecord, Sink} from './logger'
import {jsonLinesStderrSink} from './sinks/json'
import {prettyStderrSink} from './sinks/pretty'


export {LogLevel} from "./level"
export * from "./logger"


/**
 * Override the default log level determination logic.
 *
 * Log levels are cached.
 * Call it at the very beginning of the app for it to be effective.
 *
 * Return `undefined` from the `cb` to fall back to the standard logic.
 */
export function setLogLevelCallback(cb?: (ns: string) => LogLevel | undefined): void {
    LEVELS.setLevelCallback(cb)
}


const prettyEnabled = process.env.FORCE_PRETTY_LOGGER ?
    process.env.FORCE_PRETTY_LOGGER !== '0' :
    process.stderr.isTTY


let ROOT_SINK = prettyEnabled ? prettyStderrSink : jsonLinesStderrSink


/**
 * Use custom log sink
 */
export function setRootSink(sink: Sink): void {
    ROOT_SINK = sink
}


const ROOT = new Logger(
    rec => ROOT_SINK(rec),
    ''
)


export function createLogger(ns: string, attributes?: object): Logger {
    return ROOT.child(ns, attributes)
}

type PinoLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface PinoLikeLogger {
    trace(obj: unknown, msg?: string): void
    debug(obj: unknown, msg?: string): void
    info(obj: unknown, msg?: string): void
    warn(obj: unknown, msg?: string): void
    error(obj: unknown, msg?: string): void
    fatal(obj: unknown, msg?: string): void
}

/**
 * Creates Pino logger sink that can be later used in setRootSink
 */
export function createPinoSink(pinoLogger: PinoLikeLogger): Sink {
    const LEVEL_MAP: Record<LogLevel, PinoLevel> = {
        [LogLevel.TRACE]: 'trace',
        [LogLevel.DEBUG]: 'debug',
        [LogLevel.INFO]: 'info',
        [LogLevel.WARN]: 'warn',
        [LogLevel.ERROR]: 'error',
        [LogLevel.FATAL]: 'fatal',
    }

    return (rec: LogRecord) => {
        const { level, ns, msg, err, ...rest } = rec
        const method: PinoLevel = LEVEL_MAP[level] ?? 'info'

        const errorFields =
            err != null
                ? { err: { name: err.name, message: err.message, stack: err.stack } }
                : {}

        pinoLogger[method]({ ns, ...errorFields, ...rest }, msg)
    }
}
