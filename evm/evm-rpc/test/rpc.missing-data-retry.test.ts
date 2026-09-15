import { describe, it, expect } from 'vitest'
import { RetryError } from '@subsquid/rpc-client'
import { Rpc } from '../src/rpc'

// Real error captured from a binance-mainnet dump crash-loop: the eRPC proxy
// routed eth_getBlockByNumber to an upstream that lacked an already-finalized
// block (116705561 << finalizedBlock) and returned -32014 / ErrEndpointMissingData.
const ERPC_MISSING_DATA = {
    code: -32014,
    message: 'block not found with number 0x6f4c919',
    data: {
        code: 'ErrEndpointMissingData',
        message: 'remote endpoint does not have this data',
        details: {
            upstreamId: 'binance-mainnet-uniblock',
            latestBlock: 116721620,
            finalizedBlock: 116721619,
            maxAvailableRecentBlocks: 0,
        },
    },
}

// Minimal client that routes an error response through validateError, exactly
// like RpcClient.receiveResult, so the real classification path is exercised.
class ErrorRpcClient {
    url = 'mock://erpc'
    getConcurrency() {
        return 1
    }
    isConnectionError(err: any) {
        return err instanceof RetryError
    }
    async call(): Promise<any> {
        throw new Error('not used in this test')
    }
    async batchCall(batch: { method: string; params?: any[] }[], options?: any): Promise<any[]> {
        // The server responded with an error for every call in the batch.
        return batch.map(() => options.validateError(ERPC_MISSING_DATA))
    }
}

describe('evm-rpc: transient eRPC "endpoint missing data" is retryable', () => {
    it('getBlockBatch retries instead of crashing on ErrEndpointMissingData', async () => {
        const rpc = new Rpc({ client: new ErrorRpcClient() as any })
        // A finalized block that momentarily missing on one upstream must be
        // retried (RetryError), not surfaced as a fatal RpcError that crash-loops the dump.
        await expect(rpc.getBlockBatch([116705561], { transactions: true })).rejects.toBeInstanceOf(
            RetryError
        )
    })
})
