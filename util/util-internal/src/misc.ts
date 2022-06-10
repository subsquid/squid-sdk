import assert from "assert"


export function safeCall(f: () => void): void {
    try {
        f()
    } catch(e: any) {
        // TODO: log
    }
}


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
    main().then(
        () => {
            process.exit(0)
        },
        err => {
            if (log) {
                log(err)
            } else {
                console.error(err)
            }
            process.exit(1)
        }
    )
}
