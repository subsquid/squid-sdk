# @subsquid/substrate-explorer

GraphQL API for block explorers on top of subsquid substrate archive.

## Usage

This package is distributed as [subsquid/substrate-explorer](https://hub.docker.com/r/subsquid/substrate-explorer)
docker image and provides GraphQL server, 
which should be pointed at postgres or cockroach database 
created by [subsquid/substrate-ingest](https://github.com/subsquid/squid/tree/master/substrate-ingest).

Below is an example [docker-compose](https://docs.docker.com/compose/compose-file/) 
file with a full setup including data ingestion service. 
Navigate to http://localhost:3000/graphql after start.

```yaml
services:
  api:
    image: subsquid/substrate-explorer:firesquid
    depends_on: [db]
    ports:
      - "3000:3000"
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: polkadot_archive
      DB_USER: archive
      DB_PASS: hello
      # set DB_TYPE to cockroach when using cockroach
      # DB_TYPE: cockroach
      # setup sensible limits for production
      # GQL_DB_STATEMENT_TIMEOUT_MS: 2000
      # GQL_MAX_ROOT_FIELDS: 200
      # GQL_MAX_RESPONSE_NODES: 300000

  db:
    image: postgres:12
    environment:
      POSTGRES_DB: polkadot_archive
      POSTGRES_USER: archive
      POSTGRES_PASSWORD: hello

  ingest:
    image: subsquid/substrate-ingest:firesquid
    restart: always
    depends_on: [db]
    command: [
      "-e", "wss://rpc.polkadot.io",
      "-e", "wss://polkadot.api.onfinality.io/public-ws",
      "--out", "postgres://archive:hello@db:5432/polkadot_archive"
    ]
```
