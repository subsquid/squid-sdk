
# Solana Example with Squid SDK

Welcome to the Solana example using the Squid SDK! This README provides a comprehensive guide to get you started with indexing Orca Exchange on the Solana blockchain using the Squid SDK. The Squid SDK is a versatile toolkit designed for ingesting, transforming, and presenting blockchain data, with support for EVM- and Substrate-based chains. This guide focuses on an MVP for indexing Orca Exchange.

## Getting Started

To set up and start using the Solana example, follow the steps below:

### Prerequisites

- Docker installed on your system for running containers.
- Node.js (version 14.x or higher) installed.
- Git for cloning the repository.
- [Rush](https://www.npmjs.com/package/@microsoft/rush)

### Setup Instructions

1. **Clone the Squid SDK Repository**

   Download or clone the Squid SDK repository:

   ```bash
   git clone https://github.com/your/squid-sdk.git
   ```

2. **Build the Project**

   Navigate to the Squid SDK directory and build the project:

   ```bash
   cd squid-sdk
   rush build
   ```

3. **Navigate to Solana Example**

   Change into the Solana example directory:

   ```bash
   cd ./test/solana-example
   ```

4. **Generate Model Types**

   Use the Squid typeorm codegen tool to generate model types:

   ```bash
   npx squid-typeorm-codegen
   ```

5. **Start the Docker Container**

   Run the following command to start the database container:

   ```bash
   docker-compose up -d
   ```

6. **Generate Migration**

   Generate the migration for your database:

   ```bash
   npx squid-typeorm-migration generate
   ```

7. **Start the Indexing Process**

   Execute the command below to start the SolanaBatchProcessor:

   ```bash
   npx node -r dotenv/config lib/processor.js
   ```

8. **Shutdown the Docker Container**

   To shut down and clean up, use:

   ```bash
   docker-compose down -v
   ```

## Overview

### ABI

The ABI folder (`./abi`) contains contract ABIs used to decode instructions. The Squid typegen tool generates TypeScript classes for type-safe decoding of Solana instructions and inner instructions.

### Processor

The `processor.ts` file is central to the operation, setting up the SolanaBatchProcessor with necessary configurations such as the gateway, block range, and instructions.

### Setting Up the Processor

Configure the processor as follows:

- **Gateway and Block Range**: Refer to the general settings page to set the gateway (e.g., `https://v2.archive.subsquid.io/network/solana-mainnet` for Solana mainnet) and the block range for processing.

- **Defining Instructions**: The instruction set is defined with an options structure, including program IDs, operation codes (d8 for specific operations), and flags for additional data retrieval like inner instructions, transaction details, and token balances.

```json
{
  "programId": ["string[]"],
  "d8": ["string[]"],
  "innerInstructions": true,
  "transaction": true,
  "transactionTokenBalances": true,
  "isCommitted": true
}
```

