// A JSON-RPC error returned by an upstream as a fixture, so that
// validateError() is exercised the same way the real client exercises it.
class MockRpcErrorFixture {
    constructor(public info: { code?: number, message: string, data?: any }) {}
}


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

    async call<T = any>(method: string, params?: any[], options?: {validateError?: (info: any, call?: any) => any}): Promise<T> {
        const fixture = this.lookup(method, params)
        if (fixture instanceof MockRpcErrorFixture) {
            if (options?.validateError) {
                return options.validateError(fixture.info, {method, params})
            }
            const err: any = new Error(fixture.info.message)
            err.code = fixture.info.code
            throw err
        }
        return fixture
    }

    private lookup(method: string, params?: any[]): any {
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

    async batchCall(batch: {method: string, params?: any[]}[], options?: {validateResult?: (result: any) => any, validateError?: (info: any, call?: any) => any}): Promise<any[]> {
        const results = []
        for (const req of batch) {
            let fixture: any
            try {
                fixture = this.lookup(req.method, req.params)
            } catch (error: any) {
                results.push({error: error.message})
                continue
            }
            if (fixture instanceof MockRpcErrorFixture) {
                // Mirror the real client: an error item is passed to validateError,
                // whose return value becomes the item's result. If validateError throws
                // (a non-recoverable error), the whole batch rejects.
                if (options?.validateError) {
                    results.push(options.validateError(fixture.info, req))
                } else {
                    const err: any = new Error(fixture.info.message)
                    err.code = fixture.info.code
                    throw err
                }
                continue
            }
            results.push(options?.validateResult ? options.validateResult(fixture) : fixture)
        }
        return results
    }

    setFixture(method: string, params: any[] | undefined, response: any): void {
        const key = this.makeKey(method, params)
        this.fixtures.set(key, response)
    }

    setErrorFixture(method: string, params: any[] | undefined, info: { code?: number, message: string, data?: any }): void {
        const key = this.makeKey(method, params)
        this.fixtures.set(key, new MockRpcErrorFixture(info))
    }

    private makeKey(method: string, params?: any[]): string {
        if (!params || params.length === 0) {
            return method
        }
        return `${method}:${JSON.stringify(params)}`
    }
}
