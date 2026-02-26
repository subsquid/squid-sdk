import { GetBlock, Receipt } from '../../src/rpc-data'
import * as fs from 'fs'
import * as Path from 'path'


const FIXTURES_DIR = Path.resolve(__dirname, '../fixtures')


const CHAIN_IDS: Record<string, string> = {
    ethereum: '0x1',
    polygon: '0x89',
    arbitrum: '0xa4b1',
    hyperliquid: '0x3e7',
}


export function getChainId(chain: string): string {
    const id = CHAIN_IDS[chain]
    if (!id) throw new Error(`unknown chain: ${chain}`)
    return id
}


export interface FixtureMetadata {
    chain: string
    blockNumber: number
    name: string
}


export function loadBlock(chain: string, blockNumber: number): GetBlock {
    const path = Path.join(FIXTURES_DIR, chain, blockNumber.toString(), 'block.json')
    if (!fs.existsSync(path)) {
        throw new Error(`Fixture not found: ${path}`)
    }
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}


export function loadReceipts(chain: string, blockNumber: number): Receipt[] {
    const path = Path.join(FIXTURES_DIR, chain, blockNumber.toString(), 'receipts.json')
    if (!fs.existsSync(path)) {
        throw new Error(`Fixture not found: ${path}`)
    }
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}


export function hasReceipts(chain: string, blockNumber: number): boolean {
    const path = Path.join(FIXTURES_DIR, chain, blockNumber.toString(), 'receipts.json')
    return fs.existsSync(path)
}


export function* listFixtures(): Iterable<FixtureMetadata> {
    if (!fs.existsSync(FIXTURES_DIR)) {
        return
    }

    for (const chain of fs.readdirSync(FIXTURES_DIR)) {
        const chainPath = Path.join(FIXTURES_DIR, chain)
        if (!fs.statSync(chainPath).isDirectory()) {
            continue
        }

        for (const blockNum of fs.readdirSync(chainPath)) {
            const blockPath = Path.join(chainPath, blockNum)
            if (!fs.statSync(blockPath).isDirectory()) {
                continue
            }

            const blockJsonPath = Path.join(blockPath, 'block.json')
            if (fs.existsSync(blockJsonPath)) {
                yield {
                    chain,
                    blockNumber: parseInt(blockNum),
                    name: `${chain}-${blockNum}`
                }
            }
        }
    }
}
