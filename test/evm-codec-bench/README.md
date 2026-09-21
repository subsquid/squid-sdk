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

## Benchmark results (snapshot)

The block below is a **snapshot** from a run on a developer machine. To refresh it, run `npm run build`, then `npm run bench` / `npm run bench:abi` (optionally on Bun) and paste the output here.

_Last updated: 2026-04-24 — Node `v20.18.2`, Bun `1.2.23`, Linux 6.6.87.2-microsoft-standard-WSL2._

### `lib/bench.js` (StructCodec) — Node.js

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

### `lib/bench.js` (StructCodec) — Bun

```
=== static struct (ERC20 Transfer event args) (200,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        157.39 ms     1,270,699 ops/s
  old (loop)       392.31 ms       509,797 ops/s
  viem             365.84 ms       546,683 ops/s
  decode:
  new (JIT)         48.46 ms     4,127,054 ops/s
  old (loop)       227.12 ms       880,610 ops/s
  viem             713.89 ms       280,156 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 2.49x   decode 4.69x
    vs viem         encode 2.32x   decode 14.73x

=== dynamic struct (bytes + array) (100,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        527.63 ms       189,527 ops/s
  old (loop)       998.93 ms       100,107 ops/s
  viem            2692.77 ms        37,137 ops/s
  decode:
  new (JIT)        356.05 ms       280,856 ops/s
  old (loop)       622.71 ms       160,589 ops/s
  viem            5027.85 ms        19,889 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 1.89x   decode 1.75x
    vs viem         encode 5.10x   decode 14.12x

=== nested tuple (uniswap-style swap call) (50,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        158.18 ms       316,101 ops/s
  old (loop)       338.18 ms       147,851 ops/s
  viem             946.29 ms        52,838 ops/s
  decode:
  new (JIT)        101.69 ms       491,701 ops/s
  old (loop)       266.70 ms       187,477 ops/s
  viem            1546.75 ms        32,326 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 2.14x   decode 2.62x
    vs viem         encode 5.98x   decode 15.21x

=== aggregate-like struct (multicall tryAggregate output) (30,000 iters) ===
  encode parity: OK   decode parity: OK
  encode:
  new (JIT)        532.78 ms        56,309 ops/s
  old (loop)       731.13 ms        41,033 ops/s
  viem            2709.37 ms        11,073 ops/s
  decode:
  new (JIT)        210.33 ms       142,632 ops/s
  old (loop)       507.75 ms        59,084 ops/s
  viem            4182.85 ms         7,172 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 1.37x   decode 2.41x
    vs viem         encode 5.09x   decode 19.89x
```

### `lib/bench-abi.js` (AbiEvent / AbiFunction) — Node.js

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

### `lib/bench-abi.js` (AbiEvent / AbiFunction) — Bun

```
=== AbiEvent.decode: ERC-20 Transfer (200,000 iters) ===
  decode parity: OK
  decode:
  new (JIT)         70.33 ms     2,843,887 ops/s
  old (loop)       391.01 ms       511,494 ops/s
  viem            1150.87 ms       173,782 ops/s
  speedup (new vs baseline):
    vs old (loop)   decode 5.56x
    vs viem         decode 16.36x

=== AbiFunction.encode/decode: dynamic 4-arg call (50,000 iters) ===
  encode parity: OK
  encode:
  new (JIT)        211.95 ms       235,900 ops/s
  old (loop)       410.04 ms       121,940 ops/s
  viem            1897.08 ms        26,356 ops/s
  decode:
  new (JIT)        165.19 ms       302,675 ops/s
  old (loop)       319.81 ms       156,342 ops/s
  viem            3008.19 ms        16,621 ops/s
  speedup (new vs baseline):
    vs old (loop)   encode 1.93x   decode 1.94x
    vs viem         encode 8.95x   decode 18.21x
```
