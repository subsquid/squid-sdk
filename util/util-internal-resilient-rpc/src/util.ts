import {RpcError} from '@subsquid/rpc-client'


export function getTime(): bigint {
    return process.hrtime.bigint()
}


export function isRateLimitError(err: unknown): boolean {
    return err instanceof RpcError && /rate limit/i.test(err.message)
}
