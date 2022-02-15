import assert from "assert"


export interface Abort {
    readonly isAborted: boolean
    assertNotAborted(): void
    addListener(f: (err: Error) => void): void
    removeListener(f: (err: Error) => void): void
    guard<T>(promise: Promise<T>): Promise<T>
}


export class AbortHandle implements Abort {
    private abortError: Error | undefined
    private listeners: ((err: Error) => void)[] = []

    get isAborted(): boolean {
        return this.abortError != null
    }

    assertNotAborted(): void {
        if (this.abortError) throw this.abortError
    }

    abort(err?: Error): void {
        if (this.abortError) return
        this.abortError = err || new AbortError()
        for (let i = 0; i < this.listeners.length; i++) {
            safeCall(() => this.listeners[i](this.abortError!))
        }
        this.listeners.length = 0
    }

    close(): void {
        this.abort()
    }

    addListener(f: (err: Error) => void): void {
        assert(!this.isAborted)
        this.listeners.push(f)
    }

    removeListener(f: (err: Error) => void): void {
        let idx = this.listeners.indexOf(f)
        if (idx >= 0) {
            this.listeners.splice(idx, 1)
        }
    }

    guard<T>(promise: Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.abortError) {
                promise.catch(() => null)
                reject(this.abortError)
                return
            }
            this.addListener(reject)
            promise.then(
                result => {
                    this.removeListener(reject)
                    resolve(result)
                },
                err => {
                    this.removeListener(reject)
                    reject(err)
                }
            )
        })
    }
}


export class AbortError extends Error {
    constructor() {
        super('Aborted')
    }
}


export function wait(ms: number, abort?: Abort): Promise<void> {
    return new Promise((resolve, reject) => {
        abort?.assertNotAborted()

        let timeout = setTimeout(() => {
            abort?.removeListener(onabort)
            resolve()
        }, ms)

        function onabort(err: Error): void {
            clearTimeout(timeout)
            reject(err)
        }

        abort?.addListener(onabort)
    })
}


function safeCall(f: () => void): void {
    try {
        f()
    } catch(e: any) {
        // TODO: log
    }
}
