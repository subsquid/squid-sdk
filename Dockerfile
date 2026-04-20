# syntax=docker/dockerfile:1
ARG node=node:24-slim
FROM ${node} AS node


FROM node AS deps
RUN apt-get update && apt-get -y --no-install-recommends install \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /squid
ADD . .
RUN --mount=type=cache,id=pnpm-store,target=/squid/common/temp/pnpm-store \
    node common/scripts/install-run-rush.js install
RUN rm -f common/config/rush/build-cache.json


FROM deps AS bitcoin-dump-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/bitcoin-dump
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/bitcoin-dump

FROM node AS bitcoin-dump
COPY --from=bitcoin-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/bitcoin/bitcoin-dump/bin/run.js"]


FROM deps AS bitcoin-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/bitcoin-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/bitcoin-ingest

FROM node AS bitcoin-ingest
COPY --from=bitcoin-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/bitcoin/bitcoin-ingest/bin/run.js"]


FROM deps AS bitcoin-data-service-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/bitcoin-data-service
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/bitcoin-data-service

FROM node AS bitcoin-data-service
COPY --from=bitcoin-data-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/bitcoin/bitcoin-data-service/lib/main.js"]


FROM deps AS evm-dump-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/evm-dump
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/evm-dump

FROM node AS evm-dump
COPY --from=evm-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/evm/evm-dump/bin/run.js"]


FROM deps AS evm-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/evm-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/evm-ingest

FROM node AS evm-ingest
COPY --from=evm-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/evm/evm-ingest/bin/run.js"]


FROM deps AS evm-data-service-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/evm-data-service
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/evm-data-service

FROM node AS evm-data-service
COPY --from=evm-data-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/evm/evm-data-service/lib/main.js"]


FROM deps AS solana-dump-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/solana-dump
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/solana-dump

FROM node AS solana-dump
COPY --from=solana-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/solana/solana-dump/bin/run.js"]


FROM deps AS solana-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/solana-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/solana-ingest

FROM node AS solana-ingest
COPY --from=solana-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/solana/solana-ingest/bin/run.js"]


FROM deps AS solana-data-service-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/solana-data-service
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/solana-data-service

FROM node AS solana-data-service
COPY --from=solana-data-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/solana/solana-data-service/lib/main.js"]


FROM deps AS substrate-dump-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/substrate-dump
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-dump

FROM node AS substrate-dump
COPY --from=substrate-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/substrate/substrate-dump/bin/run.js"]


FROM deps AS substrate-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/substrate-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-ingest

FROM node AS substrate-ingest
COPY --from=substrate-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/substrate/substrate-ingest/bin/run.js"]


FROM deps AS substrate-metadata-service-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/substrate-metadata-service
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-metadata-service

FROM node AS substrate-metadata-service
COPY --from=substrate-metadata-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/substrate/substrate-metadata-service/bin/run.js"]


FROM deps AS tron-dump-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/tron-dump
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/tron-dump

FROM node AS tron-dump
COPY --from=tron-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/tron/tron-dump/bin/run.js"]


FROM deps AS tron-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/tron-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/tron-ingest

FROM node AS tron-ingest
COPY --from=tron-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/tron/tron-ingest/bin/run.js"]


FROM deps AS fuel-dump-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/fuel-dump
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/fuel-dump

FROM node AS fuel-dump
COPY --from=fuel-dump-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/fuel/fuel-dump/bin/run.js"]


FROM deps AS fuel-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/fuel-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/fuel-ingest

FROM node AS fuel-ingest
COPY --from=fuel-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/fuel/fuel-ingest/bin/run.js"]


FROM deps AS hyperliquid-fills-data-service-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/hyperliquid-fills-data-service
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/hyperliquid-fills-data-service

FROM node AS hyperliquid-fills-data-service
COPY --from=hyperliquid-fills-data-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/hyperliquid/hyperliquid-fills-data-service/lib/main.js"]


FROM deps AS hyperliquid-fills-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/hyperliquid-fills-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/hyperliquid-fills-ingest

FROM node AS hyperliquid-fills-ingest
COPY --from=hyperliquid-fills-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/hyperliquid/hyperliquid-fills-ingest/bin/run.js"]


FROM deps AS hyperliquid-replica-cmds-ingest-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/hyperliquid-replica-cmds-ingest
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/hyperliquid-replica-cmds-ingest

FROM node AS hyperliquid-replica-cmds-ingest
COPY --from=hyperliquid-replica-cmds-ingest-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "--max-old-space-size=8192", "/squid/hyperliquid/hyperliquid-replica-cmds-ingest/bin/run.js"]


FROM deps AS hyperliquid-replica-cmds-data-service-builder
RUN node common/scripts/install-run-rush.js build --to @subsquid/hyperliquid-replica-cmds-data-service
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/hyperliquid-replica-cmds-data-service

FROM node AS hyperliquid-replica-cmds-data-service
COPY --from=hyperliquid-replica-cmds-data-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/hyperliquid/hyperliquid-replica-cmds-data-service/lib/main.js"]
