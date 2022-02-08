import * as path from "path"
import {Client} from "pg"
import {migrate} from "postgres-migrations"


export async function getConnection(): Promise<Client> {
    let db = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'archive',
        password: '',
        port: 5432,
    })
    await db.connect()
    await migrate({client: db}, path.resolve(__dirname, '../migration'))
    return db
}
