import {parse} from "graphql"
import {Client as PgClient, ClientBase, Pool} from "pg"
import {createPoolConfig} from "../../db"
import {buildModel, buildSchema} from "../../gql/schema"
import {ListeningServer, serve} from "../../server"
import {Client} from "./client"


export const db_config = createPoolConfig()


async function withClient(block: (client: ClientBase) => Promise<void>): Promise<void> {
    let client = new PgClient(db_config)
    await client.connect()
    try {
        await block(client)
    } finally {
        await client.end()
    }
}


export function databaseInit(sql: string[]): Promise<void> {
    return withClient(async client => {
        for (let i = 0; i < sql.length; i++) {
            await client.query(sql[i])
        }
    })
}


export function databaseDelete(): Promise<void> {
    return withClient(async client => {
        await client.query(`DROP SCHEMA IF EXISTS public CASCADE`)
        await client.query(`CREATE SCHEMA public`)
    })
}


export function useDatabase(sql: string[]): void {
    before(async () => {
        await databaseDelete()
        await databaseInit(sql)
    })
}


export function useServer(schema: string): Client {
    let client = new Client('not defined')
    let db = new Pool(db_config)
    let info: ListeningServer | undefined
    before(async () => {
        info = await serve({
            db,
            model: buildModel(buildSchema(parse(schema))),
            port: 0
        })
        client.endpoint = `http://localhost:${info.port}/graphql`
    })
    after(() => info?.stop())
    after(() => db.end())
    return client
}
