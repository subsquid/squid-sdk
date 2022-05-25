ARG node=node:16-alpine
FROM ${node} AS node


FROM node AS builder
RUN apk add g++ make python3
WORKDIR /squid
ADD . .
RUN node common/scripts/install-run-rush.js install
RUN node common/scripts/install-run-rush.js build
RUN cd cli && npx oclif manifest


FROM builder AS substrate-ingest-builder
RUN node common/scripts/install-run-rush.js deploy --project @subsquid/substrate-archive


FROM node AS substrate-ingest
COPY --from=substrate-ingest-builder /squid/common/deploy /squid
WORKDIR /squid/substrate-ingest
ENTRYPOINT ["node", "/squid/substrate-ingest/bin/run.js"]
