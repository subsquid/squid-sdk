import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {getOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull} from "@subsquid/util"
import dotenv from "dotenv"
import {Client} from "pg"
import {SubstrateIngest} from "./ingest"
import {getConnection} from "./db"
import {Sync} from "./sync"


async function getArchiveHead(db: Client): Promise<number> {
    let res = await db.query("SELECT height FROM block ORDER BY height DESC LIMIT 1")
    if (!res.rowCount) return 0
    return res.rows[0].height + 1
}


async function main() {
    dotenv.config()

    let db = await getConnection()
    console.log('Database connection is opened')

    let url = assertNotNull(process.env.WS_PROVIDER_ENDPOINT_URI)
    let client = new ResilientRpcClient(url)
    console.log(`Rpc-client connected to ${url}`)

    let chain = assertNotNull(process.env.CHAIN)
    let typesBundle = assertNotNull(getOldTypesBundle(chain))
    let sync = new Sync(db)
    let ingest = new SubstrateIngest({client, typesBundle, sync})
    let interrupted = false

    process.on('SIGINT', () => {
        interrupted = true
    })

    process.on('SIGTERM', () => {
        interrupted = true
    })

    try {
        let archiveHead = await getArchiveHead(db)
        for await (let block of ingest.loop(archiveHead)) {
            console.log(`Saved block №${block.height}`)
            if (interrupted) break
        }
    } finally {
        await db.end()
        console.log('The database connection is closed')
        await client.close()
        console.log('The rpc-client connection is closed')
    }

    process.exit()
}

main()
