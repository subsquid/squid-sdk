
export function addTimeout<T>(
    promise: Promise<T>,
    ms: number,
    createTimeoutError?: () => Error
): Promise<T> {
    if (ms == 0) return promise

    return new Promise((resolve, reject) => {
        let timer: any = setTimeout(() => {
            timer = null
            let err = createTimeoutError ? createTimeoutError() : new TimeoutError(ms)
            reject(err)
        }, ms)

        promise.finally(() => {
            if (timer != null) {
                clearTimeout(timer)
            }
        }).then(resolve, reject)
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
