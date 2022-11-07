#!/bin/bash

rm -rf gen || exit 1

for cfg in config/*.json; do
    chain="${cfg##config/}"
    chain="${chain%".json"}"
    echo -n "gen $chain: "
    npx squid-substrate-typegen "$cfg" || exit 1
    echo ok
done

for cfg in config/*.json; do
    chain="${cfg##config/}"
    chain="${chain%".json"}"
    echo -n "type check $chain: "
    (cd "gen/$chain" && cp ../../tsconfig.json . && npx tsc) || exit 1
    echo ok
done
