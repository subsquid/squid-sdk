# Change Log - @subsquid/util-internal-http-client

This log was last generated on Sat, 25 Feb 2023 19:16:49 GMT and should not be manually modified.

## 0.1.0
Sat, 25 Feb 2023 19:16:49 GMT

### Minor changes

- export `AgentProvider` interface and `HttpAgent` class
- use 20 second http request timeout by default

### Patches

- fix backoff pause time
- refine `isHttpConnectionError()`

## 0.0.1
Sun, 12 Feb 2023 12:16:19 GMT

### Patches

- use `body.arrayBuffer()` instead of `body.buffer()` to fix deprecation warning (closes #161)

## 0.0.0
Thu, 09 Feb 2023 15:10:00 GMT

_Initial release_

