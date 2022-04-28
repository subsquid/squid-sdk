#!/bin/bash

trap 'terminate' EXIT; terminate() {
   # shellcheck disable=SC2046
   kill -TERM $(jobs -p) 2>/dev/null
   wait
}

make archive &
make process &
make serve &

# wait -n is not supported everywhere
while true; do
    pids=( $(jobs -p) )
    if [ "${#pids[@]}" == 3 ]; then
        sleep 1
    else
        break
    fi
done
