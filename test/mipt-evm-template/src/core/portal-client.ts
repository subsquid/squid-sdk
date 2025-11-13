import {HttpClient, HttpError, HttpResponse} from '@subsquid/http-client'
import {PortalApi, PortalStreamHeaders, PortalStreamResponse} from '@subsquid/portal-tools'
import {array, assertValidity, NAT, object, STRING} from '@subsquid/util-internal-validation'


export class PortalClient implements PortalApi {
    private http: HttpClient

    constructor(url: string) {
        this.http = new HttpClient({
            baseUrl: url,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            httpTimeout: 20_000
        })
    }

    stream(query: object, abort: AbortSignal): Promise<PortalStreamResponse> {
        return this.http.request('POST', '/', {
            json: query,
            stream: true,
            abort
        }).then(
            res => {
                switch(res.status) {
                    case 200:
                        return {
                            status: 200,
                            data: res.body,
                            ...getPortalStreamHeaders(res)
                        }
                    case 204:
                        return {
                            status: 204,
                            ...getPortalStreamHeaders(res)
                        }
                    default:
                        res.body.destroy()
                        throw new Error(`Portal protocol violation: invalid http status - ${res.status}`)
                }
            },
            err => {
                if (err instanceof HttpError && err.response.status == 409) {
                    try {
                        assertValidity(ConflictResponse, err.response.body)
                    } catch(e: any) {
                        throw new Error(`Portal protocol violation: invalid 409 response shape: ${e.toString()}`)
                    }
                    return {
                        status: 409,
                        previousBlocks: err.response.body.previousBlocks
                    }
                }
                throw err
            }
        )
    }
}


const ConflictResponse = object({
    previousBlocks: array(object({
        number: NAT,
        hash: STRING
    }))
})


function getPortalStreamHeaders(res: HttpResponse): PortalStreamHeaders {
    let stream: PortalStreamHeaders = {}

    let headNumber = getNumberHeader(res, 'x-sqd-head-number')
    if (headNumber != null) {
        stream.headNumber = headNumber
    }

    let finalizedHeadNumber = getNumberHeader(res, 'x-sqd-finalized-head-number')
    if (finalizedHeadNumber != null) {
        stream.finalizedHeadNumber = finalizedHeadNumber
    }

    let finalizedHeadHash = res.headers.get('x-sqd-finalized-head-hash')
    if (finalizedHeadHash) {
        stream.finalizedHeadHash = finalizedHeadHash
    }

    return stream
}


function getNumberHeader(res: HttpResponse, name: string): number | undefined {
    let s = res.headers.get(name)
    if (s == null) return undefined
    let val = parseInt(s)
    if (!Number.isSafeInteger(val) || val < 0) {
        throw new Error(`Portal protocol violation: invalid http header '${name}' - '${s}'`)
    }
    return val
}
