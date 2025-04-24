#!/bin/bash

release=$1
tag=$2
custom_tag=$3
images=("${@:4}")

function publish() {
    pkg_path=$1
    img="$(basename "$pkg_path")"
    pkg_name="$(node ops/pkg-name.js "$pkg_path")"
    pkg_version="$(node ops/pkg-version.js "$pkg_path")" || exit 1
    major=$(echo "$pkg_version" | cut -d '.' -f1) || exit 1

    git tag -a "${pkg_name}_v${pkg_version}" -m "${pkg_name} v${pkg_version}" --force

    tags="-t subsquid/$img:$pkg_version -t subsquid/$img:$major -t subsquid/$img:$tag -t subsquid/$img:$release"
    
    if [ -n "$custom_tag" ]; then
        tags="$tags -t subsquid/$img:$custom_tag"
    fi

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
