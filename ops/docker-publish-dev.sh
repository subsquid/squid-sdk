#!/bin/bash

custom_tag=$1
images=("${@:2}")

function publish() {
    pkg_path=$1
    img="$(basename "$pkg_path")"

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
    "tron/tron-dump"
    "tron/tron-ingest"
    "substrate/substrate-dump"
    "substrate/substrate-ingest"
    "substrate/substrate-metadata-service"
    "fuel/fuel-dump"
    "fuel/fuel-ingest"
)

if [ ${#images[@]} -eq 0 ]; then
    images=("${all_images[@]}")
fi

for image in "${images[@]}"; do
    echo "Publishing $image..."
    publish "$image" || exit 1
done

#git push origin "HEAD:release/${release}" --follow-tags --verbose