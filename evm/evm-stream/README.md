# @subsquid/evm-stream

EVM block data source that allows to request and fetch block data from SQD Network.

## Usage

```typescript
import {DataSourceBuilder} from '@subsquid/evm-stream'

const dataSource = new DataSourceBuilder()
    .setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet')
    .setFields({
        log: {
            topics: true,
            data: true,
        },
        transaction: {
            hash: true,
            input: true,
        }
    })
    .addLog({
        where: {
            address: ['0x...'],
            topic0: ['0x...']
        },
        include: {
            transaction: true
        }
    })
    .addTransaction({
        where: {
            to: ['0x...'],
            sighash: ['0x...']
        },
        include: {
            logs: true,
            traces: true
        }
    })
    .addTrace({
        where: {
            type: ['call', 'create'],
            callTo: ['0x...']
        },
        include: {
            transaction: true
        }
    })
    .addStateDiff({
        where: {
            address: ['0x...'],
            kind: ['+', '*']
        },
        include: {
            transaction: true
        }
    })
    .build()

// Use the data source
for await (let batch of dataSource.getStream()) {
    for (let block of batch.blocks) {
        // Process blocks
        console.log(block.header.height)
        for (let log of block.logs) {
            console.log(log.address, log.topics)
        }
    }
}
```

## Request Structure

Each `add*` method accepts an object with optional `where` and `include` properties:

- `where`: Filters for selecting specific items (e.g., addresses, topics, sighashes)
- `include`: Relations to include in the response (e.g., transaction, logs, traces)
- `range`: Optional block range for the request

This structure matches the EVM processor API for consistency across the Subsquid SDK.