# OpenReader

GraphQL server for Hydra. Given [hydra schema](https://docs.subsquid.io/schema-spec) 
and compatible database it serves "read part" of [OpenCRUD spec](https://www.opencrud.org).

## Usage

```bash
openreader schema.graphql
```

Database connection and server port are configured via environment variables:

```
DB_NAME
DB_USER
DB_PASS
DB_HOST
DB_PORT
GRAPHQL_SERVER_PORT
```

## Compatibility

OpenReader is mostly compatible with previous warthog based implementation. 
Below is possibly incomplete list of edge cases where it differs.

1. If two object types participate in a same union, 
then their properties must have either different names or have a same type (modulo nullability).
2. Only camel case names of types and properties are allowed.
3. Filtering on typed json fields works without `_json` operator.
4. `orderBy` argument of relay connection is required, only forward pagination is supported.
5. `RelayConnection.edges`, `RelayConnection.edges.node` and `FulltextSearch.item` fields
do not support multiple aliases in GraphQL queries.
