#!/bin/bash

rm -rf src || exit 1

for chain in acala altair astar basilisk bifrost calamari clover crust darwinia heiko hydradx karura khala kilt kintsugi kusama parallel pioneer polkadot quartz shiden statemine statemint subsocial; do
  echo -n "gen $chain: "
  npx squid-substrate-typegen "config/$chain.json" || exit 1
  echo ok
done

echo -n "type check: "
npx tsc --noEmit || exit 1
echo ok
