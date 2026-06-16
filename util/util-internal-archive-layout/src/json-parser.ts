import {JSONParser} from '@streamparser/json'

export function parseJsonBytes(buf: Buffer): unknown {
    let result: unknown
    let gotResult = false
    let parser = new JSONParser({paths: ['$']})
    parser.onValue = ({value}) => {
        result = value
        gotResult = true
    }
    try {
        parser.write(buf)
    } catch (e: unknown) {
        throw new SyntaxError(e instanceof Error ? e.message : String(e))
    }
    try {
        parser.end()
    } catch (_e: unknown) {
        // end() may throw even after successful parse when paths:['$'] is used;
        // only propagate if we haven't received a value
        if (!gotResult) {
            let e = _e as Error
            throw new SyntaxError(e.message)
        }
    }
    if (!gotResult) {
        throw new SyntaxError('No JSON value found in input')
    }
    return result
}
