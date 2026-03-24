#!/bin/bash

set -euo pipefail

pkg_path=$1
img="${2:-$(basename "$pkg_path")}"

platform="${PLATFORM:-linux/amd64}"

cache_args=""
if [ -n "${BUILDX_CACHE_FROM:-}" ]; then
    cache_args+="--cache-from ${BUILDX_CACHE_FROM} "
fi
if [ -n "${BUILDX_CACHE_TO:-}" ]; then
    cache_args+="--cache-to ${BUILDX_CACHE_TO} "
fi

docker buildx build . --platform "$platform" \
    --target "$img" \
    --label "org.opencontainers.image.url=https://github.com/subsquid/squid-sdk/tree/$(git rev-parse HEAD)/${pkg_path}" \
    --output "type=image,name=docker.io/subsquid/$img,push-by-digest=true,name-canonical=true,push=true" \
    --metadata-file /tmp/metadata.json \
    $cache_args || exit 1

digest=$(jq -r '."containerimage.digest"' /tmp/metadata.json)
mkdir -p "/tmp/digests/$img"
touch "/tmp/digests/$img/${digest#sha256:}"

echo "Built $img for $platform: $digest"
