#!/bin/bash

packages=$(node common/scripts/install-run-rush.js -q list --json \
    | jq '.projects[] | select(.versionPolicyName == "npm" and (.path | contains("substrate") | not)) | (.name + "@" + .version)' -r)

for pkg in $packages; do
    npm dist-tag add "$pkg" latest
done
