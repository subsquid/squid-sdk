import {toJSON} from "@subsquid/util-internal-json"
import {LogLevel} from "../level"
import {LogRecord} from "../logger"


export function jsonLinesStderrSink(rec: LogRecord): void {
    process.stderr.write(stringify(rec) + '\n')
}


function stringify(rec: LogRecord): string {
    try {
        let json = toJSON(rec)
        json.severity = LogLevel[rec.level]
        return JSON.stringify(json)
    } catch(e: any) {
        return stringify({
            ns: 'sys',
            time: Date.now(),
            level: LogLevel.ERROR,
            msg: `Failed to serialize log record from ${rec.ns}`,
            err: {stack: e.stack || e.toString()} as Error
        })
    }
}
