#!/bin/bash

release=$1
tag=$2

function publish() {
    pkg_path=$1
    pkg_name="$(basename "$pkg_path")"
    pkg_version="$(node ops/pkg-version.js "$pkg_path")" || exit 1
    major=$(echo "$pkg_version" | cut -d '.' -f1) || exit 1
    docker buildx build . --platform "linux/amd64,linux/arm64" \
        --push \
        --target "$pkg_name" \
        -t "subsquid/$pkg_name:$pkg_version" \
        -t "subsquid/$pkg_name:$major" \
        -t "subsquid/$pkg_name:$tag" \
        -t "subsquid/$pkg_name:$release"
}

publish substrate-ingest || exit 1
publish substrate-explorer || exit 1
publish util/chain-status-service || exit 1
