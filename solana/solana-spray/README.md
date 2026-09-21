# @subsquid/solana-spray

[Subsquid Spray](https://github.com/subsquid/spray) service client.

## Usage

```ts
import {SprayClient} from '@subsquid/spray'

const client = new SprayClient('wss://...')

const stream = client.subscribe({
    query: { // Select all Whirlpool swaps
        instructions: [
            {
                where: {
                    programId: ['whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'],
                    discriminator: ['0xf8c69e91e17587c8'],
                    isCommitted: true
                },
                include: {
                    innerInstructions: true,
                    transaction: true,
                }
            }
        ]
    }
})

for await (const batch of stream) {
    for (const msg of batch) {
        console.log(msg)
    }
}
```
