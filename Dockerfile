ARG NODE=node:16-alpine
ARG HASURA=hasura/graphql-engine:v2.0.3.cli-migrations-v3
FROM ${NODE} AS node
FROM ${HASURA} AS hasura-with-migrations


FROM node AS builder
WORKDIR /squid
RUN apk add g++ make python3
ADD rush.json .
ADD common common
RUN node common/scripts/install-run-rush.js --help > /dev/null
ADD cli/package.json cli/
ADD cli/bin cli/bin
ADD graphql-server/package.json graphql-server/
ADD graphql-server/bin graphql-server/bin
ADD openreader/package.json openreader/
ADD openreader/bin openreader/bin
ADD scale-codec/package.json scale-codec/
ADD substrate-archive/package.json substrate-archive/
ADD substrate-archive-status-service/package.json substrate-archive-status-service/
ADD substrate-metadata/package.json substrate-metadata/
ADD substrate-processor/package.json substrate-processor/
ADD test/e2e-project/package.json test/e2e-project/
ADD test/gql-client/package.json test/gql-client/
ADD typeorm-config/package.json typeorm-config/
ADD util/package.json util/
RUN node common/scripts/install-run-rush.js install
ADD cli/resource cli/resource
ADD cli/src cli/src
ADD cli/tsconfig.json cli/
ADD graphql-server/src graphql-server/src
ADD graphql-server/tsconfig.json graphql-server/
ADD graphql-server/Makefile graphql-server/
ADD openreader/src openreader/src
ADD openreader/tsconfig.json openreader/
ADD scale-codec/src scale-codec/src
ADD scale-codec/tsconfig.json scale-codec/
ADD substrate-archive/src substrate-archive/src
ADD substrate-archive/tsconfig.json substrate-archive/
ADD substrate-archive-status-service/src substrate-archive-status-service/src
ADD substrate-archive-status-service/tsconfig.json substrate-archive-status-service/
ADD substrate-metadata/src substrate-metadata/src
ADD substrate-metadata/tsconfig.json substrate-metadata/
ADD substrate-processor/src substrate-processor/src
ADD substrate-processor/tsconfig.json substrate-processor/
ADD test/e2e-project/db test/e2e-project/db
ADD test/e2e-project/src test/e2e-project/src
ADD test/e2e-project/schema.graphql test/e2e-project/
ADD test/e2e-project/tsconfig.json test/e2e-project/
ADD test/e2e-project/Makefile test/e2e-project/
ADD test/gql-client/src test/gql-client/src
ADD test/gql-client/tsconfig.json test/gql-client/
ADD typeorm-config/src typeorm-config/src
ADD typeorm-config/tsconfig.json typeorm-config/
ADD util/src util/src
ADD util/tsconfig.json util/
RUN node common/scripts/install-run-rush.js build


FROM builder AS substrate-archive-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-archive
FROM node AS substrate-archive
COPY --from=substrate-archive-builder /squid/common/deploy /squid
WORKDIR /squid/substrate-archive
CMD ["node", "./lib/run.js", "index"]


FROM builder AS substrate-archive-status-service-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-archive-status-service
FROM node AS substrate-archive-status-service
COPY --from=substrate-archive-status-service-builder /squid/common/deploy /squid
WORKDIR /squid/substrate-archive-status-service
CMD ["node", "./lib/app.js"]


FROM hasura-with-migrations AS substrate-archive-gateway
RUN apt-get -y update \
    && apt-get install -y curl ca-certificates gnupg lsb-release \
    && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get -y update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-client-12 \
    && apt-get purge -y curl lsb-release gnupg \
    && apt-get -y autoremove \
    && apt-get -y clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/share/doc/ \
    && rm -rf /usr/share/man/ \
    && rm -rf /usr/share/locale/
RUN mv /bin/docker-entrypoint.sh /bin/hasura-entrypoint.sh
ADD substrate-archive-gateway/metadata /hasura-metadata/
ADD substrate-archive-gateway/docker-entrypoint.sh .
ENTRYPOINT [ "/docker-entrypoint.sh" ]
EXPOSE 8080
