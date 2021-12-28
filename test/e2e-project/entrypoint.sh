#!/bin/sh


gateway_ready() {
  curl -fs \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"query": "query {indexerStatus {head}}"}' \
    "$ARCHIVE_ENDPOINT" > /dev/null
}


wait_until() {
    attempt_counter=0
    max_attempts=${2:-30}
    until eval "$1"; do
        if [ "${attempt_counter}" = "${max_attempts}" ];then
            echo "Max attempts reached"
            exit 1
        fi
        attempt_counter=$((attempt_counter+1))
        sleep 2
    done
}


if [ -n "$ARCHIVE_ENDPOINT" ]; then
  echo "Waiting for gateway"
  wait_until "gateway_ready"
fi


rm -rf db src/types src/model/generated
make codegen || exit 1

npx squid-substrate-metadata-explorer \
		--chain "$CHAIN_ENDPOINT" \
		--out chainVersions.json || exit 1

make typegen || exit 1
npm run build || exit 1
make migration || exit 1
make migrate || exit 1


terminate() {
    trap '' INT TERM
    # shellcheck disable=SC2046
    kill -TERM $(jobs -p) 2>/dev/null
}

trap terminate TERM INT

node -r dotenv/config lib/process.js &
npx squid-graphql-server &
wait
