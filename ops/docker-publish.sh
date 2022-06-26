#!/bin/bash

release=$1
tag=$2

function publish() {
    pkg_path=$1
    img="$(basename "$pkg_path")"
    pkg_name="$(node ops/pkg-name.js "$pkg_path")"
    pkg_version="$(node ops/pkg-version.js "$pkg_path")" || exit 1
    major=$(echo "$pkg_version" | cut -d '.' -f1) || exit 1

    git tag -a "${pkg_name}_v${pkg_version}" -m "${pkg_name} v${pkg_version}" --force

    docker buildx build . --platform "linux/amd64,linux/arm64" \
        --push \
        --target "$img" \
        --label "org.opencontainers.image.url=https://github.com/subsquid/squid/tree/$(git rev-parse HEAD)/${pkg_path}" \
        -t "subsquid/$img:$pkg_version" \
        -t "subsquid/$img:$major" \
        -t "subsquid/$img:$tag" \
        -t "subsquid/$img:$release" || exit 1
}

publish substrate-ingest || exit 1
publish substrate-explorer || exit 1
publish util/chain-status-service || exit 1

git push origin "HEAD:release/${release}" --follow-tags --verbose
