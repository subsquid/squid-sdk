#!/bin/bash

set -euo pipefail

custom_tag=$1
tag_latest=$2
images=("${@:3}")

all_images=(
    "bitcoin/bitcoin-dump"
    "bitcoin/bitcoin-ingest"
    "bitcoin/bitcoin-data-service"
    "evm/evm-dump"
    "evm/evm-ingest"
    "evm/evm-data-service"
    "solana/solana-dump"
    "solana/solana-ingest"
    "solana/solana-data-service"
    "substrate/substrate-dump"
    "substrate/substrate-ingest"
    "substrate/substrate-metadata-service"
    "tron/tron-dump"
    "tron/tron-ingest"
    "fuel/fuel-dump"
    "fuel/fuel-ingest"
    "hyperliquid/hyperliquid-fills-data-service"
    "hyperliquid/hyperliquid-fills-ingest"
    "hyperliquid/hyperliquid-replica-cmds-ingest"
    "hyperliquid/hyperliquid-replica-cmds-data-service"
)

if [ ${#images[@]} -eq 0 ]; then
    images=("${all_images[@]}")
fi

for image in "${images[@]}"; do
    img="$(basename "$image")"
    digests_dir="/tmp/digests/$img"

    if [ ! -d "$digests_dir" ]; then
        echo "WARNING: No digests found for $img, skipping"
        continue
    fi

    tag_args="-t subsquid/$img:$custom_tag"
    if [ "$tag_latest" = "true" ]; then
        tag_args+=" -t subsquid/$img:latest"
    fi

    sources=$(printf "docker.io/subsquid/$img@sha256:%s " $(ls "$digests_dir"))

    docker buildx imagetools create \
        $tag_args \
        $sources || exit 1

    echo "Published subsquid/$img:$custom_tag"
done
