# Squid SDK - Solana Example

The Squid SDK is a set of tools to ingest, transform and present blockchain data.
The SDK currently supports indexing of EVM- and [Substrate](https://substrate.io)-based chains.
This is an MVP indexing (Orca Exchange)[https://www.orca.so/] with the Squid SDK. 

## Getting started

To get started, download or clone the [Squid SDK repo](https://github.com/subsquid/squid-sdk) and follow the instructions from README. 
To start Solana example, run `rush build` in the squid-sdk folder. 
Next, run `cd ./test/solana-example`.
To generate the model types, use `npx squid-typeorm-codegen` command.
To start the docker container, run `docker-compose up -d`. This will start the database container. 
Next, generate the migration with `npx squid-typeorm-migration generate`.
To start the indexing process, run `npx node -r dotenv/config lib/processor.js`. This will start the `SolanaBatchProcessor`. 
To shut down, use `docker-compose down -v`.

For step-by-step instructions, follow one of the [Quickstart guides](https://docs.subsquid.io/quickstart/).

## Overview

The Solana example contains several key components. 

### ABI

Contract ABI in the `./abi` folder is used to decode intructions. Squid typegen tool generates facade TypeScript classes for
type-safe decoding of Solana instrcutions and inner instrcutions.

### Processor

`processor.ts` file contains `SolanaBatchProcessor`, which is used to set gateway (https://v2.archive.subsquid.io/network/solana-mainnet for Solana mainnet),
define block range and add instrcutions.

### Setting up the processor

To set the block range and gateway, you can refer to (general settings page)[https://docs.subsquid.io/sdk/reference/processors/evm-batch/general/]. 
To define the set of instrcutions, `options` has the following structure:

```
{
  // data requests
    programId:  string[],
    d8:  string[],
  // related data retrieval
    innerInstructions: boolean,
    transaction: boolean,
    transactionTokenBalances: boolean,
    isCommitted: boolean,
}
```





