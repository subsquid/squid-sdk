#!/bin/bash

# Combines per-platform images into multi-arch manifest lists.
# Used after parallel native builds on amd64 + arm64 runners.

set -euo pipefail

release=$1
tag=$2
pkg_path=$3
img=$4

function merge() {
    local pkg_path=$1
    local img
    if [ -n "${2:-}" ]; then
        img=$2
    else
        img="$(basename "$pkg_path")"
    fi
    local pkg_version="$(node ops/pkg-version.js "$pkg_path")" || exit 1
    local major=$(echo "$pkg_version" | cut -d '.' -f1) || exit 1

    for t in "$pkg_version" "$major" "$tag" "$release"; do
        echo "Creating manifest subsquid/$img:$t"
        docker buildx imagetools create \
            -t "subsquid/$img:$t" \
            "subsquid/$img:${t}-amd64" \
            "subsquid/$img:${t}-arm64" || exit 1
    done
}

merge "$pkg_path" "$img" || exit 1
