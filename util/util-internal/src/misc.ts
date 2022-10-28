import assert from 'assert'
import * as process from 'process'


export function assertNotNull<T>(val: T | undefined | null, msg?: string): T {
    assert(val != null, msg)
    return val
}


export function unexpectedCase(val?: unknown): Error {
    return new Error(val ? `Unexpected case: ${val}` : `Unexpected case`)
}


export function last<T>(array: T[]): T {
    assert(array.length > 0)
    return array[array.length - 1]
}


export function maybeLast<T>(array: T[]): T | undefined {
    return array.length > 0 ? array[array.length - 1] : undefined
}


export function runProgram(main: () => Promise<void>, log?: (err: Error) => void): void {

    function onerror(err: unknown) {
        if (log) {
            log(ensureError(err))
        } else {
            console.error(err)
        }
        process.exit(1)
    }

    try {
        main().then(() => process.exit(0), onerror)
    } catch(e: unknown) {
        onerror(e)
    }
}


export class NonErrorThrow extends Error {
    constructor(public readonly value: unknown) {
        super('Non-error object was thrown')
    }
}


export function ensureError(val: unknown): Error {
    if (val instanceof Error) {
        return val
    } else {
        return new NonErrorThrow(val)
    }
}


export function wait(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}
