# EVM-RPC Test Suite

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm run test:verification
npm run test:chain-utils
npm run test:rpc
```

## Capturing Fixtures

To capture new test fixtures from a live RPC endpoint:

```bash
npm run capture-fixture -- \
  --chain ethereum \
  --block 18000000 \
  --rpc-url https://ethereum-rpc.publicnode.com \
  --with-receipts
```

**Working RPC endpoints:**
- Ethereum: `https://ethereum-rpc.publicnode.com`
- Polygon: `https://polygon-bor-rpc.publicnode.com`
- Arbitrum: `https://arbitrum-one-rpc.publicnode.com`
- Hyperliquid: `https://rpc.hyperliquid.xyz/evm`
