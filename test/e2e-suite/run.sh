#!/bin/bash

trap 'on_exit $?' EXIT; on_exit() {
    if [ "$1" != "0" ]; then
        docker-compose logs --tail all
    fi
    docker-compose down
}


if [ "$(uname -m)" = "arm64" ]; then
  HASURA="fedormelexin/graphql-engine-arm64:v2.0.10.cli-migrations-v3"
else
  HASURA="hasura/graphql-engine:v2.0.10.cli-migrations-v3"
fi


docker-compose build --build-arg HASURA="$HASURA" || exit 1
docker-compose run test-suite
