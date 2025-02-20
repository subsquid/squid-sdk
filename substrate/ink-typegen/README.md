# @subsquid/ink-typegen

Generates next code units:
* TypeScript functions and all the necessary type definitions
for type-safe decoding of [ink!](https://ink.substrate.io) events, messages and constructors.
* Class `Contract` that contains `contracts_call` queries to the contract's state.

## Usage

```bash
npm i @subsquid/ink-abi # Generated code will reference this package
npm i @subsquid/ink-typegen --save-dev
```

```
Options:
  --abi <path>     path to a JSON metadata file
  --output <path>  path for output typescript file
  -h, --help       display help for command

Typegen might be started as follows:
squid-ink-typegen --abi erc20.json --output src/erc20.ts
```

### Decoding
Generated functions allow to decode [scale](https://docs.substrate.io/reference/scale-codec/)-encoded data for 3 different kind of ink! objects:
* `constructor` - it's arguments that the contract receives on instantiation
* `message` - it's arguments that the contract receives on call execution
* `event` - it's data that the contract emittes on call execution
```ts
// Generated code:
const _abi = new Abi(metadata)

export function decodeEvent(hex: string): Event {
  return _abi.decodeEvent(hex)
}

export function decodeMessage(hex: string): Message {
  return _abi.decodeMessage(hex)
}

export function decodeConstructor(hex: string): Constructor {
  return _abi.decodeConstructor(hex)
}

// Usage example:
let event = decodeEvent(item.event.args.data)
if (event.__kind === 'Transfer') {
    // event is of type `Event_Transfer`
}
```

### Reading state
`Contract` class provides state calls for an every message that doesn't mutate the contract's state. The info about mutability is taken from the metadata.
```ts
// Generated code:
export class Contract {
    total_supply(): Promise<Balance> {
        return this.stateCall('0xdb6375a8', [])
    }

    balance_of(owner: AccountId): Promise<Balance> {
        return this.stateCall('0x0f755a56', [owner])
    }

    allowance(owner: AccountId, spender: AccountId): Promise<Balance> {
        return this.stateCall('0x6a00165e', [owner, spender])
    }
}

// Usage example:
let contract = new Contract(ctx, contractAddress)
let totalSupply = await contract.total_supply()
```