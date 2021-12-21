#!/bin/sh

./node_modules/.bin/mocha --delay --exit -r lib/setup.js --timeout 80000 lib/*.test.js
