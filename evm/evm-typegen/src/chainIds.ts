import {closest} from 'fastest-levenshtein'
import * as validator from '@subsquid/util-internal-commander'
import {InvalidOptionArgumentError} from 'commander'

// ref: https://docs.etherscan.io/supported-chains
export const CHAIN_IDS: Record<string, number> = {
    // Ethereum Mainnet
    'ethereum-mainnet': 1,
    'mainnet': 1,
    'ethereum': 1,
    'eth': 1,

    // Sepolia Testnet
    'sepolia-testnet': 11155111,
    'sepolia': 11155111,

    // Holesky Testnet
    'holesky-testnet': 17000,
    'holesky': 17000,

    // Hoodi Testnet
    'hoodi-testnet': 560048,
    'hoodi': 560048,

    // BNB Smart Chain Mainnet
    'bnb-smart-chain-mainnet': 56,
    'bsc': 56,
    'bnb': 56,

    // BNB Smart Chain Testnet
    'bnb-smart-chain-testnet': 97,
    'bsc-testnet': 97,

    // Polygon Mainnet
    'polygon-mainnet': 137,
    'polygon': 137,
    'matic': 137,

    // Polygon Amoy Testnet
    'polygon-amoy-testnet': 80002,
    'amoy': 80002,
    'polygon-amoy': 80002,

    // Base Mainnet
    'base-mainnet': 8453,
    'base': 8453,

    // Base Sepolia Testnet
    'base-sepolia-testnet': 84532,
    'base-sepolia': 84532,

    // Arbitrum One Mainnet
    'arbitrum-one-mainnet': 42161,
    'arbitrum': 42161,
    'arb': 42161,
    'arbitrum-one': 42161,

    // Arbitrum Nova Mainnet
    'arbitrum-nova-mainnet': 42170,
    'arbitrum-nova': 42170,
    'nova': 42170,

    // Arbitrum Sepolia Testnet
    'arbitrum-sepolia-testnet': 421614,
    'arbitrum-sepolia': 421614,
    'arb-sepolia': 421614,

    // Linea Mainnet
    'linea-mainnet': 59144,
    'linea': 59144,

    // Linea Sepolia Testnet
    'linea-sepolia-testnet': 59141,
    'linea-sepolia': 59141,

    // Blast Mainnet
    'blast-mainnet': 81457,
    'blast': 81457,

    // Blast Sepolia Testnet
    'blast-sepolia-testnet': 168587773,
    'blast-sepolia': 168587773,

    // OP Mainnet
    'op-mainnet': 10,
    'optimism': 10,
    'op': 10,

    // OP Sepolia Testnet
    'op-sepolia-testnet': 11155420,
    'op-sepolia': 11155420,
    'optimism-sepolia': 11155420,

    // Avalanche C-Chain
    'avalanche-c-chain': 43114,
    'avalanche': 43114,
    'avax': 43114,

    // Avalanche Fuji Testnet
    'avalanche-fuji-testnet': 43113,
    'fuji': 43113,
    'avalanche-fuji': 43113,

    // BitTorrent Chain Mainnet
    'bittorrent-chain-mainnet': 199,
    'bittorrent': 199,
    'btt': 199,

    // BitTorrent Chain Testnet
    'bittorrent-chain-testnet': 1029,
    'bittorrent-testnet': 1029,
    'btt-testnet': 1029,

    // Celo Mainnet
    'celo-mainnet': 42220,
    'celo': 42220,

    // Celo Sepolia Testnet
    'celo-sepolia-testnet': 11142220,
    'celo-sepolia': 11142220,

    // Fraxtal Mainnet
    'fraxtal-mainnet': 252,
    'fraxtal': 252,

    // Fraxtal Hoodi Testnet
    'fraxtal-hoodi-testnet': 2523,
    'fraxtal-hoodi': 2523,

    // Gnosis
    'gnosis': 100,
    'gno': 100,
    'xdai': 100,

    // Mantle Mainnet
    'mantle-mainnet': 5000,
    'mantle': 5000,

    // Mantle Sepolia Testnet
    'mantle-sepolia-testnet': 5003,
    'mantle-sepolia': 5003,

    // Memecore Mainnet
    'memecore-mainnet': 4352,
    'memecore': 4352,

    // Memecore Testnet
    'memecore-testnet': 43521,

    // Moonbeam Mainnet
    'moonbeam-mainnet': 1284,
    'moonbeam': 1284,

    // Moonriver Mainnet
    'moonriver-mainnet': 1285,
    'moonriver': 1285,

    // Moonbase Alpha Testnet
    'moonbase-alpha-testnet': 1287,
    'moonbase': 1287,
    'moonbase-alpha': 1287,

    // opBNB Mainnet
    'opbnb-mainnet': 204,
    'opbnb': 204,

    // opBNB Testnet
    'opbnb-testnet': 5611,

    // Scroll Mainnet
    'scroll-mainnet': 534352,
    'scroll': 534352,

    // Scroll Sepolia Testnet
    'scroll-sepolia-testnet': 534351,
    'scroll-sepolia': 534351,

    // Taiko Mainnet
    'taiko-mainnet': 167000,
    'taiko': 167000,

    // Taiko Hoodi
    'taiko-hoodi': 167013,

    // XDC Mainnet
    'xdc-mainnet': 50,
    'xdc': 50,

    // XDC Apothem Testnet
    'xdc-apothem-testnet': 51,
    'xdc-apothem': 51,
    'apothem': 51,

    // ApeChain Mainnet
    'apechain-mainnet': 33139,
    'apechain': 33139,
    'ape': 33139,

    // ApeChain Curtis Testnet
    'apechain-curtis-testnet': 33111,
    'apechain-curtis': 33111,
    'curtis': 33111,

    // World Mainnet
    'world-mainnet': 480,
    'world': 480,

    // World Sepolia Testnet
    'world-sepolia-testnet': 4801,
    'world-sepolia': 4801,

    // Sonic Mainnet
    'sonic-mainnet': 146,
    'sonic': 146,

    // Sonic Testnet
    'sonic-testnet': 14601,

    // Unichain Mainnet
    'unichain-mainnet': 130,
    'unichain': 130,

    // Unichain Sepolia Testnet
    'unichain-sepolia-testnet': 1301,
    'unichain-sepolia': 1301,

    // Abstract Mainnet
    'abstract-mainnet': 2741,
    'abstract': 2741,

    // Abstract Sepolia Testnet
    'abstract-sepolia-testnet': 11124,
    'abstract-sepolia': 11124,

    // Berachain Mainnet
    'berachain-mainnet': 80094,
    'berachain': 80094,
    'bera': 80094,

    // Berachain Bepolia Testnet
    'berachain-bepolia-testnet': 80069,
    'berachain-bepolia': 80069,
    'bepolia': 80069,

    // Swellchain Mainnet
    'swellchain-mainnet': 1923,
    'swellchain': 1923,
    'swell': 1923,

    // Swellchain Testnet
    'swellchain-testnet': 1924,
    'swell-testnet': 1924,

    // Monad Mainnet
    'monad-mainnet': 143,
    'monad': 143,

    // Monad Testnet
    'monad-testnet': 10143,

    // HyperEVM Mainnet
    'hyperevm-mainnet': 999,
    'hyperevm': 999,

    // Katana Mainnet
    'katana-mainnet': 747474,
    'katana': 747474,

    // Katana Bokuto
    'katana-bokuto': 737373,
    'bokuto': 737373,

    // Sei Mainnet
    'sei-mainnet': 1329,
    'sei': 1329,

    // Sei Testnet
    'sei-testnet': 1328,

    // Stable Mainnet
    'stable-mainnet': 988,
    'stable': 988,

    // Stable Testnet
    'stable-testnet': 2201,

    // Plasma Mainnet
    'plasma-mainnet': 9745,
    'plasma': 9745,

    // Plasma Testnet
    'plasma-testnet': 9746,
}

export function chainIdOption(chainId?: string): number {
    if (chainId == null) {
        return 1
    }

    // @ts-expect-error - chainId is a string
    if (!isNaN(chainId)) {
        return validator.positiveInt(chainId)
    }

    if (chainId in CHAIN_IDS) {
        return CHAIN_IDS[chainId]
    }

    const suggestion = closest(chainId, Object.keys(CHAIN_IDS))
    throw new InvalidOptionArgumentError(
        `Unknown chain: "${chainId}". Did you mean "${suggestion}"? Alternatively, provide a numeric chain ID.`
    )
}