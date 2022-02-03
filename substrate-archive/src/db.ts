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
    await migrate({client: db}, "/home/sar/projects/squid/substrate-archive/src/migrations")
    return db
}
