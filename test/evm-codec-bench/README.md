# `evm-codec-bench`

TypeScript benchmarks for `@subsquid/evm-codec` (struct-level encode/decode) and `@subsquid/evm-abi` (event decode, function encode/decode).

## What is being compared

The benchmarks wire the **same** values through three **libraries** and assert parity (identical encodings / decodings), then time each path:

| Label | What it is |
|--------|------------|
| **new (JIT)** | In-repo `@subsquid/evm-codec` / `@subsquid/evm-abi` (JIT + `HexSrc`) |
| **old (loop)** | `evm-codec-old` / `evm-abi-old` (last published 0.3.x on npm) |
| **viem** | `viem` ABI helpers (encode/decode parameters, `decodeEventLog`, function data, …) |

The section **[Benchmark results (auto-generated)](#benchmark-results-auto-generated)** at the end of this file is updated by `npm run bench:collect`. It contains **(1)** median **ops/s** for all three along with **explicit ratios** new÷old and new÷viem on **Node**, and **(2)** **Bun ÷ Node** for **`new (JIT)` only** so you can compare runtimes. Each ratio **above 1×** means the left-hand **throughput** (numerator) is higher — i.e. the numerator is faster in that run.

## Prerequisites

- Build the local packages (`@subsquid/evm-codec`, `@subsquid/evm-abi`) so the bench package resolves them (e.g. monorepo `rush build` for those projects).
- In this package: `npm run build` (compiles `src/` → `lib/`).

## Run (single pass)

| Step | Node.js | Bun |
|------|---------|-----|
| StructCodec | `node lib/bench.js` | `bun lib/bench.js` |
| ABI | `node lib/bench-abi.js` | `bun lib/bench-abi.js` |
| Parity self-checks | `node lib/verify-abi.js` | `bun lib/verify-abi.js` |

`package.json` shortcuts:

- `npm run bench` — `node lib/bench.js`
- `npm run bench:abi` — `node lib/bench-abi.js`
- `npm run verify` — `node lib/verify-abi.js`

## Record results (Node + Bun, 3 runs each, update README)

From this directory, after `npm run build`:

```bash
node scripts/collect-bench.mjs
# or
npm run bench:collect
```

This runs `lib/bench.js` and `lib/bench-abi.js` **three times** on **Node** and **three times** on **Bun**, medians all throughput numbers, and rewrites the **[Benchmark results](#benchmark-results-auto-generated)** section with **(a)** a three-way table (new / old / viem + new÷old, new÷viem) and **(b)** a Bun vs Node table for `new (JIT)` only. Requires `bun` on `PATH` (install from [bun.sh](https://bun.sh)).

The manual single-pass commands above are still useful for quick A/B on one runtime.

## Benchmark results (auto-generated)

The block below is overwritten by `npm run bench:collect` (ratios, ops/s, Node vs Bun). Do not edit it by hand.

<!-- BENCH-RESULTS:AUTO -->
_Last updated: 2026-04-24 — median of **3** consecutive runs on the same machine._

| | |
|---|---|
| **Node** | `v20.18.2` |
| **Bun** | `1.2.23` |
| **Kernel** | Linux 6.6.87.2-microsoft-standard-WSL2 |

### `lib/bench.js` (StructCodec)

| Scenario | Node `new (JIT)` encode (median) | Node decode (median) | Bun encode (median) | Bun decode (median) |
|---|---:|---:|---:|---:|
| static struct (ERC20 Transfer event args) | 395.23 k ops/s | 6.31 M ops/s | 578.40 k ops/s | 3.60 M ops/s |
| dynamic struct (bytes + array) | 96.63 k ops/s | 261.31 k ops/s | 110.62 k ops/s | 245.06 k ops/s |
| nested tuple (uniswap-style swap call) | 184.52 k ops/s | 573.26 k ops/s | 224.39 k ops/s | 505.16 k ops/s |
| aggregate-like struct (multicall tryAggregate output) | 47.07 k ops/s | 162.66 k ops/s | 43.66 k ops/s | 141.19 k ops/s |

### `lib/bench-abi.js` (AbiEvent / AbiFunction)

| Scenario | Node `new (JIT)` encode (median) | Node decode (median) | Bun encode (median) | Bun decode (median) |
|---|---:|---:|---:|---:|
| AbiEvent.decode: ERC-20 Transfer | — | 6.80 M ops/s | — | 3.22 M ops/s |
| AbiFunction.encode/decode: dynamic 4-arg call | 130.57 k ops/s | 360.76 k ops/s | 165.97 k ops/s | 314.09 k ops/s |

These rows are **median ops/s** for **`new (JIT)` only** (Node vs Bun). **`new` vs `old (loop)` vs `viem` ratios** are not duplicated here: run `node lib/bench.js` / `node lib/bench-abi.js` once and use the **speedup** lines in the terminal; see [Comparison: what is measured](#comparison-what-is-measured) above.
<!-- :BENCH-RESULTS:AUTO -->
