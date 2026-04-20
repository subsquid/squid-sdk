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
        ;(ser as any)[key] = err[key]
    }
    return ser
}


export class RemoteError extends Error {
    #name: string
    #stack: string | undefined

    constructor(origin: SerializedError) {
        super(origin.message)
        this.#name = origin.name
        this.#stack = origin.stack

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
