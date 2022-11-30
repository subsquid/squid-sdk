# Change Log - @subsquid/graphql-server

This log was last generated on Sun, 27 Nov 2022 18:43:31 GMT and should not be manually modified.

## 3.2.4
Sun, 27 Nov 2022 18:43:31 GMT

_Version update only_

## 3.2.3
Sun, 06 Nov 2022 18:24:20 GMT

### Patches

- disable batch gql requests (because they were broken)

## 3.2.2
Fri, 28 Oct 2022 12:04:58 GMT

_Version update only_

## 3.2.1
Sat, 15 Oct 2022 11:43:02 GMT

_Version update only_

## 3.2.0
Thu, 22 Sep 2022 15:21:10 GMT

### Minor changes

- support `BigDecimal` type
- support in-memory and redis-based dumb cache

## 3.1.0
Thu, 15 Sep 2022 20:54:52 GMT

### Minor changes

- add support for queryable interfaces

## 3.0.0
Wed, 07 Sep 2022 20:52:29 GMT

### Breaking changes

- fix connection pool size (default 5, customizable via `GQL_DB_CONNECTION_POOL_SIZE`)
- remove `--subscription-sql-statement-timeout` option

## 2.1.0
Tue, 30 Aug 2022 09:15:59 GMT

### Minor changes

- add support for response size limits

## 2.0.0
Wed, 17 Aug 2022 17:33:52 GMT

### Breaking changes

- new reworked implementation
- temporarily disable fulltext search queries
- support GraphQL subscriptions
- support `--sql-statement-timeout` option
- support `--max-request-size` option

## 1.1.0
Fri, 24 Jun 2022 22:07:05 GMT

### Minor changes

- typeorm upgrade from `0.2.x` to `0.3.6`

### Patches

- upgrade dependencies

## 1.0.0
Sun, 19 Jun 2022 21:26:31 GMT

### Breaking changes

- Introduce FireSquid

## 0.3.0
Thu, 05 May 2022 20:47:14 GMT

### Minor changes

- support JSON scalar type

### Patches

- fix error when querying `to-many` relation with no items
- fix error when querying `to-many` relation with no items

## 0.2.0
Wed, 20 Apr 2022 22:55:27 GMT

### Minor changes

- new features via openreader upgrade

## 0.1.5
Wed, 23 Feb 2022 11:18:26 GMT

_Version update only_

## 0.1.4
Wed, 02 Feb 2022 11:01:32 GMT

### Patches

- upgrade dependencies

## 0.1.3
Tue, 25 Jan 2022 12:44:12 GMT

_Version update only_

## 0.1.2
Thu, 20 Jan 2022 08:42:53 GMT

### Patches

- include src files into npm package

## 0.1.1
Tue, 18 Jan 2022 09:31:27 GMT

### Patches

- change license to GPL3

## 0.1.0
Sat, 08 Jan 2022 13:00:12 GMT

### Minor changes

- add support for `GRAPHQL_SERVER_PORT` env var for compatibility

## 0.0.3
Tue, 04 Jan 2022 10:40:43 GMT

### Patches

- fix shebang in executable

## 0.0.2
Mon, 03 Jan 2022 16:07:32 GMT

### Patches

- set `publishConfig.access` to `public`

## 0.0.1
Mon, 03 Jan 2022 12:24:26 GMT

_Initial release_

