#!/bin/bash

set -euo pipefail

release=$1
tag=$2
pkg_path=$3
img=$4

# When PLATFORM is set (e.g. "linux/amd64"), build for that platform only
# and append an arch suffix to all tags (e.g. ":1.2.3-amd64").
platform="${PLATFORM:-linux/amd64,linux/arm64}"
platform_suffix=""
if [[ "$platform" != *","* ]]; then
    platform_suffix="-${platform#*/}"
fi

function publish() {
    local pkg_path=$1
    local img
    if [ -n "${2:-}" ]; then
        img=$2
    else
        img="$(basename "$pkg_path")"
    fi
    local pkg_name="$(node ops/pkg-name.js "$pkg_path")"
    local pkg_version="$(node ops/pkg-version.js "$pkg_path")" || exit 1
    local major=$(echo "$pkg_version" | cut -d '.' -f1) || exit 1

    git tag -a "${pkg_name}_v${pkg_version}" -m "${pkg_name} v${pkg_version}" --force

    local cache_args=""
    if [ -n "${BUILDX_CACHE_FROM:-}" ]; then
        cache_args+="--cache-from ${BUILDX_CACHE_FROM} "
    fi
    if [ -n "${BUILDX_CACHE_TO:-}" ]; then
        cache_args+="--cache-to ${BUILDX_CACHE_TO} "
    fi

    docker buildx build . --platform "$platform" \
        --push \
        --target "$img" \
        --label "org.opencontainers.image.url=https://github.com/subsquid/squid-sdk/tree/$(git rev-parse HEAD)/${pkg_path}" \
        -t "subsquid/$img:${pkg_version}${platform_suffix}" \
        -t "subsquid/$img:${major}${platform_suffix}" \
        -t "subsquid/$img:${tag}${platform_suffix}" \
        -t "subsquid/$img:${release}${platform_suffix}" \
        $cache_args || exit 1
}

publish "$pkg_path" "$img" || exit 1
