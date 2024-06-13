import * as fs from 'fs'
import path from 'path'
import {InvalidArgumentError, program} from 'commander'
import {createLogger} from '@subsquid/logger'
import {runProgram, wait} from '@subsquid/util-internal'
import {OutDir} from '@subsquid/util-internal-code-printer'
import * as validator from '@subsquid/util-internal-commander'
import {Typegen} from './typegen'
import {fromAnchor} from './program/anchor'
import {fetchIdl, GET} from './util/fetch'
import {RpcClient} from '@subsquid/rpc-client'
import {address, Address, isAddress} from '@solana/addresses'
import { getProgramIdl } from "@solanafm/explorer-kit-idls";

const LOG = createLogger('sqd:solana-typegen')

runProgram(
    async function () {
        program
            .description(
                `
Generates TypeScript facades for solana.

The generated facades are assumed to be used by "squids" indexing solana data.
    `.trim()
            )
            .name('squid-solana-typegen')
            .argument('<output-dir>', 'output directory for generated definitions')
            .argument('[idl...]', 'Anchor IDL file', specArgument)
            .option(
                '--solana-rpc-endpoint <url>',
                'Solana RPC endpoint to fetch program IDL by a known address',
                validator.Url(['http:', 'https:', 'ws:', 'wss:'])
            )
            .option('--clean', 'delete output directory before run')

        program.parse()

        let opts = program.opts() as {
            clean?: boolean
            solanaRpcEndpoint?: string
        }
        let dest = new OutDir(program.processedArgs[0])
        let specs = program.processedArgs[1] as Spec[]

        if (opts.clean && dest.exists()) {
            LOG.info(`deleting ${dest.path()}`)
            dest.del()
        }

        if (specs.length == 0) {
            LOG.warn('no IDL files given, nothing to generate')
            return
        }

        dest.add('abi.support.ts', [__dirname, '../src/abi.support.ts'])
        LOG.info(`saved ${dest.path('abi.support.ts')}`)

        for (let spec of specs) {
            LOG.info(`processing ${spec.src}`)
            let idlRaw = await read(spec, opts)
            let idl = fromAnchor(idlRaw)

            if (spec.kind === 'address' && idl.programId == null) {
                idl.programId = spec.src
            }

            new Typegen(dest, idl, spec.name, LOG).generate()
        }
    },
    (err) => LOG.fatal(err)
)

async function read(spec: Spec, options?: {solanaRpcEndpoint?: string}): Promise<any> {
    if (spec.kind == 'address') {
        try {
            LOG.info(`fetching idl from blockchain for ${spec.src}`)
            return await fetchFromBlockchain(address(spec.src), options?.solanaRpcEndpoint)
          } catch (e: unknown) {
            LOG.info(`fetching idl from explorer for ${spec.src}`)
            return await fetchIdlFromExplorer(address(spec.src));
          }
    } else if (spec.kind == 'url') {
        return await GET(spec.src)
    } else {
        return JSON.parse(fs.readFileSync(spec.src, 'utf-8'))
    }
}

async function fetchIdlFromExplorer(address: Address): Promise<any> {
    try {
      let response = await getProgramIdl(address);
      if (response) return response.idl
    } catch (e: unknown) {
      throw new Error( `Failed to fetch program IDL from Solana Explorer: ${e instanceof Error ? e.message : e}`)
    }
  }


async function fetchFromBlockchain(address: Address, url?: string): Promise<any> {
    url = url || 'https://api.mainnet-beta.solana.com'

    try {
        let client = new RpcClient({url})
        return await fetchIdl(client, address)
    } catch (e: unknown) {
        throw new Error(`Failed to fetch program IDL from ${url}: ${e instanceof Error ? e.message : e}`)
    }
}

interface Spec {
    kind: 'address' | 'url' | 'file'
    src: string
    name: string
}

function specArgument(value: string, prev?: Spec[]): Spec[] {
    let spec = parseSpec(value)
    prev = prev || []
    prev.push(spec)
    return prev
}

function parseSpec(spec: string): Spec {
    let [src, fragment] = splitFragment(spec)
    if (isAddress(src)) {
        return {
            kind: 'address',
            src,
            name: fragment || src,
        }
    } else if (src.includes('://')) {
        let u = new URL(validator.Url(['http:', 'https:'])(src))
        return {
            kind: 'url',
            src,
            name: fragment || basename(u.pathname),
        }
    } else {
        return {
            kind: 'file',
            src,
            name: fragment || basename(src),
        }
    }
}

function splitFragment(spec: string): [string, string] {
    let parts = spec.split('#')
    if (parts.length > 1) {
        let fragment = parts.pop()!
        return [parts.join('#'), fragment]
    } else {
        return [spec, '']
    }
}

function basename(file: string): string {
    let name = path.parse(file).name
    if (name) return name
    throw new InvalidArgumentError(`Can't derive target basename for output files. Use url fragment to specify it`)
}
