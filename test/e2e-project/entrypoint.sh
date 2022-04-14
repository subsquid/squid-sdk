#!/bin/sh

if [ -f .env ]; then
    set -o allexport
    . .env
    set +o allexport
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

npx squid-substrate-archive -e "$CHAIN_ENDPOINT" --out "$ARCHIVE_DB_URL" --types-bundle typesBundle.json &
node lib/process.js &
npx squid-graphql-server &
wait
