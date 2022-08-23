ARG node=node:16-alpine
FROM ${node} AS node


FROM node AS builder
RUN apk add g++ make python3
WORKDIR /squid
ADD . .
RUN node common/scripts/install-run-rush.js install
RUN node common/scripts/install-run-rush.js build


FROM builder AS substrate-ingest-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-ingest


FROM node AS substrate-ingest
COPY --from=substrate-ingest-builder /squid/common/deploy /squid
WORKDIR /squid/substrate-ingest
EXPOSE 9090
ENTRYPOINT ["node", "/squid/substrate-ingest/bin/run.js", "--prom-port", "9090"]


FROM builder AS chain-status-service-builder
RUN node common/scripts/install-run-rush.js deploy --project chain-status-service


FROM node AS chain-status-service
COPY --from=chain-status-service-builder /squid/common/deploy /squid
ENTRYPOINT ["node", "/squid/util/chain-status-service/lib/main.js"]
CMD ["/squid/util/chain-status-service/config.json"]
EXPOSE 3000


FROM builder AS substrate-explorer-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-explorer


FROM node AS substrate-explorer
COPY --from=substrate-explorer-builder /squid/common/deploy /squid
WORKDIR /squid/substrate-explorer
ENTRYPOINT [ "node", "lib/main.js"]
EXPOSE 3000
