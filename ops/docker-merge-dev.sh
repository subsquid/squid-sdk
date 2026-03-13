#!/bin/bash

# Combines per-platform dev images into multi-arch manifest lists.
# Used after parallel native builds on amd64 + arm64 runners.

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

function docker_target() {
    local base="$(basename "$1")"
    case "$base" in
        solana-data-service) echo "solana-hotblocks-service" ;;
        *) echo "$base" ;;
    esac
}

if [ ${#images[@]} -eq 0 ]; then
    images=("${all_images[@]}")
fi

for image in "${images[@]}"; do
    img="$(docker_target "$image")"

    tags=("$custom_tag")
    if [ "$tag_latest" = "true" ]; then
        tags+=("latest")
    fi

    for t in "${tags[@]}"; do
        echo "Creating manifest subsquid/$img:$t"
        docker buildx imagetools create \
            -t "subsquid/$img:$t" \
            "subsquid/$img:${t}-amd64" \
            "subsquid/$img:${t}-arm64" || exit 1
    done
done
