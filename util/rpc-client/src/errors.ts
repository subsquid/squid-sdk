import {RpcErrorInfo} from './interfaces'


/**
 * Server violated RPC protocol
 */
export class RpcProtocolError extends Error {
    constructor(public readonly code: number, msg?: string) {
        super(msg)
    }

    get name(): string {
        return 'RpcProtocolError'
    }
}


/**
 * Received error message from the server
 */
export class RpcError extends Error {
    public readonly code: number
    public readonly data?: any

    constructor(info: RpcErrorInfo) {
        super(info.message)
        this.code = info.code
        this.data = info.data
    }

    get name(): string {
        return 'RpcError'
    }
}

/**
 * Transport problem
 */
export class RpcConnectionError extends Error {
    get name(): string {
        return 'RpcConnectionError'
    }
}
