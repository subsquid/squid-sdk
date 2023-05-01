import {createLogger} from '@subsquid/logger'
import {HttpClient} from '@subsquid/http-client'


const http = new HttpClient({
    log: createLogger('sqd:evm-typegen:fetch'),
    retryAttempts: 3
})


export function GET<T=any>(url: string): Promise<T> {
    return http.get(url)
}
