ARG node=node:16-alpine
ARG npm_registry=https://registry.npmjs.org/
FROM ${node} AS node
ARG npm_registry


FROM node AS node-with-gyp
RUN apk add g++ make python3


FROM node-with-gyp AS substrate-archive
WORKDIR /squid
RUN NPM_CONFIG_REGISTRY=$npm_registry npm install -g @subsquid/substrate-archive
