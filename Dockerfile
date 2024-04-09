ARG node=node:20-alpine
FROM ${node} AS node


FROM node AS builder
RUN apk add g++ make python3
WORKDIR /squid
ADD . .
RUN node common/scripts/install-run-rush.js install
RUN rm common/config/rush/build-cache.json
RUN node common/scripts/install-run-rush.js build


FROM builder AS solana-dump-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/solana-dump


FROM node AS solana-dump
COPY --from=solana-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/solana/solana-dump/bin/run.js"]


FROM builder AS solana-ingest-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/solana-ingest


FROM node AS solana-ingest
COPY --from=solana-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/solana/solana-ingest/bin/run.js"]


FROM builder AS substrate-dump-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-dump


FROM node AS substrate-dump
COPY --from=substrate-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/substrate/substrate-dump/bin/run.js"]


FROM builder AS substrate-ingest-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-ingest


FROM node AS substrate-ingest
COPY --from=substrate-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/substrate/substrate-ingest/bin/run.js"]


FROM builder AS substrate-metadata-service-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-metadata-service


FROM node AS substrate-metadata-service
COPY --from=substrate-metadata-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/substrate/substrate-metadata-service/bin/run.js"]
