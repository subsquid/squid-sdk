#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )" && cd ../.. || exit 1

rm -rf common/deploy || exit 1

node common/scripts/install-run-rush.js deploy --project e2e-test-suite || exit 1

cd common/deploy/test/e2e-project || exit 1
cp .env ../e2e-suite/.env || exit 1
ls -a

make init || exit 1

set -m

make archive &
ARCHIVE_PID=$!
make process &
make serve &


trap 'terminate' EXIT; terminate() {
    # shellcheck disable=SC2046
    kill -- -$ARCHIVE_PID
    kill $(jobs -p)
    wait
    make down
}

(cd ../e2e-suite && make test) || exit 1
