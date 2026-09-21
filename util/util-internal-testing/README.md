# @subsquid/util-internal-testing

Testing utilities for the Squid SDK. Intended for internal use by tests across the monorepo.

## Contents

- **`mock-portal`** — in-process HTTP server that mimics the Squid Portal API. Serves a programmable queue of mock responses (200 JSONL, 204 no-content, 409 fork conflict, 500/503) with request-validation hooks. Designed for integration tests of the processor and data-source packages.

See `docs/architecture/` for the broader architecture this package supports.
