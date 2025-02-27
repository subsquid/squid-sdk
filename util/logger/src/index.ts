import {LEVELS, LogLevel} from './level'
import {Logger, Sink} from './logger'
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
