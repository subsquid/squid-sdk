# @subsquid/ss58-codec

Encoder and decoder for [SS58 address format](https://docs.substrate.io/v3/advanced/ss58/).

## Usage

```typescript
import * as ss58 from "@subsquid/ss58-codec"

let address = ss58.decode('EXtQYFeY2ivDsfazZvGC9aG87DxnhWH2f9kjUUq2pXTZKF5') 
address.prefix // => 2 (address type)
address.bytes  // => Uint8Array of raw address bytes

ss58.encode(address) // => EXtQYFeY2ivDsfazZvGC9aG87DxnhWH2f9kjUUq2pXTZKF5
```
