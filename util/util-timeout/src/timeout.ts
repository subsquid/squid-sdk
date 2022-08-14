import assert from "assert"


export function addTimeout<T>(
    promise: Promise<T>,
    seconds: number,
    createTimeoutError?: () => Error
): Promise<T> {
    assert(seconds >= 0)
    let ms = Math.round(seconds * 1000)
    if (ms == 0) return promise

    return new Promise((resolve, reject) => {
        let timer: any = setTimeout(() => {
            timer = null
            let err = createTimeoutError ? createTimeoutError() : new Error('Timeout')
            reject(err)
        }, ms)

        promise.finally(() => {
            if (timer != null) {
                clearTimeout(timer)
            }
        }).then(resolve, reject)
    })
}
