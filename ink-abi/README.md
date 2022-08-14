# @subsquid/ink-abi

Provides decoding functions for [ink!](https://ink.substrate.io) events, messages and constructors.

## Usage

```typescript
import {Abi} from "@subsquid/ink-abi"

const abi = new Abi(abi_json)
const args = abi.decodeConstructor('0x9bae9d5e0000a0dec5adc9353600000000000000')
assert(args.initialSupply == 1000000000000000000000n)
```
