import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {getOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull} from "@subsquid/util"
import {SubstrateArchive} from "./archive"
import {getConnection} from "./db"


async function main() {
    let db = await getConnection()
    let client = new ResilientRpcClient("wss://kusama-rpc.polkadot.io")
    let typesBundle = assertNotNull(getOldTypesBundle("kusama"))
    let archive = new SubstrateArchive({client, db, typesBundle})
    await archive.run()
}

main()
