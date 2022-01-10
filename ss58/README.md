# @subsquid/ss58

SS58 [registry](https://github.com/paritytech/ss58-registry) and [codec](https://github.com/subsquid/squid/tree/master/ss58-codec).

## Usage

```typescript
import * as ss58 from "@subsquid/ss58"

ss58.registry.get('kusama') // => {prefix: 2, network: 'kusama', ...}
ss58.registry.get(2) // => {prefix: 2, network: 'kusama', ...}

ss58.codec('kusama').encode(rawAddressBytes) // => EXtQYFeY2...
ss58.codec(2).encode(rawAddressBytes) // Same as above

ss58.codec('kusama').decode('EXtQYFeY2...') // => rawAddressBytes
ss58.codec('kusama').decode(polkadotAddress) // => throws error

let address = ss58.decode('EXtQYFeY2ivDsfazZvGC9aG87DxnhWH2f9kjUUq2pXTZKF5')
address.prefix // => 2 (address type)
address.bytes  // => Uint8Array of raw address bytes
ss58.encode(address) // => EXtQYFeY2ivDsfazZvGC9aG87DxnhWH2f9kjUUq2pXTZKF5
```
