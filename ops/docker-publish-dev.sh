#!/bin/bash

custom_tag=$1
images=("${@:2}")

function publish() {
    pkg_path=$1
    if [ -n "$2" ]
    then
       img=$2
    else
       img="$(basename "$pkg_path")"
    fi

    tags="-t subsquid/$img:$custom_tag"

    docker buildx build . --platform "linux/amd64,linux/arm64" \
        --push \
        --target "$img" \
        --label "org.opencontainers.image.url=https://github.com/subsquid/squid-sdk/tree/$(git rev-parse HEAD)/${pkg_path}" \
        $tags || exit 1
}

all_images=(
    "solana/solana-dump"
    "solana/solana-ingest"
    "solana/solana-data-service"
    "tron/tron-dump"
    "tron/tron-ingest"
    "substrate/substrate-dump"
    "substrate/substrate-ingest"
    "substrate/substrate-metadata-service"
    "fuel/fuel-dump"
    "fuel/fuel-ingest"
    "evm/evm-dump"
    "evm/evm-ingest"
    "evm/evm-data-service"
    "hyperliquid/hyperliquid-fills-ingest"
    "hyperliquid/hyperliquid-fills-data-service"
)

if [ ${#images[@]} -eq 0 ]; then
    images=("${all_images[@]}")
fi

for image in "${images[@]}"; do
    echo "Publishing $image..."
    if [ "$image" = "solana/solana-data-service" ]; then
        publish "$image" "solana-hotblocks-service" || exit 1
    elif [ "$image" = "evm/evm-data-service" ]; then
        publish "$image" "evm-hotblocks-service" || exit 1
    elif [ "$image" = "hyperliquid/hyperliquid-fills-data-service" ]; then
        publish "$image" "hyperliquid-fills-hotblocks-service" || exit 1
    else
        publish "$image" || exit 1
    fi
done

#git push origin "HEAD:release/${release}" --follow-tags --verbose