#!/bin/bash

cd "$1" || exit 1

rpc=$(node -p "require('./info.json').chain" || exit 1)
archive=$(node -p "require('./info.json').archive" || exit 1)

npx squid-substrate-metadata-explorer \
		--chain "$rpc" \
		--archive "$archive" \
		--out versions.json
