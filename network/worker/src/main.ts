import {runProgram} from '@subsquid/util-internal'
import {Client} from './chain/client'
import {ALICE} from './chain/testing'


runProgram(async () => {
    let client = new Client({url: 'ws://localhost:9944'})

    let hash = await client.send({
        call: {__kind: 'Worker.register'},
        author: ALICE
    })

    console.log(hash)
})
