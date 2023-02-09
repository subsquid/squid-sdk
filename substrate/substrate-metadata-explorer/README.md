# @subsquid/substrate-metadata-explorer

This package provides `squid-substrate-metadata-explorer(1)` command
which can perform binary search over blocks of [substrate](https://substrate.io) based chain
to discover all spec versions and fetch corresponding metadata.

The results of exploration are stored in a [jsonl](https://jsonlines.org) file which is typically 
consumed by [substrate-typegen](../substrate-typegen).

For more details run `squid-substrate-metadata-explorer --help`.
