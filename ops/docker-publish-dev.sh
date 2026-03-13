#!/bin/bash

set -euo pipefail

custom_tag=$1
tag_latest=$2
images=("${@:3}")

platform="${PLATFORM:-linux/amd64}"

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

commit_sha=$(git rev-parse HEAD)
bake_targets=()
bake_json='{"target":{'
first=true

for image in "${images[@]}"; do
    img="$(docker_target "$image")"

    tags_json="[\"subsquid/$img:$custom_tag\""
    if [ "$tag_latest" = "true" ]; then
        tags_json+=",\"subsquid/$img:latest\""
    fi
    tags_json+="]"

    label="org.opencontainers.image.url=https://github.com/subsquid/squid-sdk/tree/${commit_sha}/${image}"

    if [ "$first" = true ]; then
        first=false
    else
        bake_json+=','
    fi

    bake_json+="\"$img\":{\"tags\":$tags_json,\"labels\":{\"org.opencontainers.image.url\":\"$label\"}}"
    bake_targets+=("$img")
done

bake_json+='}}'

override_file=$(mktemp)
echo "$bake_json" > "$override_file"

echo "Building targets: ${bake_targets[*]}"

cache_args=""
if [ -n "${BUILDX_CACHE_FROM:-}" ]; then
    cache_args+=" --set *.cache-from=${BUILDX_CACHE_FROM}"
fi
if [ -n "${BUILDX_CACHE_TO:-}" ]; then
    cache_args+=" --set *.cache-to=${BUILDX_CACHE_TO}"
fi

docker buildx bake \
    -f docker-bake.hcl \
    -f "$override_file" \
    --push \
    --set "*.platform=$platform" \
    $cache_args \
    "${bake_targets[@]}" || exit 1

rm -f "$override_file"
