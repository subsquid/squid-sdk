# @subsquid/ink-typegen

Generates TypeScript functions and all the necessary type definitions
for type-safe decoding of [ink!](https://ink.substrate.io) events, messages and constructors.

## Usage

```bash
npm i @subsquid/ink-abi # Generated code will reference this package
npm i @subsquid/ink-typegen --save-dev
npx squid-ink-typgen --abi erc20.json --output src/erc20.ts
```
