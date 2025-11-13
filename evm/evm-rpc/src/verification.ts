import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import {addErrorContext, assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {createMPT} from '@ethereumjs/mpt'
import {RLP} from '@ethereumjs/rlp'
import {bigIntToUnpaddedBytes, concatBytes, setLengthLeft} from '@ethereumjs/util'
import {keccak256} from 'ethereum-cryptography/keccak'
import secp256k1 from 'secp256k1'
import {Transaction, AccessListItem, EIP7702Authorization, GetBlock, Log, Receipt} from './rpc-data'
import {qty2Int} from './util'


export function blockHash(block: GetBlock) {
    let fields = [
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

    let encoded = RLP.encode(fields)
    return toHex(keccak256(encoded))
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


function decodeAuthorizationList(authorizationList: EIP7702Authorization[]) {
    return authorizationList.map(item => [
        BigInt(item.chainId),
        decodeHex(item.address),
        BigInt(item.nonce),
        BigInt(item.yParity),
        BigInt(item.r),
        BigInt(item.s)
    ])
}


function encodeTransaction(tx: Transaction): Buffer {
    if (tx.type == '0x0') {
        return Buffer.from(
            RLP.encode([
                BigInt(tx.nonce),
                BigInt(tx.gasPrice ?? 0),
                BigInt(tx.gas),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(tx.value),
                tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
                BigInt(tx.v),
                BigInt(tx.r),
                BigInt(tx.s),
            ])
        )
    } else if (tx.type == '0x1') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(tx.value),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            BigInt(tx.v),
            BigInt(tx.r),
            BigInt(tx.s),
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
            BigInt(tx.value),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            BigInt(tx.v),
            BigInt(tx.r),
            BigInt(tx.s),
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
            BigInt(tx.value),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            BigInt(assertNotNull(tx.maxFeePerBlobGas, 'tx.maxFeePerBlobGas is missing')),
            assertNotNull(tx.blobVersionedHashes, 'tx.blobVersionedHashes is missing').map(decodeHex),
            BigInt(tx.yParity ?? tx.v),
            BigInt(tx.r),
            BigInt(tx.s),
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
            BigInt(tx.value),
            tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
            decodeAccessList(tx.accessList ?? []),
            decodeAuthorizationList(tx.authorizationList ?? []),
            BigInt(tx.yParity ?? tx.v),
            BigInt(tx.r),
            BigInt(tx.s),
        ])
        return Buffer.concat([Buffer.from([0x04]), Buffer.from(payload)])
    } else if (tx.type == '0x64') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L338
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            decodeHex(assertNotNull(tx.requestId, 'tx.requestId is missing')),
            decodeHex(tx.from),
            decodeHex(assertNotNull(tx.to, 'tx.to is missing')),
            BigInt(tx.value)
        ])
        return Buffer.concat([Buffer.from([0x64]), Buffer.from(payload)])
    } else if (tx.type == '0x66') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L104
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            decodeHex(assertNotNull(tx.requestId, 'tx.requestId is missing')),
            decodeHex(tx.from),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(tx.value),
            decodeHex(tx.input)
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
            BigInt(tx.value),
            decodeHex(tx.input),
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
            decodeHex(tx.input),
        ])
        return Buffer.concat([Buffer.from([0x6a]), Buffer.from(payload)])
    } else if (tx.type == '0x7e') {
        // https://github.com/ethereum-optimism/optimism/blob/9ff3ebb3983be52c3ca189423ae7b4aec94e0fde/specs/deposits.md#the-deposited-transaction-type
        let payload = RLP.encode([
            decodeHex(assertNotNull(tx.sourceHash, 'tx.sourceHash is missing')),
            decodeHex(tx.from),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(tx.mint ?? 0),
            BigInt(tx.value),
            BigInt(tx.gas),
            0, // check if 0 is capable to substitute false
            decodeHex(tx.input)
        ])
        return Buffer.concat([Buffer.from([0x7e]), Buffer.from(payload)])
    } else {
        throw unexpectedCase(tx.type)
    }
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


function encodeReceipt(receipt: Receipt): Buffer {
    let type = receipt.type == '0x0' ? Buffer.alloc(0) : RLP.encode(qty2Int(receipt.type))
    let payload: Uint8Array
    if (receipt.type == '0x7e') {
        // https://github.com/ethereum-optimism/specs/blob/main/specs/protocol/deposits.md#deposit-receipt
        payload = RLP.encode([
            qty2Int(receipt.status),
            BigInt(receipt.cumulativeGasUsed),
            decodeHex(receipt.logsBloom),
            decodeLogs(receipt.logs),
            BigInt(assertNotNull(receipt.depositNonce, 'receipt.depositNonce is missing')),
            Number('depositReceiptVersion' in receipt),
        ])
    } else {
        payload = RLP.encode([
            qty2Int(receipt.status),
            BigInt(receipt.cumulativeGasUsed),
            decodeHex(receipt.logsBloom),
            decodeLogs(receipt.logs),
        ])
    }
    return Buffer.concat([type, Buffer.from(payload)])
}


export async function receiptsRoot(receipts: Receipt[]) {
    let trie = await createMPT()

    for (let idx = 0; idx < receipts.length; idx++) {
        let receipt = receipts[idx]
        let key = RLP.encode(idx)
        let value: Buffer
        try {
            value = encodeReceipt(receipt)
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


function serializeTransaction(tx: Transaction): Uint8Array | undefined {
    if (tx.type == '0x0') {
        let fields = [
            BigInt(tx.nonce),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(tx.value),
            decodeHex(tx.input),
        ]

        if (tx.chainId) {
            fields.push(BigInt(tx.chainId), 0n, 0n)
        }

        return RLP.encode(fields)
    } else if (tx.type == '0x1') {
        let payload = RLP.encode([
            BigInt(assertNotNull(tx.chainId, 'tx.chainId is missing')),
            BigInt(tx.nonce),
            BigInt(tx.gasPrice ?? 0),
            BigInt(tx.gas),
            tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
            BigInt(tx.value),
            decodeHex(tx.input),
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
            BigInt(tx.value),
            decodeHex(tx.input),
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
            BigInt(tx.value),
            decodeHex(tx.input),
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
            BigInt(tx.value),
            decodeHex(tx.input),
            decodeAccessList(tx.accessList ?? []),
            decodeAuthorizationList(tx.authorizationList ?? []),
        ])
        return Buffer.concat([Buffer.from([0x04]), Buffer.from(payload)])
    } else if (tx['type'] == '0x64') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L338
        return
    } else if (tx['type'] == '0x65') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L43
        return
    } else if (tx['type'] == '0x66') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L104
        return
    } else if (tx['type'] == '0x68') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L161
        return
    } else if (tx['type'] == '0x69') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L232
        return
    } else if (tx['type'] == '0x6a') {
        // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L387
        return
    } else if (tx['type'] == '0x7e') {
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
        if (tx.chainId == null) {
            return qty2Int(tx.v) - 27
        } else {
            return qty2Int(tx.v) - (qty2Int(tx.chainId) * 2 + 35)
        }
    }
}


export function recoverTxSender(tx: Transaction): string | undefined {
    let message = serializeTransaction(tx)
    if (message == null) return
    let messageHash = keccak256(message)
    let signature = concatBytes(
        setLengthLeft(bigIntToUnpaddedBytes(BigInt(tx.r)), 32),
        setLengthLeft(bigIntToUnpaddedBytes(BigInt(tx.s)), 32)
    )
    let recovery = calculateSigRecovery(tx)
    let pubKey = secp256k1.ecdsaRecover(signature, recovery, messageHash, false)
    return toHex(keccak256(pubKey.slice(1)).subarray(-20))
}
