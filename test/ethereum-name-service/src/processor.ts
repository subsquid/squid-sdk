import { EthProcessor, EvmLogHandlerContext } from "@subsquid/eth-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import * as registry from "./abi/registry"
import { Account, Domain, DomainEvent, Transfer } from "./model"

require('dotenv').config()

const processor = new EthProcessor(new TypeormDatabase())

processor.setDataSource({
    archive: 'http://172.30.144.1:8080'
})

processor.setBlockRange({
    from: 11000000,
    to: 14150000,
})

processor.setBatchSize(5000)

processor.setFieldSelection({
    tx: {
        hash: true,
    },
    block: {
        number: true,
    },
    data: true,
    logIndex: true,
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

        let owner = await ctx.store.get(Account, transfer.owner);
        if(!owner) {
            owner = new Account({
                id: transfer.owner,
            });
            await ctx.store.save(owner);
        }

        let domain = await ctx.store.get(Domain, transfer.node);
        if(!domain) {
            domain = new Domain({
                id: transfer.node,
                isMigrated: false,
                createdAt: BigInt(Date.now()),
                owner,
            });
            await ctx.store.save(domain);
        }

        const blockNumber = ctx.log.block.number;
        if (!blockNumber) {
            throw new Error("no block number");
        }

        const transactionID = ctx.log.tx.hash;
        if (!transactionID) {
            throw new Error("no tx hash");
        }

        await ctx.store.save(new DomainEvent({
            id: `${transactionID}.${ctx.log.logIndex}`,
            transactionID: Buffer.from(transactionID, 'hex'),
            blockNumber,
            kind: new Transfer({
                owner: transfer.owner,
            }),
            domain,
        }));
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
