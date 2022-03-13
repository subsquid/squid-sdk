#!/bin/bash

rm -rf src || exit 1

for chain in polkadot kusama khala altair astar shiden crust statemine statemint subsocial hydradx; do
  echo -n "gen $chain: "
  npx squid-substrate-typegen "config/$chain.json" || exit 1
  echo ok
done

echo -n "type check: "
npx tsc --noEmit || exit 1
echo ok
