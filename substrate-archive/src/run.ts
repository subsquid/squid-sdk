import {SubstrateArchive} from "./archive"


async function main() {
    let archive = new SubstrateArchive("wss://kusama-rpc.polkadot.io", "kusama")
    await archive.run()
}

main()
