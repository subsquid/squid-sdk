# OpenReader

GraphQL server for squid framework. Given [data schema](https://docs.subsquid.io/reference/openreader-schema) 
and compatible Postgres database it serves "read part" of [OpenCRUD spec](https://www.opencrud.org).

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
