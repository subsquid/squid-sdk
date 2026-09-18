export interface SerializedError {
    name: string
    message: string
    stack: string | undefined
}


export function serializeError(err: Error): SerializedError {
    let ser: SerializedError = {
        name: err.name,
        message: err.message,
        stack: err.stack
    }
    let key: keyof Error
    for (key in err) {
        ;(ser as any)[key] = toTransferable(err[key])
    }
    return ser
}


/**
 * Project an error's custom property into a value that survives
 * `MessagePort.postMessage`'s structured clone algorithm.
 *
 * Some errors carry non-cloneable payloads — e.g. `@subsquid/http-client`'s
 * `HttpError` holds a `response` whose `headers` is a `Headers` instance, and
 * `Headers` (like sockets and streams) cannot be structured-cloned. Left as-is,
 * a single transient upstream error (a 429, a 5xx) thrown out of a worker-thread
 * stream would make `Server.send` throw a `DataCloneError`, collapsing into an
 * opaque "unserializable error" that crashes the stream instead of being
 * delivered to the host as a proper, retryable error. We flatten such values via
 * a JSON projection (which honours any `toJSON()`, so diagnostic context like the
 * HTTP status/url/body is preserved) and drop anything that still can't travel.
 */
function toTransferable(value: unknown): unknown {
    switch (typeof value) {
        case 'function':
        case 'symbol':
            return undefined
        case 'object':
            if (value === null) return value
            try {
                return structuredClone(value)
            } catch {
                try {
                    return JSON.parse(JSON.stringify(value))
                } catch {
                    return String(value)
                }
            }
        default:
            return value
    }
}


export class RemoteError extends Error {
    #name: string
    #stack: string | undefined

    constructor(origin: SerializedError) {
        super(origin.message)
        this.#name = origin.name
        this.#stack = origin.stack

        // Remove own `stack` accessor installed by Error() so the
        // prototype getter can return the worker-thread stack.
        if (origin.stack) {
            delete (this as any).stack
        }

        let key: keyof SerializedError
        for (key in origin) {
            switch(key) {
                case 'stack':
                case 'message':
                case 'name':
                    break
                default:
                    this[key] = origin[key]
            }
        }
    }

    get name(): string {
        return this.#name
    }

    get stack(): string | undefined {
        return this.#stack
    }
}
