import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {getOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull} from "@subsquid/util"
import dotenv from "dotenv"
import {SubstrateArchive} from "./archive"
import {getConnection} from "./db"


async function main() {
    dotenv.config()

    let db = await getConnection()
    let client = new ResilientRpcClient("wss://kusama-rpc.polkadot.io")
    let typesBundle = assertNotNull(getOldTypesBundle("kusama"))
    let archive = new SubstrateArchive({client, db, typesBundle})
    let interrupted = false

    process.on('SIGINT', () => {
        interrupted = true
    })

    for await (let block of archive.loop()) {
        console.log(`Saved block #${block}`)
        if (interrupted) return
    }
}

main()
