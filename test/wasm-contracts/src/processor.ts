import {SubstrateProcessor} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import {assertNotNull} from "@subsquid/util-internal"
import {Flip} from "./model"
import {Abi} from "@polkadot/api-contract"
import flipperMetadata from "./metadata.json"
import assert from "assert"


const processor = new SubstrateProcessor(new TypeormDatabase('wasm_contracts'))


processor.setDataSource({
    chain: assertNotNull(process.env.CHAIN_NODE),
    archive: assertNotNull(process.env.ARCHIVE)
})


processor.addContractsEventHandler(
    "0xde8f2aa373e804aa57dd18b16de1249477375e205ec6c8a8bb129a5c4067a81c",
    async ctx => {
        let { event, block } = ctx.substrate;

        let abi = new Abi(flipperMetadata)
        let bytes = Buffer.from(ctx.data.slice(2), 'hex')
        let decoded = abi.decodeEvent(bytes)
        let value = decoded.args[0].toHuman();
        assert(typeof value == 'boolean')

        ctx.store.save(new Flip({
            id: event.id,
            caller: event.extrinsic?.signature?.address.value,
            value,
            timestamp: BigInt(block.timestamp),
        }))
    }
)


processor.run()
