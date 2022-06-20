#!/bin/bash

release=$1
tag=$2

function publish() {
    pkg=$1
    # TODO: replace version script with something less demanding
    version="$(node ops/workspace/lib/docker-pkg-version.js "$pkg")"
    major=$(echo "$version" | cut -d '.' -f1)
    echo buildx build . --platform "linux/amd64,linux/arm64" \
        --push \
        --target "$pkg" \
        -t "subsquid/$pkg:$version" \
        -t "subsquid/$pkg:$major" \
        -t "subsquid/$pkg:$tag" \
        -t "subsquid/$pkg:$release"
}

publish substrate-ingest || exit 1
publish chain-status-service || exit 1
