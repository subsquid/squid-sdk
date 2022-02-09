import * as path from "path"
import {Client} from "pg"
import {migrate} from "postgres-migrations"


export async function getConnection(): Promise<Client> {
    let db = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    })
    await db.connect()
    await migrate({client: db}, path.resolve(__dirname, '../migrations'))
    return db
}
