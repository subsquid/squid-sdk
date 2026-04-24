# `evm-codec-bench`

TypeScript benchmarks for `@subsquid/evm-codec` (struct-level encode/decode) and `@subsquid/evm-abi` (event decode, function encode/decode).

## What is being compared

The benchmarks wire the **same** values through three **libraries** and assert parity (identical encodings / decodings), then time each path:

| Label | What it is |
|--------|------------|
| **new (JIT)** | In-repo `@subsquid/evm-codec` / `@subsquid/evm-abi` (JIT + `HexSrc`) |
| **old (loop)** | `evm-codec-old` / `evm-abi-old` (last published 0.3.x on npm) |
| **viem** | `viem` ABI helpers (encode/decode parameters, `decodeEventLog`, function data, …) |

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

This runs `lib/bench.js` and `lib/bench-abi.js` **three times** on **Node** and **three times** on **Bun**, medians all throughput numbers, and rewrites the **[Benchmark results](#benchmark-results-auto-generated)** section. Requires `bun` on `PATH` (install from [bun.sh](https://bun.sh)).

The manual single-pass commands above are still useful for quick A/B on one runtime.

## Benchmark results (auto-generated)

The block below is overwritten by `npm run bench:collect`. Do not edit it by hand.

<!-- BENCH-RESULTS:AUTO -->
_Last updated: 2026-04-24 — Node `v20.18.2`, Linux 6.6.87.2-microsoft-standard-WSL2._

### `lib/bench.js` (StructCodec)

```
=== static struct (ERC20 Transfer event args) (200,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        301.30 ms       663,794 ops/s
  old (loop)       512.77 ms       390,042 ops/s
  viem             380.71 ms       525,331 ops/s
  decode:
  new (JIT)         37.01 ms     5,403,965 ops/s
  old (loop)       264.22 ms       756,939 ops/s
  viem             950.52 ms       210,411 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 1.70x   decode 7.14x
    vs viem         encode 1.26x   decode 25.68x

=== dynamic struct (bytes + array) (100,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        534.83 ms       186,976 ops/s
  old (loop)      1133.41 ms        88,229 ops/s
  viem            1707.18 ms        58,576 ops/s
  decode:
  new (JIT)        375.63 ms       266,218 ops/s
  old (loop)       725.62 ms       137,814 ops/s
  viem            4014.77 ms        24,908 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 2.12x   decode 1.93x
    vs viem         encode 3.19x   decode 10.69x

=== nested tuple (uniswap-style swap call) (50,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        133.00 ms       375,950 ops/s
  old (loop)       339.62 ms       147,224 ops/s
  viem             613.84 ms        81,454 ops/s
  decode:
  new (JIT)         86.01 ms       581,356 ops/s
  old (loop)       382.87 ms       130,592 ops/s
  viem            1119.53 ms        44,662 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 2.55x   decode 4.45x
    vs viem         encode 4.62x   decode 13.02x

=== aggregate-like struct (multicall tryAggregate output) (30,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        571.52 ms        52,491 ops/s
  old (loop)       678.00 ms        44,248 ops/s
  viem            1752.60 ms        17,117 ops/s
  decode:
  new (JIT)        167.29 ms       179,332 ops/s
  old (loop)       808.63 ms        37,100 ops/s
  viem            2853.85 ms        10,512 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 1.19x   decode 4.83x
    vs viem         encode 3.07x   decode 17.06x
```

### `lib/bench-abi.js` (AbiEvent / AbiFunction)

```
=== AbiEvent.decode: ERC-20 Transfer (200,000 iters) ===
  decode parity: OK
  decode:
  new (JIT)         31.67 ms     6,314,649 ops/s
  old (loop)       485.09 ms       412,296 ops/s
  viem            1158.56 ms       172,628 ops/s
  speedup (new vs baseline):
    vs old (loop)   decode 15.32x
    vs viem         decode 36.58x

=== AbiFunction.encode/decode: dynamic 4-arg call (50,000 iters) ===
  encode parity: OK
  encode:
  new (JIT)        267.11 ms       187,192 ops/s
  old (loop)       442.89 ms       112,895 ops/s
  viem            1636.47 ms        30,554 ops/s
  decode:
  new (JIT)        139.59 ms       358,199 ops/s
  old (loop)       477.18 ms       104,783 ops/s
  viem            2424.63 ms        20,622 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 1.66x   decode 3.42x
    vs viem         encode 6.13x   decode 17.37x
```
<!-- :BENCH-RESULTS:AUTO -->
