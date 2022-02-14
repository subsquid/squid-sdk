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
    if (!res.rowCount) return 1  // TODO: set first block to 0
    return res.rows[0].height + 1
}


async function main() {
    dotenv.config()

    let db = await getConnection()
    let client = new ResilientRpcClient("wss://kusama-rpc.polkadot.io")
    let typesBundle = assertNotNull(getOldTypesBundle("kusama"))
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
            console.log(`Saved block #${block}`)
            if (interrupted) break
        }
    } finally {
        console.log('Closing the database connection')
        await db.end()
        console.log('Closing the rpc-client connection')
        client.close()
    }

    process.exit()
}

main()
