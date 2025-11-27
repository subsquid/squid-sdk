import {createUpload, Upload} from './upload'


export interface ClickhouseClientOptions {
    url: string
    username?: string
    password?: string
}


export type ClickhouseDataFormat = 'JSONEachRow' | 'TabSeparated' | 'CSV'


export interface InsertArgs {
    table: string
    format: ClickhouseDataFormat
    columns?: string[]
}


export class ClickhouseClient {
    constructor(private params: ClickhouseClientOptions) {}

    insert(args: InsertArgs): Upload<void> {
        let query = `INSERT INTO ${args.table} `
        if (args.columns) {
            query += `(${args.columns.join(', ')}) `
        }
        query += `FORMAT ${args.format}`
        return createUpload(this.params.url, {
            query: {query},
            username: this.params.username,
            password: this.params.password
        })
    }
}
