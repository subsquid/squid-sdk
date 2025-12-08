# @subsquid/evm-objects

Augmented EVM data model for use with `@subsquid/evm-stream`.

This package provides enhanced EVM data structures with proper relationships between blocks, transactions, logs, traces, and state diffs. It follows the same pattern as `@subsquid/solana-objects` but adapted for EVM chains.

## Features

- **Rich object model**: Classes with methods and relationships instead of plain objects
- **Automatic ID generation**: Unique IDs for all entities
- **Relationship setup**: Automatic linking between transactions, logs, traces, and state diffs
- **Type-safe**: Full TypeScript support with field selection

## Installation

```bash
npm install @subsquid/evm-objects @subsquid/evm-stream
```

## Usage

```typescript
import {augmentBlock} from '@subsquid/evm-objects'
import {run} from '@subsquid/evm-stream'

run({
    // ... stream configuration
}, async (streamBlocks) => {
    for (let block of streamBlocks) {
        // Augment the block with relationships
        let augmented = augmentBlock(block)
        
        // Access transactions with their logs
        for (let tx of augmented.transactions) {
            console.log(`Transaction ${tx.id} has ${tx.logs.length} logs`)
            
            // Access logs
            for (let log of tx.logs) {
                console.log(`Log ${log.id} belongs to tx ${log.getTransaction().id}`)
            }
            
            // Access traces with parent-child relationships
            for (let trace of tx.traces) {
                console.log(`Trace ${trace.id} has ${trace.children.length} children`)
                if (trace.parent) {
                    console.log(`Parent trace: ${trace.parent.id}`)
                }
            }
        }
    }
})
```

## API

### `augmentBlock<F>(block: Block<F>): Block<F>`

Augments a block from `@subsquid/evm-stream` with:
- Unique IDs for all entities
- Bidirectional relationships between entities
- Helper methods like `getTransaction()`, `getParent()`
- Sorted collections

### Enhanced Types

All types from `@subsquid/evm-stream` are enhanced with:

- **BlockHeader**: Adds `id` field
- **Transaction**: Adds `id`, `block` reference, and arrays for `logs`, `traces`, `stateDiffs`
- **Log**: Adds `id`, `block` reference, `transaction` reference, and `getTransaction()` method
- **Trace**: Adds `id`, `block` reference, `transaction` reference, `parent`/`children` references, and helper methods
- **StateDiff**: Adds `block` reference, `transaction` reference, and `getTransaction()` method

## License

GPL-3.0-or-later
