# @subsquid/evm-typegen

Generates TypeScript facades for EVM transactions, logs and `eth_call` queries. 

The generated facade classes are assumed to be used by [squids](https://docs.Subsquid.io/overview) indexing EVM data. 
The generated classes depend on [ethers](https://www.npmjs.com/package/ethers).

## Usage

```
npm i -g @subsquid/evm-typegen
```

```
Arguments:
  output-dir             output directory for generated definitions
  abi                    ABI file

Options:
  --multicall            generate facade for MakerDAO multicall contract
  --etherscan-api <url>  etherscan API to fetch contract ABI by a known address
  --clean                delete output directory before run
  -h, --help             display help for command

ABI file can be specified in three ways:

1. as a plain JSON file:

squid-evm-typegen src/abi erc20.json

2. as a contract address (to fetch ABI from etherscan)

squid-evm-typegen src/abi 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413

3. as an arbitrary http url

squid-evm-typegen src/abi https://example.com/erc721.json

In all cases typegen will use ABI's basename as a basename of generated files.
You can overwrite basename of generated files using fragment (#) suffix.

squid-evm-typegen src/abi 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413#contract 
```
