#!/bin/bash

docker compose -f ops/npm-registry/docker-compose.yml down || exit 1
docker compose -f ops/npm-registry/docker-compose.yml up -d || exit 1


function Rush() {
    node common/scripts/install-run-rush.js "$@"
}

Rush install || exit 1
Rush build || exit 1
(cd cli && npx oclif manifest) || exit 1

Rush publish --include-all --version-policy public --publish --registry http://localhost:4873

