import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import {addErrorContext, assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {createMPT} from '@ethereumjs/mpt'
import {RLP} from '@ethereumjs/rlp'
import {bigIntToUnpaddedBytes, concatBytes, setLengthLeft, hexToBytes, PrefixedHexString} from '@ethereumjs/util'
import {keccak256} from 'ethereum-cryptography/keccak'
import secp256k1 from 'secp256k1'
import {
    Transaction,
    AccessListItem,
    EIP7702AuthorizationItem,
    TempoCall,
    TempoSignatureObject,
    TempoPrimitiveSignature,
    TempoKeychainSignature,
    TempoSignedAuthorization,
    TempoSignedKeyAuthorization,
    TempoTokenLimit,
    TempoCallScope,
    TempoSelectorRule,
    TempoConsensusContext,
    GetBlock,
    Log,
    Receipt,
    Withdrawal,
} from './rpc-data'
import {qty2Int} from './util'
import {Bytes20, Bytes32, Qty} from './types'


export function blockHash(block: GetBlock) {
    let encoded = RLP.encode(ethereumHeaderFields(block))
    return toHex(keccak256(encoded))
}


// Placeholder for an absent optional header field; RLP-encodes to 0x80 (the
// empty byte string), matching coreth's handling of nil optional fields.
const EMPTY_BUFFER = Buffer.alloc(0)


function bigintOrEmpty(value: string | null | undefined): bigint | Buffer {
    return value == null ? EMPTY_BUFFER : BigInt(value)
}


function decodeHexOrEmpty(value: string | null | undefined): Buffer {
    return value == null ? EMPTY_BUFFER : decodeHex(value)
}


function trimTrailingEmpty(fields: any[]) {
    while (fields.length > 0 && fields[fields.length - 1] === EMPTY_BUFFER) {
        fields.pop()
    }
}


/**
 * Block hash for Avalanche C-Chain networks. The header extends the geth
 * layout with `extDataHash` and optional extras:
 * https://github.com/ava-labs/avalanchego/blob/master/vms/saevm/cchain/README.md#block-header-changes
 */
export function avalancheBlockHash(block: GetBlock) {
    let fields: any[] = [
        decodeHex(block.parentHash),
        decodeHex(block.sha3Uncles),
        decodeHex(block.miner),
        decodeHex(block.stateRoot),
        decodeHex(block.transactionsRoot),
        decodeHex(block.receiptsRoot),
        decodeHex(block.logsBloom),
        BigInt(assertNotNull(block.difficulty, 'block.difficulty is missing')),
        BigInt(block.number),
        BigInt(block.gasLimit),
        BigInt(block.gasUsed),
        BigInt(block.timestamp),
        decodeHex(block.extraData),
        decodeHex(assertNotNull(block.mixHash, 'block.mixHash is missing')),
        decodeHex(assertNotNull(block.nonce, 'block.nonce is missing')),
        decodeHex(assertNotNull(block.extDataHash, 'block.extDataHash is missing')),
        // optional fields
        bigintOrEmpty(block.baseFeePerGas),
        bigintOrEmpty(block.extDataGasUsed),
        bigintOrEmpty(block.blockGasCost),
        bigintOrEmpty(block.blobGasUsed),
        bigintOrEmpty(block.excessBlobGas),
        decodeHexOrEmpty(block.parentBeaconBlockRoot),
        bigintOrEmpty(block.timestampMilliseconds),
        bigintOrEmpty(block.minDelayExcess),
        bigintOrEmpty(block.targetExponent),
        bigintOrEmpty(block.minPriceExponent),
        bigintOrEmpty(block.settledHeight),
        bigintOrEmpty(block.settledGasUnix),
        bigintOrEmpty(block.settledGasNumerator),
        bigintOrEmpty(block.settledExcess),
    ]
    trimTrailingEmpty(fields)
    return toHex(keccak256(RLP.encode(fields)))
}


export function extDataHash(block: GetBlock): Bytes32 {
    let extData = decodeHex(assertNotNull(block.blockExtraData, 'block.blockExtraData is missing'))
    return toHex(keccak256(RLP.encode(extData)))
}


/**
 * Encode a TempoConsensusContext for RLP: [epoch, view, parent_view, proposer_bytes]
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/header.rs
 */
function encodeTempoConsensusContext(ctx: TempoConsensusContext) {
    return [
        BigInt(ctx.epoch),
        BigInt(ctx.view),
        BigInt(ctx.parentView),
        decodeHex(ctx.proposer),
    ]
}


/**
 * Compute block hash for Tempo networks.
 *
 * Tempo's TempoHeader wraps the standard Ethereum Header as a nested struct:
 *   rlp([general_gas_limit, shared_gas_limit, timestamp_millis_part, rlp([...standard_header_fields])])
 *
 * The inner Header is RLP-encoded as its own list, producing a nested RLP structure.
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/header.rs
 */
export function tempoBlockHash(block: GetBlock) {
    let fields = [
        BigInt(assertNotNull(block.mainBlockGeneralGasLimit, 'block.mainBlockGeneralGasLimit is missing')),
        BigInt(assertNotNull(block.sharedGasLimit, 'block.sharedGasLimit is missing')),
        BigInt(assertNotNull(block.timestampMillisPart, 'block.timestampMillisPart is missing')),
        ethereumHeaderFields(block),
    ]
    // Trailing optional field: only encoded when present (post-fork blocks)
    // https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/header.rs
    if (block.consensusContext) {
        fields.push(encodeTempoConsensusContext(block.consensusContext))
    }
    let encoded = RLP.encode(fields)
    return toHex(keccak256(encoded))
}


function ethereumHeaderFields(block: GetBlock) {
    let fields: any[] = [
        decodeHex(block.parentHash),
        decodeHex(block.sha3Uncles),
        decodeHex(block.miner),
        decodeHex(block.stateRoot),
        decodeHex(block.transactionsRoot),
        decodeHex(block.receiptsRoot),
        decodeHex(block.logsBloom),
        BigInt(assertNotNull(block.difficulty, 'block.difficuly is missing')),
        BigInt(block.number),
        BigInt(block.gasLimit),
        BigInt(block.gasUsed),
        BigInt(block.timestamp),
        decodeHex(block.extraData),
        decodeHex(assertNotNull(block.mixHash, 'block.mixHash is missing')),
        decodeHex(assertNotNull(block.nonce, 'block.nonce is missing'))
    ]

    // https://eips.ethereum.org/EIPS/eip-1559#block-hash-changing
    if (block.baseFeePerGas) {
        fields.push(BigInt(block.baseFeePerGas))
    }

    // https://eips.ethereum.org/EIPS/eip-4895#new-field-in-the-execution-payload-header-withdrawals-root
    if (block.withdrawalsRoot) {
        fields.push(decodeHex(block.withdrawalsRoot))
    }

    // https://eips.ethereum.org/EIPS/eip-4844#header-extension
    if (block.blobGasUsed && block.excessBlobGas) {
        fields.push(BigInt(block.blobGasUsed))
        fields.push(BigInt(block.excessBlobGas))
    }

    // https://eips.ethereum.org/EIPS/eip-4788#block-structure-and-validity
    if (block.parentBeaconBlockRoot) {
        fields.push(decodeHex(block.parentBeaconBlockRoot))
    }

    // https://eips.ethereum.org/EIPS/eip-7685
    if (block.requestsHash) {
        fields.push(decodeHex(block.requestsHash))
    }

    return fields
}


function decodeAccessList(accessList: AccessListItem[]) {
    return accessList.map(item => {
        let storageKeys = 'storageKeys' in item ? item.storageKeys : item.storage_keys
        return [
            decodeHex(item.address),
            storageKeys.map(key => decodeHex(key))
        ]
    })
}


function decodeAuthorizationList(authorizationList: EIP7702AuthorizationItem[]) {
    return authorizationList.map(item => {
        if ('chain_id' in item) {
            return [
                BigInt(item.chain_id),
                decodeHex(item.address),
                BigInt(item.nonce),
                BigInt(item.signature.odd_y_parity ? 1 : 0),
                BigInt(item.signature.r),
                BigInt(item.signature.s)
            ]
        }

        return [
            BigInt(item.chainId),
            decodeHex(item.address),
            BigInt(item.nonce),
            BigInt(item.yParity),
            BigInt(item.r),
            BigInt(item.s)
        ]
    })
}


function encodeTransaction(tx: Transaction): Buffer {
    if (tx.type == '0x0') {
        return Buffer.from(
            RLP.encode([
                BigInt(tx.nonce),
                BigInt(assertNotNull(tx.gasPrice, 'tx.gasPrice is missing')),
                BigInt(tx.gas),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(assertNotNull(tx.value, 'tx.value is missing')),
                tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
                BigInt(assertNotNull(tx.v, 'tx.v is missing')),
                BigInt(assertNotNull(tx.r, 'tx.r is missing')),
                BigInt(assertNotNull(tx.s, 'tx.s is missing')),
            ])
        )
    } else if (tx.type == '0x1') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.gasPrice, 'tx.gasPrice is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            BigInt(assertNotNull(tx.v, 'tx.v is missing')),
            BigInt(assertNotNull(tx.r, 'tx.r is missing')),
            BigInt(assertNotNull(tx.s, 'tx.s is missing')),
        ])
        return Buffer.concat([Buffer.from([0x01]), Buffer.from(payload)])
    } else if (tx.type == '0x2') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            BigInt(assertNotNull(tx.v, 'tx.v is missing')),
            BigInt(assertNotNull(tx.r, 'tx.r is missing')),
            BigInt(assertNotNull(tx.s, 'tx.s is missing')),
        ])
        return Buffer.concat([Buffer.from([0x02]), Buffer.from(payload)])
    } else if (tx.type == '0x3') {
        // https://eips.ethereum.org/EIPS/eip-4844
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            BigInt(assertNotNull(tx.maxFeePerBlobGas, 'tx.maxFeePerBlobGas is missing')),
            assertNotNull(tx.blobVersionedHashes, 'tx.blobVersionedHashes is missing').map(decodeHex),
            BigInt(tx.yParity ?? assertNotNull(tx.v, 'tx.v is missing')),
            BigInt(assertNotNull(tx.r, 'tx.r is missing')),
            BigInt(assertNotNull(tx.s, 'tx.s is missing')),
        ])
        return Buffer.concat([Buffer.from([0x03]), Buffer.from(payload)])
    } else if (tx.type == '0x4') {
        // https://eips.ethereum.org/EIPS/eip-7702
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            decodeAuthorizationList(tx.authorizationList ?? []),
            BigInt(tx.yParity ?? assertNotNull(tx.v, 'tx.v is missing')),
            BigInt(assertNotNull(tx.r, 'tx.r is missing')),
            BigInt(assertNotNull(tx.s, 'tx.s is missing')),
        ])
        return Buffer.concat([Buffer.from([0x04]), Buffer.from(payload)])
    } else if (tx.type == '0x64') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L338
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            decodeHex(assertNotNull(tx.requestId, 'tx.requestId is missing')),
            decodeHex(tx.from),
            decodeHex(assertNotNull(tx.to, 'tx.to is missing')),
            BigInt(assertNotNull(tx.value, 'tx.value is missing'))
        ])
        return Buffer.concat([Buffer.from([0x64]), Buffer.from(payload)])
    } else if (tx.type == '0x65') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L43
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            decodeHex(tx.from),
            BigInt(tx.nonce),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing'))
        ])
        return Buffer.concat([Buffer.from([0x65]), Buffer.from(payload)])
    } else if (tx.type == '0x66') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L104
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            decodeHex(assertNotNull(tx.requestId, 'tx.requestId is missing')),
            decodeHex(tx.from),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing'))
        ])
        return Buffer.concat([Buffer.from([0x66]), Buffer.from(payload)])
    } else if (tx.type == '0x68') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L161
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            decodeHex(tx.from),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
            decodeHex(assertNotNull(tx.ticketId, 'tx.ticketId is missing')),
            decodeHex(assertNotNull(tx.refundTo, 'tx.refundTo is missing')),
            BigInt(assertNotNull(tx.maxRefund, 'tx.maxRefund is missing')),
            BigInt(assertNotNull(tx.submissionFeeRefund, 'tx.submissionFeeRefund is missing'))
        ])
        return Buffer.concat([Buffer.from([0x68]), Buffer.from(payload)])
    } else if (tx.type == '0x69') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L232
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            decodeHex(assertNotNull(tx.requestId, 'tx.requestId is missing')),
            decodeHex(tx.from),
            BigInt(assertNotNull(tx.l1BaseFee, 'tx.l1BaseFee is missing')),
            BigInt(assertNotNull(tx.depositValue, 'tx.depositValue is missing')),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.retryTo ? decodeHex(tx.retryTo) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.retryValue, 'tx.retryValue is missing')),
            decodeHex(assertNotNull(tx.beneficiary, 'tx.beneficiary is missing')),
            BigInt(assertNotNull(tx.maxSubmissionFee, 'tx.maxSubmissionFee is missing')),
            decodeHex(assertNotNull(tx.refundTo, 'tx.refundTo is missing')),
            tx.retryData ? decodeHex(tx.retryData) : Buffer.alloc(0),
        ])
        return Buffer.concat([Buffer.from([0x69]), Buffer.from(payload)])
    } else if (tx.type == '0x6a') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L387
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
        ])
        return Buffer.concat([Buffer.from([0x6a]), Buffer.from(payload)])
    } else if (tx.type == '0x3f') {
        // Stable v1.4.0 custom transaction type
        // EIP-1559 base fields + nonceKey and timeoutTimestamp appended after the signature
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            BigInt(tx.yParity ?? assertNotNull(tx.v, 'tx.v is missing')),
            BigInt(assertNotNull(tx.r, 'tx.r is missing')),
            BigInt(assertNotNull(tx.s, 'tx.s is missing')),
            // nonceKey is a quantity (uint), not a byte string
            BigInt(assertNotNull(tx.nonceKey, 'tx.nonceKey is missing')),
            BigInt(tx.timeoutTimestamp ?? 0),
        ])
        return Buffer.concat([Buffer.from([0x3f]), Buffer.from(payload)])
    } else if (tx.type == '0x76') {
        // Tempo native transaction type (batched calls, multi-sig)
        // EIP-2718 encoding: 0x76 || rlp([...tx_fields, signature_bytes])
        // https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tempo_transaction.rs
        let payload = RLP.encode(encodeTempoTransactionFields(tx))
        return Buffer.concat([Buffer.from([0x76]), Buffer.from(payload)])
    } else if (tx.type == '0x7e') {
        // https://github.com/ethereum-optimism/optimism/blob/9ff3ebb3983be52c3ca189423ae7b4aec94e0fde/specs/deposits.md#the-deposited-transaction-type
        let payload = RLP.encode([
            decodeHex(assertNotNull(tx.sourceHash, 'tx.sourceHash is missing')),
            decodeHex(tx.from),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(tx.mint ?? 0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            BigInt(tx.gas),
            0, // check if 0 is capable to substitute false
            decodeHex(assertNotNull(tx.input, 'tx.input is missing'))
        ])
        return Buffer.concat([Buffer.from([0x7e]), Buffer.from(payload)])
    } else {
        throw unexpectedCase(tx.type)
    }
}


/**
 * Encode a Tempo Call for RLP: [to, value, input]
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tempo_transaction.rs
 */
function encodeTempoCall(call: TempoCall): any[] {
    return [
        call.to ? decodeHex(call.to) : Buffer.alloc(0),
        BigInt(call.value),
        decodeHex(call.input),
    ]
}


/**
 * Encode a Tempo primitive signature (secp256k1/P256/WebAuthn) as raw bytes.
 *
 * Byte formats (from PrimitiveSignature::to_bytes):
 * - secp256k1: r(32) || s(32) || v(1) = 65 bytes, NO type prefix (backward compat)
 * - P256: 0x01 || r(32) || s(32) || pubKeyX(32) || pubKeyY(32) || preHash(1) = 130 bytes
 * - WebAuthn: 0x02 || webauthnData(var) || r(32) || s(32) || pubKeyX(32) || pubKeyY(32)
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tt_signature.rs
 */
function encodeTempoPrimitiveSignatureBytes(sig: TempoPrimitiveSignature): Uint8Array {
    let r = setLengthLeft(bigIntToUnpaddedBytes(BigInt(sig.r)), 32)
    let s = setLengthLeft(bigIntToUnpaddedBytes(BigInt(sig.s)), 32)

    switch (sig.type) {
        case 'secp256k1': {
            // Alloy's Signature::as_bytes() uses legacy v format: 27 + y_parity
            let v = qty2Int(assertNotNull(sig.yParity ?? sig.v, 'secp256k1 sig missing yParity/v'))
            return concatBytes(r, s, new Uint8Array([v + 27]))
        }
        case 'p256': {
            let pubKeyX = decodeHex(sig.pubKeyX)
            let pubKeyY = decodeHex(sig.pubKeyY)
            let preHash = sig.preHash ? 1 : 0
            return concatBytes(new Uint8Array([0x01]), r, s, pubKeyX, pubKeyY, new Uint8Array([preHash]))
        }
        case 'webAuthn': {
            let webauthnData = decodeHex(sig.webauthnData)
            let pubKeyX = decodeHex(sig.pubKeyX)
            let pubKeyY = decodeHex(sig.pubKeyY)
            return concatBytes(new Uint8Array([0x02]), webauthnData, r, s, pubKeyX, pubKeyY)
        }
        default:
            throw unexpectedCase((sig as any).type)
    }
}


/**
 * Encode a Tempo signature (primitive or Keychain) as raw bytes.
 *
 * Keychain format: type_byte(0x03 or 0x04) || userAddress(20) || innerSignatureBytes
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tt_signature.rs
 */
function encodeTempoSignatureBytes(sig: TempoSignatureObject): Uint8Array {
    if (isKeychainSignature(sig)) {
        // Keychain V1 (0x03) is the serde default; V2 (0x04) only when explicit
        let typeByte = sig.version === 'v2' ? 0x04 : 0x03
        let userAddress = decodeHex(sig.userAddress)
        let innerBytes = encodeTempoPrimitiveSignatureBytes(sig.signature)
        return concatBytes(new Uint8Array([typeByte]), userAddress, innerBytes)
    }
    return encodeTempoPrimitiveSignatureBytes(sig)
}


function isKeychainSignature(sig: TempoSignatureObject): sig is TempoKeychainSignature {
    return 'userAddress' in sig && sig.userAddress != null
}


/**
 * Encode a TempoSignedAuthorization for RLP: [chain_id, address, nonce, signature_bytes]
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tt_authorization.rs
 */
function encodeTempoSignedAuthorization(auth: TempoSignedAuthorization): any[] {
    return [
        BigInt(auth.chainId),
        decodeHex(auth.address),
        BigInt(auth.nonce),
        encodeTempoSignatureBytes(auth.signature),
    ]
}


/**
 * Map SignatureType string to its RLP-encoded u8 value.
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tempo_transaction.rs
 */
function tempoSignatureTypeToU8(keyType: string): number {
    switch (keyType) {
        case 'secp256k1': return 0
        case 'p256': return 1
        case 'webAuthn': return 2
        default: throw unexpectedCase(keyType)
    }
}


// `selector`/`recipients` are non-optional `Vec`s in the Tempo spec: an empty
// allowlist is always encoded as an empty RLP list (0xc0), never omitted.
function encodeTempoSelectorRule(rule: TempoSelectorRule): any[] {
    return [
        decodeHex(rule.selector),
        (rule.recipients ?? []).map(decodeHex),
    ]
}


// `target`/`selectorRules` are non-optional in the Tempo spec: an empty rule
// list is always encoded as an empty RLP list (0xc0), never omitted.
function encodeTempoCallScope(scope: TempoCallScope): any[] {
    return [
        decodeHex(scope.target),
        (scope.selectorRules ?? []).map(encodeTempoSelectorRule),
    ]
}


// Placeholder for an absent (but non-trailing) optional RLP field: 0x80 (empty string).
const RLP_ABSENT = Buffer.alloc(0)


function encodeTempoTokenLimit(limit: TempoTokenLimit): any[] {
    // period is encoded as Option<NonZeroU64>: present only when non-zero (trailing canonical).
    let fields: any[] = [decodeHex(limit.token), BigInt(limit.limit)]
    if (limit.period != null && BigInt(limit.period) !== 0n) {
        fields.push(BigInt(limit.period))
    }
    return fields
}


/**
 * Encode a list of trailing optional RLP fields using canonical encoding:
 * trailing absent fields are dropped, while an absent field followed by a
 * present one is emitted as a placeholder (0x80).
 *
 * Each entry provides the field value when present, or `undefined` when absent.
 */
function encodeTrailingOptional(fields: (() => any)[]): any[] {
    let lastPresent = -1
    for (let i = 0; i < fields.length; i++) {
        if (fields[i]() !== undefined) lastPresent = i
    }
    let result: any[] = []
    for (let i = 0; i <= lastPresent; i++) {
        let value = fields[i]()
        result.push(value === undefined ? RLP_ABSENT : value)
    }
    return result
}


/**
 * Encode a SignedKeyAuthorization for RLP: [[chain_id, key_type, key_id, expiry?, limits?, allowed_calls?, witness?, is_admin?, account?], signature_bytes]
 *
 * The inner KeyAuthorization is a nested RLP list with trailing optional fields
 * using canonical encoding (None → omitted, Some → encoded).
 * The signature is encoded as an RLP byte string.
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/key_authorization.rs
 */
function encodeTempoSignedKeyAuthorization(auth: TempoSignedKeyAuthorization): any[] {
    let authFields: any[] = [
        BigInt(auth.chainId),
        tempoSignatureTypeToU8(auth.keyType),
        decodeHex(auth.keyId),
        ...encodeTrailingOptional([
            () => auth.expiry != null ? BigInt(auth.expiry) : undefined,
            () => auth.limits != null ? auth.limits.map(encodeTempoTokenLimit) : undefined,
            () => auth.allowedCalls != null ? auth.allowedCalls.map(encodeTempoCallScope) : undefined,
            () => auth.witness != null ? decodeHex(auth.witness) : undefined,
            // is_admin is encoded as Option<NonZeroU64>: Some(1) when true, omitted otherwise
            () => auth.isAdmin ? BigInt(1) : undefined,
            () => auth.account != null ? decodeHex(auth.account) : undefined,
        ]),
    ]

    return [
        authFields,
        encodeTempoPrimitiveSignatureBytes(auth.signature),
    ]
}


/**
 * Encode all Tempo transaction fields + signature for the full signed encoding.
 *
 * RLP field order (from TempoTransaction::rlp_encode_fields_default + AASigned::rlp_encode):
 *   chain_id, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, calls,
 *   access_list, nonce_key, nonce, valid_before, valid_after, fee_token,
 *   fee_payer_signature, tempo_authorization_list, [key_authorization], signature_bytes
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tt_signed.rs
 */
function encodeTempoTransactionFields(tx: Transaction): any[] {
    let sig = assertNotNull(tx.signature, 'tx.signature is missing for 0x76 tx')

    let fields: any[] = [
        BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
        BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
        BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
        BigInt(tx.gas),
        assertNotNull(tx.calls, 'tx.calls is missing for 0x76 tx').map(encodeTempoCall),
        decodeAccessList(tx.accessList ?? []),
        BigInt(assertNotNull(tx.nonceKey, 'tx.nonceKey is missing for 0x76 tx')),
        BigInt(tx.nonce),
        // valid_before: u64 when present, 0x80 (empty string) when null
        tx.validBefore != null ? BigInt(tx.validBefore) : Buffer.alloc(0),
        // valid_after: u64 when present, 0x80 (empty string) when null
        tx.validAfter != null ? BigInt(tx.validAfter) : Buffer.alloc(0),
        // fee_token: Address when present, 0x80 (empty string) when null
        tx.feeToken != null ? decodeHex(tx.feeToken) : Buffer.alloc(0),
        // fee_payer_signature (secp256k1 only): rlp([v, r, s]) when present, 0x80 when null
        tx.feePayerSignature != null
            ? [
                BigInt(assertNotNull(tx.feePayerSignature.v, 'fee_payer_signature missing v')),
                BigInt(assertNotNull(tx.feePayerSignature.r, 'fee_payer_signature missing r')),
                BigInt(assertNotNull(tx.feePayerSignature.s, 'fee_payer_signature missing s')),
            ]
            : Buffer.alloc(0),
        // tempo_authorization_list (aaAuthorizationList in JSON)
        (tx.aaAuthorizationList ?? []).map(encodeTempoSignedAuthorization),
    ]

    // key_authorization is truly optional — only encoded if present
    if (tx.keyAuthorization != null) {
        fields.push(encodeTempoSignedKeyAuthorization(tx.keyAuthorization))
    }

    // Append the main signature as RLP bytes string
    fields.push(encodeTempoSignatureBytes(sig))

    return fields
}


/**
 * Encode Tempo transaction fields for signing (encode_for_signing).
 *
 * Differences from the full encoding:
 * - fee_token is skipped (empty string) when fee_payer_signature is present
 * - fee_payer_signature is replaced with placeholder: 0x00 if present, 0x80 (empty) if absent
 * - No actual signature appended
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tempo_transaction.rs
 */
function encodeTempoTransactionFieldsForSigning(tx: Transaction): any[] {
    let skipFeeToken = tx.feePayerSignature != null

    let fields: any[] = [
        BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
        BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
        BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
        BigInt(tx.gas),
        assertNotNull(tx.calls, 'tx.calls is missing for 0x76 tx').map(encodeTempoCall),
        decodeAccessList(tx.accessList ?? []),
        BigInt(assertNotNull(tx.nonceKey, 'tx.nonceKey is missing for 0x76 tx')),
        BigInt(tx.nonce),
        tx.validBefore != null ? BigInt(tx.validBefore) : Buffer.alloc(0),
        tx.validAfter != null ? BigInt(tx.validAfter) : Buffer.alloc(0),
        // fee_token: skipped when fee_payer_signature is present
        !skipFeeToken && tx.feeToken != null ? decodeHex(tx.feeToken) : Buffer.alloc(0),
        // fee_payer_signature placeholder: 0x00 if present, 0x80 (empty string) if absent
        tx.feePayerSignature != null ? Buffer.from([0x00]) : Buffer.alloc(0),
        // tempo_authorization_list (aaAuthorizationList in JSON)
        (tx.aaAuthorizationList ?? []).map(encodeTempoSignedAuthorization),
    ]

    // key_authorization is truly optional — only encoded if present
    if (tx.keyAuthorization != null) {
        fields.push(encodeTempoSignedKeyAuthorization(tx.keyAuthorization))
    }

    return fields
}


export async function transactionsRoot(transactions: Transaction[]) {
    let trie = await createMPT()

    for (let idx = 0; idx < transactions.length; idx++) {
        let tx = transactions[idx]
        let key = RLP.encode(idx)
        let value: Buffer
        try {
            value = encodeTransaction(tx)
        } catch (err: any) {
            throw addErrorContext(err, {
                transactionIndex: qty2Int(tx.transactionIndex),
                transactionHash: tx.hash
            })
        }
        await trie.put(key, value)
    }

    return toHex(trie.root())
}


function decodeLogs(logs: Log[]) {
    return logs.map(log => [
        decodeHex(log.address),
        log.topics.map(topic => decodeHex(topic)),
        decodeHex(log.data)
    ])
}


export interface ReceiptEncodingOptions {
    /**
     * Use gasUsed instead of cumulativeGasUsed when encoding receipts.
     * Some RPC providers (Cosmos EVM) deviate from the Ethereum standard by using
     * per-transaction gas instead of cumulative.
     */
    useGasUsed?: boolean
}


/**
 * Pre-EIP-658 (Byzantium) receipts encode a 32-byte post-transaction state root
 * in place of the status flag.
 *
 * https://eips.ethereum.org/EIPS/eip-658
 */
function encodeReceiptStatusOrRoot(receipt: Receipt): number | Uint8Array {
    if (receipt.root != null) {
        return decodeHex(receipt.root)
    }
    return qty2Int(assertNotNull(receipt.status, 'receipt.status is missing'))
}


function encodeReceipt(receipt: Receipt, options?: ReceiptEncodingOptions): Buffer {
    let type = receipt.type == '0x0' ? Buffer.alloc(0) : RLP.encode(qty2Int(receipt.type))
    let payload: Uint8Array
    let gasField = options?.useGasUsed ? receipt.gasUsed : receipt.cumulativeGasUsed
    if (receipt.type == '0x7e') {
        // https://github.com/ethereum-optimism/specs/blob/main/specs/protocol/deposits.md#deposit-receipt
        payload = RLP.encode([
            qty2Int(assertNotNull(receipt.status, 'receipt.status is missing')),
            BigInt(gasField),
            decodeHex(receipt.logsBloom),
            decodeLogs(receipt.logs),
            BigInt(assertNotNull(receipt.depositNonce, 'receipt.depositNonce is missing')),
            Number('depositReceiptVersion' in receipt),
        ])
    } else {
        payload = RLP.encode([
            encodeReceiptStatusOrRoot(receipt),
            BigInt(gasField),
            decodeHex(receipt.logsBloom),
            decodeLogs(receipt.logs),
        ])
    }
    return Buffer.concat([type, Buffer.from(payload)])
}


export async function receiptsRoot(receipts: Receipt[], options?: ReceiptEncodingOptions) {
    let trie = await createMPT()

    for (let idx = 0; idx < receipts.length; idx++) {
        let receipt = receipts[idx]
        let key = RLP.encode(idx)
        let value: Buffer
        try {
            value = encodeReceipt(receipt, options)
        } catch (err: any) {
            throw addErrorContext(err, {
                transactionIndex: qty2Int(receipt.transactionIndex),
                transactionHash: receipt.transactionHash
            })
        }
        await trie.put(key, value)
    }

    return toHex(trie.root())
}


function addToBloom(bloom: Uint8Array, entry: Uint8Array) {
    let hash = keccak256(entry)
    for (let idx of [0, 2, 4]) {
        let bitToSet = ((hash[idx] << 8) | hash[idx + 1]) & 0x07FF
        let bitIndex = 0x07FF - bitToSet
        let byteIndex = Math.floor(bitIndex / 8)
        let bitValue = 1 << (7 - (bitIndex % 8))
        bloom[byteIndex] = bloom[byteIndex] | bitValue
    }
}


export function logsBloom(logs: Log[]) {
    let bloom = new Uint8Array(256)

    for (let log of logs) {
        addToBloom(bloom, decodeHex(log.address))
        for (let topic of log.topics) {
            addToBloom(bloom, decodeHex(topic))
        }
    }

    return toHex(bloom)
}


/**
 * True when every bit set in `subset` is also set in `superset`.
 * Used to check whether a header logs bloom contains all the bits produced
 * by the receipt logs we have — possibly with extra, node-side bits on top.
 */
export function isBloomSuperset(superset: string, subset: string): boolean {
    let superBuf = decodeHex(superset)
    let subBuf = decodeHex(subset)
    for (let i = 0; i < superBuf.length; i++) {
        if ((superBuf[i] & subBuf[i]) !== subBuf[i]) return false
    }
    return true
}


function serializeTransaction(tx: Transaction): Uint8Array | undefined {
    if (tx.type == '0x0') {
        let fields = [
            BigInt(tx.nonce),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
        ]

        let v = tx.v ? qty2Int(tx.v) : undefined
        if (v != null && v !== 27 && v !== 28) {
            fields.push(BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')), 0n, 0n)
        }

        return RLP.encode(fields)
    } else if (tx.type == '0x1') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
            decodeAccessList(tx.accessList ?? []),
        ])
        return Buffer.concat([Buffer.from([0x01]), Buffer.from(payload)])
    } else if (tx.type == '0x2') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
            decodeAccessList(tx.accessList ?? []),
        ])
        return Buffer.concat([Buffer.from([0x02]), Buffer.from(payload)])
    } else if (tx.type == '0x3') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
            decodeAccessList(tx.accessList ?? []),
            BigInt(assertNotNull(tx.maxFeePerBlobGas, 'tx.maxFeePerBlobGas is missing')),
            assertNotNull(tx.blobVersionedHashes, 'tx.blobVersionedHashes is missing').map(decodeHex),
        ])
        return Buffer.concat([Buffer.from([0x03]), Buffer.from(payload)])
    } else if (tx.type == '0x4') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
            decodeAccessList(tx.accessList ?? []),
            decodeAuthorizationList(tx.authorizationList ?? []),
        ])
        return Buffer.concat([Buffer.from([0x04]), Buffer.from(payload)])
    } else if (tx.type == '0x64') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L338
        return
    } else if (tx.type == '0x65') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L43
        return
    } else if (tx.type == '0x66') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L104
        return
    } else if (tx.type == '0x68') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L161
        return
    } else if (tx.type == '0x69') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L232
        return
    } else if (tx.type == '0x6a') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L387
        return
    } else if (tx.type == '0x3f') {
        // Stable v1.4.0 custom transaction type — signing payload (no signature)
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(assertNotNull(tx.maxPriorityFeePerGas, 'tx.maxPriorityFeePerGas is missing')),
            BigInt(assertNotNull(tx.maxFeePerGas, 'tx.maxFeePerGas is missing')),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(assertNotNull(tx.value, 'tx.value is missing')),
            decodeHex(assertNotNull(tx.input, 'tx.input is missing')),
            decodeAccessList(tx.accessList ?? []),
            // nonceKey is a quantity (uint), not a byte string
            BigInt(assertNotNull(tx.nonceKey, 'tx.nonceKey is missing')),
            BigInt(tx.timeoutTimestamp ?? 0),
        ])
        return Buffer.concat([Buffer.from([0x3f]), Buffer.from(payload)])
    } else if (tx.type == '0x76') {
        // Tempo native transaction type — encode_for_signing payload
        // https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tempo_transaction.rs
        let payload = RLP.encode(encodeTempoTransactionFieldsForSigning(tx))
        return Buffer.concat([Buffer.from([0x76]), Buffer.from(payload)])
    } else if (tx.type == '0x7e') {
        // https://github.com/ethereum-optimism/optimism/blob/9ff3ebb3983be52c3ca189423ae7b4aec94e0fde/specs/deposits.md#the-deposited-transaction-type
        return
    } else {
        throw unexpectedCase(tx.type)
    }
}


function calculateSigRecovery(tx: Transaction) {
    if (tx.v == '0x0' || tx.v == '0x1') {
        return qty2Int(tx.v)
    } else {
        let v = assertNotNull(tx.v, 'tx.v is missing')
        let vInt = qty2Int(v)
        if (vInt === 27 || vInt === 28) {
            return vInt - 27
        } else {
            return vInt - (qty2Int(assertNotNull(tx.chainId, 'tx.chainId is missing')) * 2 + 35)
        }
    }
}


/**
 * Recover the sender address from a Tempo signature.
 *
 * - secp256k1: standard ecdsaRecover
 * - P256/WebAuthn: address derived from embedded public key as keccak256(pubKeyX || pubKeyY)[12:]
 * - Keychain V1: inner signature signs sig_hash directly
 * - Keychain V2: inner signature signs keccak256(0x04 || sig_hash || userAddress)
 *
 * https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/tt_signature.rs
 */
function recoverTempoSender(sig: TempoSignatureObject, sigHash: Uint8Array): Bytes20 | undefined {
    if (isKeychainSignature(sig)) {
        // For Keychain signatures, the sender is always the userAddress
        // (the root account this transaction is executed for)
        return toHex(decodeHex(sig.userAddress)) as Bytes20
    }
    return recoverTempoPrimitiveSender(sig, sigHash)
}


/**
 * Recover the sender from a Tempo primitive signature (secp256k1/P256/WebAuthn).
 */
function recoverTempoPrimitiveSender(sig: TempoPrimitiveSignature, messageHash: Uint8Array): Bytes20 | undefined {
    switch (sig.type) {
        case 'secp256k1': {
            let r = setLengthLeft(bigIntToUnpaddedBytes(BigInt(sig.r)), 32)
            let s = setLengthLeft(bigIntToUnpaddedBytes(BigInt(sig.s)), 32)
            let signature = concatBytes(r, s)
            let recovery = qty2Int(assertNotNull(sig.yParity ?? sig.v, 'secp256k1 sig missing yParity/v'))
            let pubKey = secp256k1.ecdsaRecover(signature, recovery, messageHash, false)
            return toHex(keccak256(pubKey.slice(1)).subarray(-20))
        }
        case 'p256':
        case 'webAuthn': {
            // P256/WebAuthn: address is derived from the embedded public key
            let pubKeyX = decodeHex(sig.pubKeyX)
            let pubKeyY = decodeHex(sig.pubKeyY)
            return toHex(keccak256(concatBytes(pubKeyX, pubKeyY)).subarray(-20))
        }
        default:
            return
    }
}


export function recoverTxSender(tx: Transaction): Bytes20 | undefined {
    let message = serializeTransaction(tx)
    if (message == null) return
    let messageHash = keccak256(message)

    if (tx.type == '0x76') {
        // Tempo 0x76: signature is in tx.signature object
        let sig = assertNotNull(tx.signature, 'tx.signature is missing for 0x76 tx')
        return recoverTempoSender(sig, messageHash)
    }

    let r = assertNotNull(tx.r, 'tx.r is missing')
    let s = assertNotNull(tx.s, 'tx.s is missing')
    let signature = concatBytes(
        setLengthLeft(bigIntToUnpaddedBytes(BigInt(r)), 32),
        setLengthLeft(bigIntToUnpaddedBytes(BigInt(s)), 32)
    )
    let recovery = calculateSigRecovery(tx)
    let pubKey = secp256k1.ecdsaRecover(signature, recovery, messageHash, false)
    return toHex(keccak256(pubKey.slice(1)).subarray(-20))
}


export function calculateStateSyncTxHash(blockNum: Qty, blockHash: Bytes32) {
    let receiptKey = Buffer.concat([
        new TextEncoder().encode('matic-bor-receipt-'),
        setLengthLeft(hexToBytes(blockNum as PrefixedHexString), 8),
        decodeHex(blockHash)
    ])
    return toHex(keccak256(receiptKey))
}


function encodeWithdrawal(withdrawal: Withdrawal) {
    return RLP.encode([
        BigInt(withdrawal.index),
        BigInt(withdrawal.validatorIndex),
        decodeHex(withdrawal.address),
        BigInt(withdrawal.amount),
    ])
}


export async function withdrawalsRoot(withdrawals: Withdrawal[]) {
    let trie = await createMPT()

    for (let idx = 0; idx < withdrawals.length; idx++) {
        let withdrawal = withdrawals[idx]
        let key = RLP.encode(idx)
        let value = encodeWithdrawal(withdrawal)
        await trie.put(key, value)
    }

    return toHex(trie.root())
}


// Debug tracers serialize call kinds with inconsistent casing across node
// implementations (geth `CALL`, some tracers `call`, zkSync-era `Call`), so every
// membership test below compares the canonical upper-cased form.
function canonicalFrameType(type: string): string {
    return type.toUpperCase()
}

const CALL_FRAME_TYPES = new Set([
    'CALL',
    'CALLCODE',
    'DELEGATECALL',
    'STATICCALL',
    'INVALID'
])

// INVALID is a top-level execution outcome, not a nested-only call kind: unlike
// DELEGATECALL/STATICCALL/CALLCODE it can legitimately appear as a root frame.
const ROOT_CALL_FRAME_TYPES = new Set(['CALL', 'INVALID'])
const CREATE_FRAME_TYPES = new Set([
    'CREATE',
    'CREATE2'
])
const SELFDESTRUCT_FRAME_TYPES = new Set(['SELFDESTRUCT'])
const MAPPABLE_FRAME_TYPES = new Set([
    ...CALL_FRAME_TYPES,
    ...CREATE_FRAME_TYPES,
    ...SELFDESTRUCT_FRAME_TYPES
])


export interface CallFrame {
    type: string
    from: Bytes20
    to?: Bytes20 | null
    value?: Qty | null
    input?: string | null
    output?: string | null
    error?: string | null
    gasUsed?: string | null
    calls?: CallFrame[] | null
}


/**
 * Checks the non-heuristic requirements needed to map every debug frame.
 *
 * These checks are safe to enforce for every network: accepting a violation would only
 * defer the same failure to normalization, after the RPC response has been archived.
 */
export function checkDebugFrameStructure(root: CallFrame): string | undefined {
    return checkFrameStructure(root, [])
}


function checkFrameStructure(frame: CallFrame, traceAddress: number[]): string | undefined {
    let label = frameLabel(traceAddress)
    let type = canonicalFrameType(frame.type)

    // Normalization treats a root STOP result as an empty trace list. The same
    // type nested in a tree has no mapper representation.
    if (type === 'STOP' && traceAddress.length === 0) {
        if (frame.calls?.length) {
            return 'root STOP frame has subcalls'
        }
        return
    }

    if (!MAPPABLE_FRAME_TYPES.has(type)) {
        return `${label} has unsupported type ${frame.type}`
    }

    if (!isAddress(frame.from)) {
        return `${label} has invalid from address ${frame.from}`
    }

    if (frame.to != null && !isAddress(frame.to)) {
        return `${label} has invalid to address ${frame.to}`
    }

    if (CALL_FRAME_TYPES.has(type)) {
        if (frame.to == null) {
            return `${callFrameLabel(traceAddress)} has no target`
        }
        if (frame.input == null) {
            return `${callFrameLabel(traceAddress)} has no input`
        }
    } else if (CREATE_FRAME_TYPES.has(type)) {
        if (frame.input == null) {
            return `${createFrameLabel(traceAddress)} has no init code`
        }
        // Truthiness, not null-ness: the mapper builds the result from truthy fields
        // and then asserts gasUsed, so `gasUsed: ''` would still abort normalization.
        if ((frame.to || frame.output) && !frame.gasUsed) {
            return `${createFrameLabel(traceAddress)} has a result but no gas used`
        }
    } else if (SELFDESTRUCT_FRAME_TYPES.has(type) && frame.to == null) {
        return `${selfdestructFrameLabel(traceAddress)} has no beneficiary`
    }

    let calls = frame.calls ?? []
    for (let i = 0; i < calls.length; i++) {
        let violation = checkFrameStructure(calls[i], [...traceAddress, i])
        if (violation) return violation
    }
}


/**
 * Checks that a structurally mappable call tree is internally consistent and
 * agrees with its transaction.
 *
 * Returns a description of the first violation, or `undefined` when the tree checks out.
 *
 * This is a semantic consistency check, not proof of trace correctness: debug traces
 * have no consensus commitment, and a self-consistent but incorrect tree can still pass.
 */
export function checkCallFrameTree(
    tx: {from: Bytes20; to?: Bytes20 | null},
    root: CallFrame
): string | undefined {
    // A root STOP maps to an empty trace list, so there is nothing to agree with the
    // transaction about. The structural check owns this shape.
    if (canonicalFrameType(root.type) === 'STOP') return

    if (!sameAddress(root.from, tx.from)) {
        return `root frame is executed by ${root.from}, but the transaction is sent by ${tx.from}`
    }

    if (tx.to == null) {
        if (!CREATE_FRAME_TYPES.has(canonicalFrameType(root.type))) {
            return `root frame has type ${root.type}, but the transaction creates a contract`
        }
    } else {
        if (!ROOT_CALL_FRAME_TYPES.has(canonicalFrameType(root.type))) {
            return `root frame has type ${root.type}, but the transaction calls ${tx.to}`
        }
        if (!sameAddress(root.to, tx.to)) {
            return `root frame calls ${root.to ?? 'nothing'}, but the transaction calls ${tx.to}`
        }
    }

    return checkSubcalls(root, [])
}


function checkSubcalls(parent: CallFrame, traceAddress: number[]): string | undefined {
    // DELEGATECALL and CALLCODE run the callee's code in the caller's context,
    // so the executing address stays the same
    let executor = isContextPreserving(parent.type) ? parent.from : parent.to
    let calls = parent.calls || []

    for (let i = 0; i < calls.length; i++) {
        let call = calls[i]
        let at = [...traceAddress, i]

        if (executor != null && !sameAddress(call.from, executor)) {
            return `frame ${at.join('/')} is executed by ${call.from}, but ${executor} is on top of the call stack`
        }

        if (SELFDESTRUCT_FRAME_TYPES.has(canonicalFrameType(call.type)) && call.to == null) {
            return `${selfdestructFrameLabel(at)} has no beneficiary`
        }

        // An unknown child type cannot define the execution context for its own
        // children. Keep validating independent ancestors and siblings, but leave
        // that subtree to the structural validator.
        if (!MAPPABLE_FRAME_TYPES.has(canonicalFrameType(call.type))) continue

        let violation = checkSubcalls(call, at)
        if (violation) return violation
    }
}


/**
 * One `SELFDESTRUCT` as an opcode-level tracer saw it, bound to the call path
 * its frame occupies.
 */
export interface SelfdestructEvent {
    traceAddress: number[]
    account: Bytes20
    beneficiary: Bytes20
    balance: Qty
    /**
     * Balance observed at the preceding balance-preserving opcode in this frame.
     */
    preBalance?: Qty
}


/**
 * Rebuilds call paths from a tracer stream of `enter`, `exit` and `sd` items.
 *
 * The frames a call tree holds are entered in execution order, so counting
 * entries per depth yields the same trace addresses the tree uses. Items that
 * do not parse are skipped: a short or malformed stream simply yields fewer
 * events, and the caller rejects what it cannot bind.
 */
export function selfdestructEvents(stream: unknown[]): SelfdestructEvent[] {
    let path: number[] = []
    let children: number[] = [0]
    let found: SelfdestructEvent[] = []

    for (let item of stream) {
        if (item == null || typeof item !== 'object') continue
        let rec = item as Record<string, unknown>

        switch (rec.t) {
            case 'enter': {
                let index = children[children.length - 1]++
                path.push(index)
                children.push(0)
                break
            }
            case 'exit':
                if (path.length > 0) {
                    path.pop()
                    children.pop()
                }
                break
            case 'sd': {
                let index = children[children.length - 1]++

                let {from, to, bal, preBalance} = rec
                if (typeof from !== 'string' || typeof to !== 'string' || typeof bal !== 'string') {
                    continue
                }

                found.push({
                    traceAddress: [...path, index],
                    account: from.toLowerCase(),
                    beneficiary: to.toLowerCase(),
                    balance: bal,
                    preBalance: typeof preBalance === 'string' ? preBalance : undefined
                })
                break
            }
        }
    }

    return found
}


/**
 * What a revm-based tracer gets wrong about an existing contract's post-Cancun
 * selfdestruct-to-self.
 *
 * That opcode moves nothing and so records no journal entry, while the tracer
 * builds the frame from the most recent journal entry of the whole transaction
 * (bluealloy/revm#3834). Either nothing is there to read, or an earlier entry is:
 * a balance transfer or an earlier selfdestruct, made by any account in any frame.
 * The reverse cannot happen: a selfdestruct that sends funds to another account
 * records its own entry. Matching parties alone do not confirm a self-targeting
 * frame's balance: older versions also journal self-calls, whose amounts can
 * differ from the account's balance.
 *
 * - `incomplete`: no entry to read, `from` is zero, `to` and `value` are unset.
 * - `stale-entry`: an earlier entry was read instead, so the frame repeats a value
 *   movement that already happened in this transaction.
 */
export type SelfdestructDefect =
    | {kind: 'incomplete'}
    | {kind: 'stale-entry', reportedFrom: Bytes20, reportedTo: Bytes20}


export interface DefectiveSelfdestruct {
    traceAddress: number[]
    /**
     * The account executing the opcode, per the enclosing frame's call context.
     * `undefined` when the tree does not name it.
     */
    executor?: Bytes20
    defect: SelfdestructDefect
}


/**
 * `applied`: the frame now carries what the opcode did.
 * `confirmed`: the frame already did — a genuine selfdestruct that happens to
 * repeat an earlier movement.
 */
export type SelfdestructRepair = 'applied' | 'confirmed'


interface Movement {
    from: string
    to: string
    value: string
}


/**
 * Finds selfdestruct frames that a revm-based tracer may have built from the
 * wrong journal entry.
 *
 * Suspicion is not proof: a frame that repeats an earlier movement can also be
 * genuine, which only an opcode-level trace can tell ({@link repairDefectiveSelfdestruct}).
 */
export function findDefectiveSelfdestructs(root: CallFrame): DefectiveSelfdestruct[] {
    let found: DefectiveSelfdestruct[] = []
    let moved: Movement[] = []

    recordMovement(root, moved)
    collectDefectiveSelfdestructs(root, [], moved, found)
    return found
}


// A call moves funds only when it carries a value, but a selfdestruct records
// its entry whatever the balance was, and a later defective frame can repeat it.
function recordMovement(frame: CallFrame, moved: Movement[]): void {
    if (!frame.to || frame.value == null) return

    let recordsEntry = SELFDESTRUCT_FRAME_TYPES.has(frame.type)
    let zeroValue = frame.value === '0x0' || frame.value === '0x'
    if (!recordsEntry && zeroValue) return

    moved.push({
        from: frame.from.toLowerCase(),
        to: frame.to.toLowerCase(),
        value: frame.value
    })
}


function repeatsMovement(frame: CallFrame, moved: Movement[]): boolean {
    if (frame.to == null || frame.value == null) return false

    let from = frame.from.toLowerCase()
    let to = frame.to.toLowerCase()
    return moved.some(m => m.from === from && m.to === to && m.value === frame.value)
}


// Movements live as long as the frame that made them: a frame that fails is
// undone on exit, its own transfer and every entry made under it, so what its
// children could repeat, nothing after it can. revm drops the journal entries of
// a reverted checkpoint the same way. The usual shape is a plain value call to a
// receiver that rejects it, followed by a selfdestruct to the same receiver that
// forces the value in: genuine, because the call moved nothing.
function collectDefectiveSelfdestructs(
    parent: CallFrame,
    traceAddress: number[],
    moved: Movement[],
    found: DefectiveSelfdestruct[]
): void {
    let executor = isContextPreserving(parent.type) ? parent.from : parent.to
    if (executor != null && !isAddress(executor)) {
        executor = undefined
    }

    let calls = parent.calls ?? []
    for (let i = 0; i < calls.length; i++) {
        let child = calls[i]
        let at = [...traceAddress, i]
        let checkpoint = moved.length

        if (SELFDESTRUCT_FRAME_TYPES.has(child.type)) {
            // The frame's own payload is not evidence about itself, so it joins
            // the movements only after it has been judged.
            let defect = selfdestructDefect(child, moved)
            if (defect) {
                found.push({
                    traceAddress: at,
                    executor: executor?.toLowerCase(),
                    defect
                })
            }
            recordMovement(child, moved)
        } else {
            recordMovement(child, moved)
            collectDefectiveSelfdestructs(child, at, moved, found)
        }

        if (child.error != null) {
            moved.length = checkpoint
        }
    }
}


function selfdestructDefect(frame: CallFrame, moved: Movement[]): SelfdestructDefect | undefined {
    if (isZeroAddress(frame.from) && frame.to == null && frame.value == null) {
        return {kind: 'incomplete'}
    }

    if (repeatsMovement(frame, moved)) {
        return {
            kind: 'stale-entry',
            reportedFrom: frame.from.toLowerCase(),
            reportedTo: (frame.to ?? '').toLowerCase()
        }
    }
}


/**
 * Settles a suspect frame against what an opcode-level tracer saw.
 *
 * A preceding balance-preserving opcode supplies the pre-selfdestruct balance
 * even when the tracer's step callback runs after execution. Without that
 * snapshot, a zero balance cannot distinguish a burn from an existing empty
 * account, so that ambiguity is refused when the parties already match; a payload
 * with different parties is the known no-op defect and can use the unchanged
 * balance. Selfdestructs sending elsewhere have their own journal entry, so
 * matching parties suffice to confirm their original payload.
 *
 * Returns the outcome, or why the frame cannot be settled. A refused frame is
 * left untouched.
 */
export function repairDefectiveSelfdestruct(
    root: CallFrame,
    defect: DefectiveSelfdestruct,
    events: SelfdestructEvent[]
): {repair: SelfdestructRepair} | {refused: string} {
    let path = defect.traceAddress.join('/')

    let matching = events.filter(e => e.traceAddress.join('/') === path)
    if (matching.length !== 1) {
        return {refused: `the tracer reports no single selfdestruct at ${path}`}
    }
    let event = matching[0]

    if (defect.executor != null && !sameAddress(event.account, defect.executor)) {
        return {
            refused: `the tracer attributes ${path} to ${event.account}, ` +
                `but ${defect.executor} is on top of the call stack`
        }
    }

    let frame = frameAt(root, defect.traceAddress)
    if (frame == null) {
        return {refused: `${frameLabel(defect.traceAddress)} is not in the call tree`}
    }

    let selfTarget = sameAddress(event.account, event.beneficiary)
    let namesTheOpcode = sameAddress(frame.from, event.account) && sameAddress(frame.to, event.beneficiary)
    let balance = event.preBalance ?? event.balance
    let balanceAgrees = frame.value === balance
    if (namesTheOpcode && (!selfTarget || balanceAgrees)) {
        return {repair: 'confirmed'}
    }

    if (!selfTarget) {
        return {refused: `${path} sends to ${event.beneficiary}, so its balance at the opcode is unknown`}
    }

    let mayFollowBurn = event.preBalance == null && event.balance === '0x0'
    if (namesTheOpcode && mayFollowBurn) {
        return {
            refused: `${path} has no balance observation before selfdestruct; ` +
                'a zero balance may follow a burn'
        }
    }

    frame.from = event.account
    frame.to = event.beneficiary
    frame.value = balance
    return {repair: 'applied'}
}


function frameAt(root: CallFrame, traceAddress: number[]): CallFrame | undefined {
    let frame: CallFrame | undefined = root
    for (let index of traceAddress) {
        frame = frame?.calls?.[index]
    }
    return frame
}


function isContextPreserving(type: string): boolean {
    switch(canonicalFrameType(type)) {
        case 'DELEGATECALL':
        case 'CALLCODE':
            return true
        default:
            return false
    }
}


function frameLabel(traceAddress: number[]): string {
    return traceAddress.length === 0 ? 'root frame' : `frame ${traceAddress.join('/')}`
}


function callFrameLabel(traceAddress: number[]): string {
    return traceAddress.length === 0 ? 'root call frame' : `call frame ${traceAddress.join('/')}`
}


function createFrameLabel(traceAddress: number[]): string {
    return traceAddress.length === 0 ? 'root create frame' : `create frame ${traceAddress.join('/')}`
}


function selfdestructFrameLabel(traceAddress: number[]): string {
    return traceAddress.length === 0
        ? 'root selfdestruct frame'
        : `selfdestruct frame ${traceAddress.join('/')}`
}


function isAddress(value: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(value)
}


function isZeroAddress(value: string): boolean {
    return /^0x0{40}$/.test(value)
}


function sameAddress(a?: Bytes20 | null, b?: Bytes20 | null): boolean {
    return a != null && b != null && a.toLowerCase() === b.toLowerCase()
}
