import * as fs from 'fs'
import path from 'path'
import { InvalidArgumentError, InvalidOptionArgumentError, program } from 'commander'
import { createLogger } from '@subsquid/logger'
import { runProgram, wait } from '@subsquid/util-internal'
import * as validator from '@subsquid/util-internal-commander'
import { Typegen } from './typegen'
import { GET } from './util/fetch'
import { OutDir } from '@subsquid/util-internal-code-printer'
import {chainIdOption} from './chainIds'

const LOG = createLogger('sqd:evm-typegen')
const PROXY_ETHERSCAN = 'https://cloud.sqd.dev/chains/api/v1/evm/abi'
const ORIGIN_ETHERSCAN = 'https://api.etherscan.io/v2/api'

runProgram(
  async function () {
    program
      .description(
        `
Generates TypeScript facades for EVM transactions, logs and eth_call queries.

The generated facades are assumed to be used by "squids" indexing EVM data.
    `.trim(),
      )
      .name('squid-evm-typegen')
      .argument('<output-dir>', 'output directory for generated definitions')
      .argument('[abi...]', 'ABI file', specArgument)
      .option('--multicall', 'generate facade for MakerDAO multicall contract')
      .option(
        '--etherscan-api <url>',
        'etherscan API to fetch contract ABI by a known address\n(if no API token is provided, the default value equals to SQD Proxy service, otherwise equals to Etherscan API)', 
        validator.Url(['http:', 'https:']),
      )
      .option('--etherscan-api-key <key>', 'etherscan API key')
      .option(
        '--chain-id <id>',
        'chain ID (numeric or named, e.g., "1" or "ethereum") to fetch the contract from',
        chainIdOption,
        1,
      )
      .option(
        '--etherscan-chain-id <id>',
        'DEPRECATED: use --chain-id instead. Chain ID (numeric or named, e.g., "1" or "ethereum") to fetch the contract from',
        chainIdOption,
      )
      .option('--clean', 'delete output directory before run')
      .addHelpText(
        'afterAll',
        `
ABI file can be specified in three ways:

1. as a plain JSON file:

squid-evm-typegen src/abi erc20.json

2. as a contract address (to fetch ABI from etherscan)

squid-evm-typegen src/abi 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413

3. as an arbitrary http url

squid-evm-typegen src/abi https://example.com/erc721.json

In all cases typegen will use ABI's basename as a basename of generated files.
You can overwrite basename of generated files using fragment (#) suffix.

squid-evm-typegen src/abi 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413#contract   
        `,
      )

    program.parse()

    let opts = program.opts() as {
      clean?: boolean
      multicall?: boolean
      etherscanApi?: string
      etherscanApiKey?: string
      chainId?: number
      etherscanChainId?: number
    }
    let dest = new OutDir(program.processedArgs[0])
    let specs = program.processedArgs[1] as Spec[]

    if (opts.etherscanChainId) { 
      LOG.warn('Option --etherscan-chain-id is deprecated. Please use --chain-id instead')
      if (opts.chainId) {
        throw new InvalidOptionArgumentError('Option --chain-id and --etherscan-chain-id cannot be used together')
      }
      opts.chainId = opts.etherscanChainId
      delete opts.etherscanChainId
    }

    if (opts.clean && dest.exists()) {
      LOG.info(`deleting ${dest.path()}`)
      dest.del()
    }

    if (specs.length == 0 && !opts.multicall) {
      LOG.warn('no ABI files given, nothing to generate')
      return
    }

    if (opts.multicall) {
      dest.add('multicall.ts', [__dirname, '../src/multicall.ts'])
      LOG.info(`saved ${dest.path('multicall.ts')}`)
    }

    for (let spec of specs) {
      LOG.info(`processing ${spec.src}`)
      let abi_json = await read(spec, opts)
      await new Typegen(dest, abi_json, spec.name, LOG).generate()
    }
  },
  (err) => LOG.fatal(err),
)

async function read(
  spec: Spec,
  options: {
    etherscanApi?: string;
    chainId?: number
    etherscanApiKey?: string,
  },
): Promise<any> {
  if (spec.kind == 'address') {
    return fetchFromEtherscan(spec.src, getEtherscanAPIConfig(options))
  }
  let abi: any
  if (spec.kind == 'url') {
    abi = await GET(spec.src)
  } else {
    abi = JSON.parse(fs.readFileSync(spec.src, 'utf-8'))
  }
  if (Array.isArray(abi)) {
    return abi
  } else if (Array.isArray(abi?.abi)) {
    return abi.abi
  } else {
    throw new Error('Unrecognized ABI format')
  }
}

async function fetchFromEtherscan(
  address: string,
  config: EtherscanAPIConfig,
): Promise<any> {
  let url = new URL(config.api)

  let params = new URLSearchParams({
    module: 'contract',
    action: 'getabi',
    address,
    chainid: config.chainId.toString(),
  })

  if (config.apiKey) {
    params.set('apiKey', config.apiKey);
  }

  url.search = params.toString()

  let response: { status: string; result: string }
  let attempts = 0
  while (true) {
    response = await GET(url.toString())
    if (
      response.status == '0' &&
      response.result.includes('rate limit') &&
      attempts < 4
    ) {
      attempts += 1
      let timeout = attempts * 2
      LOG.warn(
        `faced rate limit error while trying to fetch contract ABI. Trying again in ${timeout} seconds.`,
      )
      await wait(timeout * 1000)
    } else {
      break
    }
  }
  if (response.status == '1') {
    return JSON.parse(response.result)
  } else {
    throw new Error(
      `Failed to fetch contract ABI from ${config.api}: ${response.result}`,
    )
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

function isAddress(spec: string): boolean {
  return spec.match(/^0x[0-9a-fA-F]{40}$/) !== null
}

function parseSpec(spec: string): Spec {
  let [src, fragment] = splitFragment(spec)
  if (src.startsWith('0x')) {
    if (!isAddress(src))
      throw new InvalidArgumentError('Invalid contract address')
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
  throw new InvalidArgumentError(
    `Can't derive target basename for output files. Use url fragment to specify it, e.g. #erc20`,
  )
}

interface EtherscanAPIConfig {
    api: string
    chainId: number
    apiKey?: string
}

function getEtherscanAPIConfig(options: {
    etherscanApi?: string
    etherscanApiKey?: string
    chainId?: number
}): EtherscanAPIConfig {
    let api: string
    if (options.etherscanApi != null) {
      api = normalizeEtherscanAPIUrl(options.etherscanApi)
    }  else if (options.etherscanApiKey != null) {
      api = ORIGIN_ETHERSCAN
    } else {
      api = PROXY_ETHERSCAN
    }

    return {
        api,
        apiKey: options.etherscanApiKey || undefined,
        chainId: options.chainId ?? 1,
    }
}

function normalizeEtherscanAPIUrl(url: string) {
  if (url.endsWith('/api')) {
    return url
  }

  return url.endsWith('/') ? url + 'api' : url + '/api'
}