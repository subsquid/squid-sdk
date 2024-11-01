# Change Log - @subsquid/rpc-client

This log was last generated on Fri, 01 Nov 2024 17:26:43 GMT and should not be manually modified.

## 4.10.0
Fri, 01 Nov 2024 17:26:43 GMT

### Minor changes

- make `exectution timeout` error retryable

## 4.9.0
Wed, 17 Apr 2024 12:46:35 GMT

### Minor changes

- allow less than 1 rps rate limits

## 4.8.0
Tue, 09 Apr 2024 17:45:37 GMT

### Minor changes

- Allow to configure HTTP headers

## 4.7.0
Sun, 17 Mar 2024 23:20:20 GMT

### Minor changes

- add `.fixUnsafeIntegers` request option

### Patches

- refine retry warning message

## 4.6.0
Sun, 24 Dec 2023 20:05:50 GMT

### Minor changes

- annotate rpc errors with endpoint url and response body

## 4.5.0
Fri, 01 Dec 2023 16:55:51 GMT

### Minor changes

- introduce subscriptions and notifications
- introduce `.validateError` call option

### Patches

- update dependencies

## 4.4.2
Thu, 28 Sep 2023 20:58:19 GMT

### Patches

- update dependencies
- compile with TypeScript 5

## 4.4.1
Tue, 05 Sep 2023 20:32:34 GMT

### Patches

- support basic auth http urls

## 4.4.0
Wed, 19 Jul 2023 16:48:14 GMT

### Minor changes

- annotate RPC errors with call info

### Patches

- handle unordered results from HTTP batch call

## 4.3.0
Tue, 20 Jun 2023 11:29:34 GMT

### Minor changes

- add `CallOptions.validateResult()` and `RetryError` for call result validation with ability to re-use built-in retry mechanism

## 4.2.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- implement `.rateLimit` option
- downgrade `TypeScript` to `4.9.5`

### Patches

- better capture rate limit errors

## 4.1.0
Sat, 10 Jun 2023 15:11:08 GMT

### Minor changes

- migrate to TypeScript 5 and update other dependencies

## 4.0.0
Mon, 05 Jun 2023 09:30:42 GMT

### Breaking changes

- rework to support http, resiliency, etc

## 3.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- Introduce ArrowSquid

## 2.0.0
Thu, 09 Feb 2023 15:10:00 GMT

### Breaking changes

- remove `ResilientRpcClient` in favour of `@subsquid/util-internal-resilient-rpc`

## 1.0.2
Thu, 07 Jul 2022 15:00:50 GMT

### Patches

- move timeout code into separate package

## 1.0.1
Fri, 24 Jun 2022 22:07:05 GMT

### Patches

- upgrade dependencies

## 1.0.0
Sun, 19 Jun 2022 21:26:31 GMT

### Breaking changes

- Introduce FireSquid

## 0.1.5
Wed, 02 Mar 2022 18:11:28 GMT

### Patches

- fix unhandled promise rejection

## 0.1.4
Mon, 21 Feb 2022 12:42:23 GMT

### Patches

- fix memory leak

## 0.1.3
Wed, 02 Feb 2022 11:01:32 GMT

### Patches

- upgrade dependencies

## 0.1.2
Thu, 20 Jan 2022 08:42:53 GMT

### Patches

- include src files into npm package

## 0.1.1
Tue, 18 Jan 2022 09:31:27 GMT

### Patches

- change license to GPL3

## 0.1.0
Thu, 13 Jan 2022 16:05:36 GMT

### Minor changes

- internal: add ResilientRpcClient

## 0.0.2
Sat, 08 Jan 2022 13:00:12 GMT

### Patches

- throw `RpcConnectionError` for socket errors

## 0.0.1
Mon, 03 Jan 2022 16:07:32 GMT

### Patches

- set `publishConfig.access` to `public`

## 0.0.0
Mon, 03 Jan 2022 12:24:26 GMT

_Initial release_

