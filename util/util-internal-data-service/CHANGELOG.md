# Change Log - @subsquid/util-internal-data-service

This log was last generated on Wed, 08 Jul 2026 22:11:26 GMT and should not be manually modified.

## 0.1.1
Wed, 08 Jul 2026 22:11:26 GMT

### Patches

- Prevent worker-thread leaks in `belowQuery` by closing the upstream iterator when the generator is terminated at its first yield or when `.head` is never iterated.
- Terminate `/stream` response processing as soon as the client disconnects, releasing an abandoned `belowQuery` backfill (and its worker threads) instead of running it until the 60s duration limit.

## 0.1.0
Mon, 11 May 2026 05:34:26 GMT

### Minor changes

- add metrics for block processing times and SLO compliance

### Patches

- init data service runtime helpers

