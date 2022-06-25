import {createOrmConfig} from "@subsquid/typeorm-config"
import {assertNotNull} from "@subsquid/util-internal"
import {Client as PgClient, ClientBase} from "pg"
import {Connection, createConnection, EntityManager} from "typeorm"
import {Store} from "../store"
import {Item} from "./lib/model"


export const db_config = {
    host: 'localhost',
    port: parseInt(assertNotNull(process.env.DB_PORT)),
    user: assertNotNull(process.env.DB_USER),
    password: assertNotNull(process.env.DB_PASS),
    database: assertNotNull(process.env.DB_NAME)
}


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
        await client.query(`DROP SCHEMA IF EXISTS root CASCADE`)
        await client.query(`CREATE SCHEMA root`)
    })
}


export function useDatabase(sql: string[]): void {
    beforeEach(async () => {
        await databaseDelete()
        await databaseInit(sql)
    })
}


let connection: Promise<Connection> | undefined


export function getEntityManager(): Promise<EntityManager> {
    if (connection == null) {
        connection = createConnection(
            createOrmConfig({projectDir: __dirname})
        )
    }
    return connection.then(con => con.createEntityManager())
}


export function createStore(): Store {
    return new Store(getEntityManager)
}


export async function getItems(): Promise<Item[]> {
    let em = await getEntityManager()
    return em.find(Item)
}


export function getItemIds(): Promise<string[]> {
    return getItems().then(items => items.map(it => it.id).sort())
}
