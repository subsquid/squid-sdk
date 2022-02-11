import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {getOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull} from "@subsquid/util"
import dotenv from "dotenv"
import {Client} from "pg"
import {SubstrateIngest} from "./ingest"
import {getConnection} from "./db"
import {PostgresSync} from "./sync"


async function getLastHeight(db: Client): Promise<number | undefined> {
    let res = await db.query("SELECT height FROM block ORDER BY height DESC LIMIT 1")
    if (res.rowCount) {
        return res.rows[0].height
    }
}


async function main() {
    dotenv.config()

    let db = await getConnection()
    let client = new ResilientRpcClient("wss://kusama-rpc.polkadot.io")
    let typesBundle = assertNotNull(getOldTypesBundle("kusama"))
    let sync = new PostgresSync(db)
    let ingest = new SubstrateIngest({client, typesBundle, sync})
    let interrupted = false

    process.on('SIGINT', () => {
        interrupted = true
    })

    process.on('SIGTERM', () => {
        interrupted = true
    })

    try {
        let lastHeight = await getLastHeight(db)
        let blockHeight = lastHeight ? lastHeight + 1 : 1  // TODO: set first block to 0

        for await (let block of ingest.loop(blockHeight)) {
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
