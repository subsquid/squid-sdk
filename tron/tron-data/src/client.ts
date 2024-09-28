import {HttpClient, FetchRequest, FetchResponse} from '@subsquid/http-client'
import {fixUnsafeIntegers} from '@subsquid/util-internal-json-fix-unsafe-integers'


export class TronHttpClient extends HttpClient {
    protected async handleResponseBody(req: FetchRequest, res: FetchResponse): Promise<any> {
        if (!res.ok) return super.handleResponseBody(req, res)
        let json = await res.text()
        json = fixUnsafeIntegers(json)
        return JSON.parse(json)
    }
}
