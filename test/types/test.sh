#!/bin/bash

rm -rf src || exit 1

for cfg in config/*.json; do
    chain="${cfg##config/}"
    chain="${chain%".json"}"
    echo -n "gen $chain: "
    npx squid-substrate-typegen "$cfg" || exit 1
    echo ok
done

echo -n "type check: "
npx tsc --noEmit || exit 1
echo ok
