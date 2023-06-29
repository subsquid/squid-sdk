import {Logger} from "./logger"
import {jsonLinesStderrSink} from "./sinks/json"
import {prettyStderrSink} from "./sinks/pretty"

export {LogLevel} from "./level"
export * from "./logger"

const prettyEnabled = process.env.FORCE_PRETTY_LOGGER ?
    process.env.FORCE_PRETTY_LOGGER !== '0' :
    process.stderr.isTTY


const ROOT = new Logger(
    prettyEnabled ? prettyStderrSink : jsonLinesStderrSink,
    ''
)


export function createLogger(ns: string, attributes?: object): Logger {
    return ROOT.child(ns, attributes)
}
