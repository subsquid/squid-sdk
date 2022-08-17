#!/bin/bash

tag="$1"

packages=$(node common/scripts/install-run-rush.js -q list --json \
    | jq '.projects[] | select(.versionPolicyName == "npm") | (.name + "@" + .version)' -r)

for pkg in $packages; do
    npm dist-tag add "$pkg" "$tag"
done
