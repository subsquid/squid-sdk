
export function addTimeout<T>(
    promise: Promise<T>,
    ms?: number,
    onTimeout?: () => Error | undefined | void
): Promise<T> {
    if (!ms) return promise

    return new Promise((resolve, reject) => {
        let timer = setTimeout(() => {
            let err = onTimeout?.() || new TimeoutError(ms)
            reject(err)
        }, ms)

        promise.finally(() => clearTimeout(timer)).then(resolve, reject)
    })
}


export class TimeoutError extends Error {
    constructor(ms: number) {
        super(`timed out after ${ms} ms`)
    }

    get name(): string {
        return 'TimeoutError'
    }
}
