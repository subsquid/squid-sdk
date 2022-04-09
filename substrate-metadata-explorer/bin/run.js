#!/usr/bin/env node

require('../lib/program').run().then(
    () => {
        process.exit(0)
    },
    err => {
        console.error(err)
        process.exit(1)
    }
)
