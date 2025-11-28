import {HttpClient} from '@subsquid/http-client'
import {createUpload, Upload} from './upload'


export type ClickhouseDataFormat = 'JSONEachRow' | 'TabSeparated' | 'CSV'


export interface InsertArgs {
    table: string
    format: ClickhouseDataFormat
    columns?: string[]
}


export interface QueryResponse<T> {
    data: T[]
    query_id?: string
    totals?: T
    extremes?: Record<string, any>
    meta?: Array<{ name: string; type: string }>
    statistics?: { elapsed: number; rows_read: number; bytes_read: number }
    rows?: number
    rows_before_limit_at_least?: number
}


export class ClickhouseClient {
    private http: HttpClient

    constructor(private url: string) {
        this.http = new HttpClient({
            baseUrl: url,
        })
    }

    insert(args: InsertArgs): Upload<void> {
        let query = `INSERT INTO ${args.table} `
        if (args.columns) {
            query += `(${args.columns.join(', ')}) `
        }
        query += `FORMAT ${args.format}`
        return createUpload(this.url, {
            query: {query}
        })
    }

    query<R=any>(query: string, params?: Record<string, string | number>): Promise<QueryResponse<R>> {
        let q: Record<string, number | string> = {
            query: query.trim() + '\nFORMAT JSON'
        }
        for (let key in params) {
            q['param_' + key] = params[key]
        }
        return this.http.post('/', {query: q})
    }

    command(query: string): Promise<void> {
        return this.http.post('/', {query: {query}}).then(() => {})
    }
}
