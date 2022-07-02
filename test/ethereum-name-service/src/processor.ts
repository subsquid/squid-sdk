import { Processor } from "@subsquid/eth-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import * as registry from "./abi/registry"

require('dotenv').config()

const processor = new Processor(new TypeormDatabase())

processor.setDataSource({
    archive: 'http://192.168.240.1:8080'
})

processor.setBlockRange({
    from: 11000000,
    to: 11050000,
})

processor.setBatchSize(5000)

processor.setFieldSelection({
    tx: {},
    block: {},
    data: true,
    topic0: true,
    topic1: true,
    topic2: true,
    topic3: true,
});

processor.addEvmLogHandler(
    "0x314159265dd8dbb310642f98f50c066173c1259b",
    [],
    async ctx => {
        if (!ctx.log.data) {
            console.log("no data");
            return;
        }

        try {
            const transfer = registry.events['Transfer(bytes32,address)'].decode({
                data: ctx.log.data,
                topics: ctx.log.topics,
            })
    
            console.log(ctx.log.topics[0] === registry.events['Transfer(bytes32,address)'].topic)
            console.log(transfer)
        } catch {}

        try {
            const transfer = registry.events["NewTTL(bytes32,uint64)"].decode({
                data: ctx.log.data,
                topics: ctx.log.topics,
            })
    
            console.log(ctx.log.topics[0] === registry.events["NewTTL(bytes32,uint64)"].topic)
            console.log(transfer)
        } catch {}
    }
)

processor.run()
