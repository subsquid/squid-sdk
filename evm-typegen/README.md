# @subsquid/evm-typegen

Generates TypeScript facades for EVM transactions, logs and issuing `eth_call` queries.

Generated facades supposed to be used withing squid mapping projects and depend on [ethers](https://www.npmjs.com/package/ethers).

## Usage

```
npm i @subsquid/evm-typegen
```

```
squid-evm-typegen [options] <output-dir> [abi...]

Arguments:
  output-dir   output directory for generated definitions
  abi          list of ABI files

Options:
  --multicall  generate facade for MakerDAO multicall contract
  --clean      delete output directory before run
  -h, --help   display help for command
```
