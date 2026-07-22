# optimism / 154497277 (0x93570fd)

Regression fixture for OP-stack **deposit transactions** (type `0x7e`).

Captured from `https://mainnet.optimism.io` via `test/capture-fixtures.ts`, with **one deliberate
edit**: the `nonce` field was removed from the deposit transaction at index 0
(`0x6a5ab9998b916b0419b70d31f91d351032f0d622e3fb38feaba0e3915e4a8d8a`, the L1-attributes system
tx from `0xdead…0001`).

## Why the edit

Deposit transactions have no signed nonce — they are identified by `sourceHash` — and can be
delivered without a `nonce` field. This fixture omits it so the harness's `schema validation`
test guards against a regression (nonce is `option()` in the `Transaction` schema).

Removing the deposit-tx nonce does **not** affect block-hash, transactions-root, or receipts-root
verification: the `0x7e` RLP encoding never includes nonce, and only this one tx was edited.

**If you re-capture this fixture, re-apply the edit** (delete `nonce` from the `0x7e` tx) —
otherwise the regression signal is lost.
