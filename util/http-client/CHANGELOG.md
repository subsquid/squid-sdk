# Change Log - @subsquid/http-client

This log was last generated on Sat, 09 Aug 2025 06:10:24 GMT and should not be manually modified.

## 1.6.1
Sat, 09 Aug 2025 06:10:24 GMT

### Patches

- fix abort signal listeners leak

## 1.6.0
Fri, 20 Dec 2024 16:52:59 GMT

### Minor changes

- add support for `retry-after` header

## 1.5.0
Wed, 07 Aug 2024 15:52:38 GMT

### Minor changes

- make 524 error retryable

## 1.4.0
Sun, 17 Mar 2024 23:20:20 GMT

### Minor changes

- expose `FetchResponse` type

## 1.3.2
Fri, 01 Dec 2023 16:55:51 GMT

### Patches

- update dependencies
- update dependencies

## 1.3.1
Thu, 28 Sep 2023 20:58:19 GMT

### Patches

- update dependencies
- compile with TypeScript 5

## 1.3.0
Tue, 12 Sep 2023 08:42:04 GMT

### Minor changes

- add response stream mode
- expose `HttpBody` type

## 1.2.2
Thu, 07 Sep 2023 18:37:04 GMT

### Patches

- fix: `HttpClient.isRetryableError()` should handle `HttpError` instances

## 1.2.1
Tue, 05 Sep 2023 20:32:34 GMT

### Patches

- support basic auth urls

## 1.2.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- downgrade `TypeScript` to `4.9.5`
- use default logger when no logger is passed

### Patches

- fix exception in `isHttpConnectionError()` when `node-fetch` ESM is not loaded
- fix response headers logging

## 1.1.0
Sat, 10 Jun 2023 15:11:08 GMT

### Minor changes

- migrate to TypeScript 5 and update other dependencies

## 1.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- Introduce ArrowSquid

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

