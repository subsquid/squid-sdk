# Change Log - @subsquid/openreader

This log was last generated on Sun, 27 Nov 2022 18:43:31 GMT and should not be manually modified.

## 3.1.4
Sun, 27 Nov 2022 18:43:31 GMT

### Patches

- fix `BigDecimal` array output precision

## 3.1.3
Sun, 06 Nov 2022 18:24:20 GMT

### Patches

- disable batch gql requests (because they were broken)

## 3.1.2
Fri, 28 Oct 2022 12:04:58 GMT

_Version update only_

## 3.1.1
Sat, 15 Oct 2022 11:43:02 GMT

_Version update only_

## 3.1.0
Thu, 22 Sep 2022 15:21:10 GMT

### Minor changes

- support `BigDecimal` type
- add cache option to `runApollo()`

## 3.0.0
Thu, 15 Sep 2022 20:54:52 GMT

### Breaking changes

- remove `--subscription-sql-statement-timeout` option
- refactor internal data structures used throughout framework

### Minor changes

- add support for queryable interfaces

## 2.1.0
Tue, 30 Aug 2022 09:15:59 GMT

### Minor changes

- support subscriptions in built-in graphql playground
- add support for response size limits

### Patches

- entity lists should be non-nullable

## 2.0.0
Wed, 17 Aug 2022 17:33:52 GMT

### Breaking changes

- new reworked implementation
- new CLI
- temporarily disable fulltext search queries
- support GraphQL subscriptions
- support `--sql-statement-timeout` option
- support `--max-request-size` option

## 1.0.3
Wed, 06 Jul 2022 09:25:54 GMT

_Version update only_

## 1.0.2
Sun, 26 Jun 2022 21:17:38 GMT

### Patches

- add shebang to executable

## 1.0.1
Fri, 24 Jun 2022 22:07:05 GMT

### Patches

- upgrade dependencies

## 1.0.0
Sun, 19 Jun 2022 21:26:31 GMT

### Breaking changes

- Introduce FireSquid

## 0.7.1
Fri, 03 Jun 2022 21:02:03 GMT

### Patches

- fix link in readme

## 0.7.0
Thu, 05 May 2022 20:47:14 GMT

### Minor changes

- support JSON scalar type

## 0.6.0
Wed, 20 Apr 2022 22:55:27 GMT

### Minor changes

- compatibility with [cockroachDB](https://www.cockroachlabs.com)
- implement `containsInsensitive` string filter

## 0.5.1
Sun, 27 Mar 2022 11:00:39 GMT

### Patches

- fix stack overflow when dealing with self-referencing entities and objects

## 0.5.0
Wed, 23 Feb 2022 11:18:26 GMT

### Minor changes

- implement isNull operator

### Patches

- fix not enough columns in SQL result regression when typeorm connection is used

## 0.4.1
Wed, 02 Feb 2022 11:01:32 GMT

### Patches

- upgrade dependencies

## 0.4.0
Tue, 25 Jan 2022 12:44:12 GMT

### Minor changes

- internal: add support for `@index` directives

## 0.3.3
Thu, 20 Jan 2022 08:42:53 GMT

### Patches

- include src files into npm package

## 0.3.2
Tue, 18 Jan 2022 09:31:27 GMT

### Patches

- change license to GPL3

## 0.3.1
Mon, 03 Jan 2022 16:07:32 GMT

### Patches

- set `publishConfig.access` to `public`

## 0.3.0
Mon, 03 Jan 2022 12:24:26 GMT

### Minor changes

- refactor internals for squid project

### Patches

- migrate to squid mono-repo

