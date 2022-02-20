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
ADD rpc-client/package.json rpc-client/
ADD scale-codec/package.json scale-codec/
ADD scale-codec-json/package.json scale-codec-json/
ADD ss58-codec/package.json ss58-codec/
ADD ss58/package.json ss58/
ADD substrate-archive/package.json substrate-archive/
ADD substrate-archive-status-service/package.json substrate-archive-status-service/
ADD substrate-metadata/package.json substrate-metadata/
ADD substrate-metadata-explorer/package.json substrate-metadata-explorer/
ADD substrate-metadata-explorer/bin substrate-metadata-explorer/bin
ADD substrate-processor/package.json substrate-processor/
ADD substrate-evm-processor/package.json substrate-evm-processor/
ADD substrate-typegen/package.json substrate-typegen/
ADD substrate-typegen/bin substrate-typegen/bin
ADD test/balances/package.json test/balances/
ADD test/data/package.json test/data/
ADD test/e2e-project/package.json test/e2e-project/
ADD test/e2e-suite/package.json test/e2e-suite/
ADD test/gql-client/package.json test/gql-client/
ADD test/types/package.json test/types/
ADD typeorm-config/package.json typeorm-config/
ADD util/package.json util/
ADD workspace/package.json workspace/
RUN node common/scripts/install-run-rush.js install
ADD cli/src cli/src
ADD cli/tsconfig.json cli/
ADD graphql-server/src graphql-server/src
ADD graphql-server/tsconfig.json graphql-server/
ADD graphql-server/Makefile graphql-server/
ADD openreader/src openreader/src
ADD openreader/tsconfig.json openreader/
ADD rpc-client/src rpc-client/src
ADD rpc-client/tsconfig.json rpc-client/
ADD scale-codec/src scale-codec/src
ADD scale-codec/tsconfig.json scale-codec/
ADD scale-codec-json/src scale-codec-json/src
ADD scale-codec-json/tsconfig.json scale-codec-json/
ADD ss58-codec/src ss58-codec/src
ADD ss58-codec/tsconfig.json ss58-codec/
ADD ss58/src ss58/src
ADD ss58/tsconfig.json ss58/
ADD substrate-archive/src substrate-archive/src
ADD substrate-archive/tsconfig.json substrate-archive/
ADD substrate-archive-status-service/src substrate-archive-status-service/src
ADD substrate-archive-status-service/tsconfig.json substrate-archive-status-service/
ADD substrate-metadata/src substrate-metadata/src
ADD substrate-metadata/tsconfig.json substrate-metadata/
ADD substrate-metadata-explorer/src substrate-metadata-explorer/src
ADD substrate-metadata-explorer/tsconfig.json substrate-metadata-explorer/
ADD substrate-processor/src substrate-processor/src
ADD substrate-processor/tsconfig.json substrate-processor/
ADD substrate-evm-processor/src substrate-evm-processor/src
ADD substrate-evm-processor/tsconfig.json substrate-evm-processor/
ADD substrate-typegen/src substrate-typegen/src
ADD substrate-typegen/tsconfig.json substrate-typegen/
ADD test/balances/src test/balances/src
ADD test/balances/tsconfig.json test/balances/
ADD test/data/src test/data/src
ADD test/data/tsconfig.json test/data/
ADD test/e2e-project/src test/e2e-project/src
ADD test/e2e-project/schema.graphql test/e2e-project/
ADD test/e2e-project/typedefs.json test/e2e-project/
ADD test/e2e-project/typegen.json test/e2e-project/
ADD test/e2e-project/tsconfig.json test/e2e-project/
ADD test/e2e-suite/src test/e2e-suite/src
ADD test/e2e-suite/tsconfig.json test/e2e-suite/
ADD test/gql-client/src test/gql-client/src
ADD test/gql-client/tsconfig.json test/gql-client/
ADD typeorm-config/src typeorm-config/src
ADD typeorm-config/tsconfig.json typeorm-config/
ADD util/src util/src
ADD util/tsconfig.json util/
ADD workspace/src workspace/src
ADD workspace/tsconfig.json workspace/
RUN node common/scripts/install-run-rush.js build
RUN cd cli && npx oclif manifest


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


FROM builder AS test-project-builder
RUN node common/scripts/install-run-rush.js deploy --project e2e-test-project
FROM node AS test-project
RUN apk add make curl
COPY --from=test-project-builder /squid/common/deploy /squid
WORKDIR /squid/test/e2e-project
ADD test/e2e-project/entrypoint.sh .
ADD test/e2e-project/Makefile .
ENTRYPOINT ["/squid/test/e2e-project/entrypoint.sh"]


FROM builder AS test-suite-builder
RUN node common/scripts/install-run-rush.js deploy --project e2e-test-suite
FROM node AS test-suite
COPY --from=test-suite-builder /squid/common/deploy /squid
WORKDIR /squid/test/e2e-suite
ADD test/e2e-suite/entrypoint.sh .
ENTRYPOINT ["/squid/test/e2e-suite/entrypoint.sh"]


FROM hasura-with-migrations AS substrate-archive-gateway
RUN apt-get -y update \
    && apt-get install -y curl ca-certificates gnupg lsb-release \
    && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get -y update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-client-12 \
    && apt-get purge -y curl ca-certificates lsb-release gnupg \
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
