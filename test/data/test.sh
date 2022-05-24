#!/bin/bash


function run-test() {
    chain="$1"
    cmd="$2"
    shift
    shift
    echo -n "$cmd : "
    for f in "$@"; do
        if [ ! -f "chain/$chain/$f" ]; then
            echo skip
            return
        fi
    done
    cmd="${cmd##*( )}"
    node lib/main.js "$chain" "$cmd" || exit 1
    echo ok
}


for loc in chain/*; do
    chain="${loc##chain/}"
    echo "$chain" | tr a-z A-Z
    run-test "$chain" "test-events-scale-encoding-decoding" events.jsonl
    run-test "$chain" "test-extrinsics-scale-encoding-decoding" blocks.jsonl
    echo
done
