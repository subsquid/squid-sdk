#!/bin/bash

function run-test() {
  echo -n "$1: "
  node lib/main.js "$@" || exit 1
  echo ok
}

function test-all() {
    for chain in polkadot kusama; do
      run-test "$chain" "$1"
    done
}

echo
echo 'decode(events-by-polka) == decode(events)'
test-all test-events-decoding
echo
