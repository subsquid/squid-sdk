#!/bin/bash

set -euo pipefail

release=$1
tag=$2
pkg_path=$3
img="${4:-$(basename "$pkg_path")}"

pkg_name="$(node ops/pkg-name.js "$pkg_path")"
pkg_version="$(node ops/pkg-version.js "$pkg_path")" || exit 1
major=$(echo "$pkg_version" | cut -d '.' -f1) || exit 1

git tag -a "${pkg_name}_v${pkg_version}" -m "${pkg_name} v${pkg_version}" --force

digests_dir="/tmp/digests/$img"
sources=$(printf "docker.io/subsquid/$img@sha256:%s " $(ls "$digests_dir"))

docker buildx imagetools create \
    -t "subsquid/$img:$pkg_version" \
    -t "subsquid/$img:$major" \
    -t "subsquid/$img:$tag" \
    -t "subsquid/$img:$release" \
    $sources || exit 1

echo "Published subsquid/$img with tags: $pkg_version $major $tag $release"
docker buildx imagetools inspect "subsquid/$img:$tag"
