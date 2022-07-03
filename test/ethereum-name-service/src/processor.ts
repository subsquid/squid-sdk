import { Processor, EvmLogHandlerContext } from "@subsquid/eth-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import * as registry from "./abi/registry"
import { Domain, DomainEvent, Transfer } from "./model"

require('dotenv').config()

const processor = new Processor(new TypeormDatabase())

const ROOT_NODE = '0x0000000000000000000000000000000000000000000000000000000000000000'
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

processor.setDataSource({
    archive: 'http://172.30.144.1:8080'
})

processor.setBlockRange({
    from: 11000000,
    to: 14150000,
})

processor.setBatchSize(5000)

processor.setFieldSelection({
    tx: {},
    block: {},
    data: true,
});

processor.addEvmLogHandler(
    "0x314159265dd8dbb310642f98f50c066173c1259b",
    [
        [registry.events['Transfer(bytes32,address)'].topic]
    ],
    async (ctx: EvmLogHandlerContext<Store>) => {
        if(!ctx.log.data) {
            throw new Error("no data");
        }

        const transfer = registry.events['Transfer(bytes32,address)'].decode({
            data: ctx.log.data,
            topics: ctx.log.topics,
        });
    }
)

processor.addEvmLogHandler(
    "0x314159265dd8dbb310642f98f50c066173c1259b",
    [
        [registry.events["NewTTL(bytes32,uint64)"].topic]
    ],
    async (ctx: EvmLogHandlerContext<Store>) => {
        if(!ctx.log.data) {
            throw new Error("no data");
        }

        const newTtl = registry.events["NewTTL(bytes32,uint64)"].decode({
            data: ctx.log.data,
            topics: ctx.log.topics,
        });

        console.log(`NEW_TTL: ${JSON.stringify(newTtl, null, 2)}`);
    }
)

processor.run()
