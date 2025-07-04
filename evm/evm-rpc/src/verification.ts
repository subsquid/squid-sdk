import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {createMPT} from '@ethereumjs/mpt'
import {RLP} from '@ethereumjs/rlp'
import {Transaction, Access, EIP7702Authorization} from './rpc-data'


function decodeAccessList(accessList: Access[]) {
    return accessList.map(item => [
        decodeHex(item.address),
        item.storageKeys.map(key => decodeHex(key))
    ])
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


export async function transactionRoot(transactions: Transaction[]) {
    let trie = await createMPT()

    for (let idx = 0; idx < transactions.length; idx++) {
        let tx = transactions[idx]
        let key = RLP.encode(idx)
        let value: Buffer

        if (tx.type == '0x0') {
            value = Buffer.from(
                RLP.encode([
                    BigInt(tx.nonce),
                    BigInt(tx.gasPrice),
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
                BigInt(assertNotNull(tx.chainId)),
                BigInt(tx.nonce),
                BigInt(tx.gasPrice),
                BigInt(tx.gas),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(tx.value),
                tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
                decodeAccessList(tx.accessList ?? []),
                BigInt(tx.v),
                BigInt(tx.r),
                BigInt(tx.s),
            ])
            value = Buffer.concat([Buffer.from([0x01]), Buffer.from(payload)])
        } else if (tx.type == '0x2') {
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                BigInt(tx.nonce),
                BigInt(assertNotNull(tx.maxPriorityFeePerGas)),
                BigInt(assertNotNull(tx.maxFeePerGas)),
                BigInt(tx.gas),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(tx.value),
                tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
                decodeAccessList(tx.accessList ?? []),
                BigInt(tx.v),
                BigInt(tx.r),
                BigInt(tx.s),
            ])
            value = Buffer.concat([Buffer.from([0x02]), Buffer.from(payload)])
        } else if (tx.type == '0x3') {
            // https://eips.ethereum.org/EIPS/eip-4844
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                BigInt(tx.nonce),
                BigInt(assertNotNull(tx.maxPriorityFeePerGas)),
                BigInt(assertNotNull(tx.maxFeePerGas)),
                BigInt(tx.gas),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(tx.value),
                tx.input ? decodeHex(tx.input) : Buffer.alloc(0),
                decodeAccessList(tx.accessList ?? []),
                BigInt(assertNotNull(tx.maxFeePerBlobGas)),
                assertNotNull(tx.blobVersionedHashes).map(decodeHex),
                BigInt(tx.yParity ?? tx.v),
                BigInt(tx.r),
                BigInt(tx.s),
            ])
            value = Buffer.concat([Buffer.from([0x03]), Buffer.from(payload)])
        } else if (tx.type == '0x4') {
            // https://eips.ethereum.org/EIPS/eip-7702
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                BigInt(tx.nonce),
                BigInt(assertNotNull(tx.maxPriorityFeePerGas)),
                BigInt(assertNotNull(tx.maxFeePerGas)),
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
            value = Buffer.concat([Buffer.from([0x04]), Buffer.from(payload)])
        } else if (tx.type == '0x64') {
            // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L338
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                decodeHex(assertNotNull(tx.requestId)),
                decodeHex(tx.from),
                decodeHex(assertNotNull(tx.to)),
                BigInt(tx.value)
            ])
            value = Buffer.concat([Buffer.from([0x64]), Buffer.from(payload)])
        } else if (tx.type == '0x66') {
            // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L104
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                decodeHex(assertNotNull(tx.requestId)),
                decodeHex(tx.from),
                BigInt(tx.gasPrice),
                BigInt(tx.gas),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(tx.value),
                decodeHex(tx.input)
            ])
            value = Buffer.concat([Buffer.from([0x66]), Buffer.from(payload)])
        } else if (tx.type == '0x68') {
            // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L161
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                BigInt(tx.nonce),
                decodeHex(tx.from),
                BigInt(tx.gasPrice),
                BigInt(tx.gas),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(tx.value),
                decodeHex(tx.input),
                decodeHex(assertNotNull(tx.ticketId)),
                decodeHex(assertNotNull(tx.refundTo)),
                BigInt(assertNotNull(tx.maxRefund)),
                BigInt(assertNotNull(tx.submissionFeeRefund))
            ])
            value = Buffer.concat([Buffer.from([0x68]), Buffer.from(payload)])
        } else if (tx.type == '0x69') {
            // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L232
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                decodeHex(assertNotNull(tx.requestId)),
                decodeHex(tx.from),
                BigInt(assertNotNull(tx.l1BaseFee)),
                BigInt(assertNotNull(tx.depositValue)),
                BigInt(tx.gasPrice),
                BigInt(tx.gas),
                tx.retryTo ? decodeHex(tx.retryTo) : Buffer.alloc(0),
                BigInt(assertNotNull(tx.retryValue)),
                decodeHex(assertNotNull(tx.beneficiary)),
                BigInt(assertNotNull(tx.maxSubmissionFee)),
                decodeHex(assertNotNull(tx.refundTo)),
                decodeHex(assertNotNull(tx.retryData)),
            ])
            value = Buffer.concat([Buffer.from([0x69]), Buffer.from(payload)])
        } else if (tx.type == '0x6a') {
            // https://github.com/OffchainLabs/go-ethereum/blob/7503143fd13f73e46a966ea2c42a058af96f7fcf/core/types/arb_types.go#L387
            let payload = RLP.encode([
                BigInt(assertNotNull(tx.chainId)),
                decodeHex(tx.input),
            ])
            value = Buffer.concat([Buffer.from([0x6a]), Buffer.from(payload)])
        } else if (tx.type == '0x7e') {
            // https://github.com/ethereum-optimism/optimism/blob/9ff3ebb3983be52c3ca189423ae7b4aec94e0fde/specs/deposits.md#the-deposited-transaction-type
            let payload = RLP.encode([
                decodeHex(assertNotNull(tx.sourceHash)),
                decodeHex(tx.from),
                tx.to ? decodeHex(tx.to) : Buffer.alloc(0),
                BigInt(tx.mint ?? 0),
                BigInt(tx.value),
                BigInt(tx.gas),
                0, // check if 0 is capable to substitute false
                decodeHex(tx.input)
            ])
            value = Buffer.concat([Buffer.from([0x7e]), Buffer.from(payload)])
        } else {
            throw unexpectedCase(tx.type)
        }

        await trie.put(key, value)
    }

    return toHex(trie.root())
}
