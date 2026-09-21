import {RpcError} from '@subsquid/rpc-client'

export class MockRpcClient {
    private fixtures: Map<string, any>

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
        if (this.fixtures.has(key)) {
            return this.fixtures.get(key)
        }

        // Try without params
        if (this.fixtures.has(method)) {
            return this.fixtures.get(method)
        }

        throw new Error(`No fixture found for method: ${method} with params: ${JSON.stringify(params)}`)
    }

    async batchCall(
        batch: {method: string; params?: any[]}[],
        options?: {
            validateResult?: (result: any, req: {method: string; params?: any[]}) => any
            validateError?: (info: {code: number; message: string}, req: {method: string; params?: any[]}) => any
        },
    ): Promise<any[]> {
        const results = []
        for (const req of batch) {
            try {
                let result = await this.call(req.method, req.params)
                if (result?.error && typeof result.error === 'object' && 'message' in result.error) {
                    if (options?.validateError) {
                        result = options.validateError(result.error, req)
                    } else {
                        throw new RpcError(result.error)
                    }
                } else if (options?.validateResult) {
                    result = options.validateResult(result, req)
                }
                results.push(result)
            } catch (error: any) {
                results.push({error: error.message})
            }
        }
        return results
    }

    setFixture(method: string, params: any[] | undefined, response: any): void {
        const key = this.makeKey(method, params)
        this.fixtures.set(key, response)
    }

    private makeKey(method: string, params?: any[]): string {
        if (!params || params.length === 0) {
            return method
        }
        return `${method}:${JSON.stringify(params)}`
    }
}
