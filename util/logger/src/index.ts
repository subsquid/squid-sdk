import {Logger} from "./logger"
import {jsonLinesStderrSink} from "./sinks/json"
import {prettyStderrSink} from "./sinks/pretty"

export {LogLevel} from "./level"
export * from "./logger"


const ROOT = new Logger(
    process.stderr.isTTY ? prettyStderrSink : jsonLinesStderrSink,
    ''
)


export function createLogger(ns: string, attributes?: object): Logger {
    return ROOT.child(ns, attributes)
}
