#!/usr/bin/env tsx
import * as fs from 'fs'
import * as Path from 'path'


interface CaptureOptions {
    chain: string
    block: number
    rpcUrl: string
    withReceipts?: boolean
    withLogs?: boolean
}


async function captureFixture(options: CaptureOptions) {
    console.log(`Capturing fixture for ${options.chain} block ${options.block}...`)

    async function rpcCall(method: string, params: any[] = []): Promise<any> {
        let res = await fetch(options.rpcUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params})
        })
        let json = await res.json()
        if (json.error) throw new Error(`RPC error: ${json.error.message}`)
        return json.result
    }

    const blockHex = `0x${options.block.toString(16)}`

    // Create fixture directory
    const fixtureDir = Path.join(__dirname, 'fixtures', options.chain, options.block.toString())
    fs.mkdirSync(fixtureDir, {recursive: true})

    // Fetch and save block
    const rawBlock = await rpcCall('eth_getBlockByNumber', [blockHex, true])
    if (!rawBlock) {
        throw new Error(`Block ${options.block} not found`)
    }
    fs.writeFileSync(
        Path.join(fixtureDir, 'block.json'),
        JSON.stringify(rawBlock, null, 2)
    )
    console.log(`✓ Saved block.json`)

    // Fetch and save receipts
    if (options.withReceipts) {
        let receipts: any = null
        try {
            receipts = await rpcCall('eth_getBlockReceipts', [blockHex])
        } catch (error) {
            console.log('eth_getBlockReceipts not available, fetching individually...')
        }

        if (!receipts && rawBlock.transactions?.length > 0) {
            receipts = []
            for (const tx of rawBlock.transactions) {
                const hash = typeof tx === 'string' ? tx : tx.hash
                const receipt = await rpcCall('eth_getTransactionReceipt', [hash])
                if (receipt) receipts.push(receipt)
            }
        }

        if (receipts && receipts.length > 0) {
            fs.writeFileSync(
                Path.join(fixtureDir, 'receipts.json'),
                JSON.stringify(receipts, null, 2)
            )
            console.log(`✓ Saved receipts.json (${receipts.length} receipts)`)

            if (options.withLogs) {
                const logs = receipts.flatMap((r: any) => r.logs || [])
                fs.writeFileSync(
                    Path.join(fixtureDir, 'logs.json'),
                    JSON.stringify(logs, null, 2)
                )
                console.log(`✓ Saved logs.json (${logs.length} logs)`)
            }
        } else {
            console.log('⚠ No receipts found')
        }
    }

    console.log(`\n✅ Fixture captured successfully!`)
    console.log(`   Location: ${fixtureDir}`)
    console.log(`   Next step: git add ${Path.relative(process.cwd(), fixtureDir)}`)
}


import {parseArgs} from 'node:util'

const {values} = parseArgs({
    options: {
        chain: {type: 'string'},
        block: {type: 'string'},
        'rpc-url': {type: 'string'},
        'with-receipts': {type: 'boolean', default: false},
        'with-logs': {type: 'boolean', default: false},
    },
    strict: true,
})

if (!values.chain || !values.block || !values['rpc-url']) {
    console.error('Usage: tsx test/capture-fixtures.ts --chain <name> --block <number> --rpc-url <url> [--with-receipts] [--with-logs]')
    process.exit(1)
}

captureFixture({
    chain: values.chain,
    block: parseInt(values.block),
    rpcUrl: values['rpc-url'],
    withReceipts: values['with-receipts'],
    withLogs: values['with-logs'],
}).catch(error => {
    console.error('Error:', error.message)
    process.exit(1)
})
