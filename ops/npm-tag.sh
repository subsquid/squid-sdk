#!/bin/bash

tag="$1"

# First run test package discovery that will print garbage to stdout anyway
node common/scripts/install-run-rush.js -q list || exit 1

# Then run real package discovery
packages=$(node common/scripts/install-run-rush.js -q list --json \
    | jq '.projects[] | select(.versionPolicyName == "npm") | (.name + "@" + .version)' -r) || exit 1

for pkg in $packages; do
    npm dist-tag add "$pkg" "$tag" || exit 1
done
