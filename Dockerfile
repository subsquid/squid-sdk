ARG node=node:22-slim
FROM ${node} AS node


FROM node AS builder
RUN apt-get update && apt-get -y --no-install-recommends install \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /squid
ADD . .
RUN node common/scripts/install-run-rush.js install
RUN rm common/config/rush/build-cache.json
RUN node common/scripts/install-run-rush.js build


FROM builder AS solana-hotblocks-service-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/solana-data-service


FROM builder AS evm-hotblocks-service-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/evm-data-service

FROM node AS solana-hotblocks-service
COPY --from=solana-hotblocks-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/solana/solana-data-service/lib/main.js"]


FROM node AS evm-hotblocks-service
COPY --from=evm-hotblocks-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/evm/evm-data-service/lib/main.js"]


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


FROM builder AS tron-dump-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/tron-dump


FROM node AS tron-dump
COPY --from=tron-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/tron/tron-dump/bin/run.js"]


FROM builder AS tron-ingest-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/tron-ingest


FROM node AS tron-ingest
COPY --from=tron-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/tron/tron-ingest/bin/run.js"]


FROM builder AS fuel-dump-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/fuel-dump


FROM node AS fuel-dump
COPY --from=fuel-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/fuel/fuel-dump/bin/run.js"]


FROM builder AS fuel-ingest-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/fuel-ingest


FROM node AS fuel-ingest
COPY --from=fuel-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/fuel/fuel-ingest/bin/run.js"]
