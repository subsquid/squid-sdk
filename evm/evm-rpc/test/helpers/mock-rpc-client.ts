import { RpcError } from '@subsquid/rpc-client'


export class MockRpcClient {
    private fixtures: Map<string, any>
    private errors: Map<string, Error> = new Map()

    constructor(fixtures: Map<string, any> = new Map()) {
        this.fixtures = fixtures
    }

    getConcurrency(): number {
        return 1
    }

    isConnectionError(): boolean {
        return false
    }

    async call<T = any>(method: string, params?: any[]): Promise<T> {
        const key = this.makeKey(method, params)

        if (this.errors.has(key)) {
            throw this.errors.get(key)
        }

        if (this.fixtures.has(key)) {
            return this.fixtures.get(key)
        }

        // Try without params
        if (this.errors.has(method)) {
            throw this.errors.get(method)
        }
        if (this.fixtures.has(method)) {
            return this.fixtures.get(method)
        }

        throw new Error(`No fixture found for method: ${method} with params: ${JSON.stringify(params)}`)
    }

    async batchCall(
        batch: {method: string, params?: any[]}[],
        options?: {validateResult?: (result: any) => any, validateError?: (info: any) => any}
    ): Promise<any[]> {
        const results = []
        for (const req of batch) {
            let response: any
            try {
                response = await this.call(req.method, req.params)
            } catch (error: any) {
                // Surface configured RPC errors the way the real client does: an
                // error for an individual batch item is routed through
                // validateError so callers can recognize and handle it (e.g. the
                // "response is too big" fallback). Other transport-level errors
                // (such as a missing fixture) are recorded inline.
                if (error instanceof RpcError) {
                    if (options?.validateError) {
                        results.push(options.validateError({code: error.code, message: error.message, data: error.data}))
                    } else {
                        throw error
                    }
                } else {
                    results.push({error: error.message})
                }
                continue
            }
            // A validation error here propagates (rejecting the batch), mirroring
            // the real client's receiveResult behavior.
            results.push(options?.validateResult ? options.validateResult(response) : response)
        }
        return results
    }

    setFixture(method: string, params: any[] | undefined, response: any): void {
        const key = this.makeKey(method, params)
        this.fixtures.set(key, response)
    }

    /**
     * Configure a method+params (or bare method) to throw the given error.
     * Use an {@link RpcError} to exercise validateError-based handling such as
     * the "response is too big" fallback.
     */
    setError(method: string, params: any[] | undefined, error: Error): void {
        const key = this.makeKey(method, params)
        this.errors.set(key, error)
    }

    private makeKey(method: string, params?: any[]): string {
        if (!params || params.length === 0) {
            return method
        }
        return `${method}:${JSON.stringify(params)}`
    }
}
