import { addErrorContext } from '@subsquid/util-internal'
import { Transaction, GetBlock, TransactionInput, TransactionOutput } from './rpc-data'
import { BareHex } from './validators'
import { hash } from 'node:crypto'
import assert from 'node:assert'

function LEHexToBuf(hex: BareHex): Buffer {
  return Buffer.from(hex, 'hex').reverse()
}

function bufToLEHex(buff: Buffer): BareHex {
  return buff.reverse().toString('hex')
}

const ZERO_HASH = '0'.repeat(64)

function doubleSha256(payload: Buffer): Buffer {
  const pass1 = hash('sha256', payload, 'buffer')
  const pass2 = hash('sha256', pass1, 'buffer')
  return pass2
}

function u32LE(n: number): Buffer {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(n)
  return b
}

function u64LE(n: bigint) {
  const b = Buffer.alloc(8)
  b.writeBigUInt64LE(n)
  return b
}

function varInt(n: number | bigint): Buffer {
  const x = typeof n === "bigint" ? n : BigInt(n)
  if (x < 0xfdn) return Buffer.from([Number(x)])
  if (x <= 0xffffn) {
    const b = Buffer.alloc(3)
    b[0] = 0xfd
    b.writeUInt16LE(Number(x), 1)
    return b
  }
  if (x <= 0xffffffffn) {
    const b = Buffer.alloc(5)
    b[0] = 0xfe
    b.writeUInt32LE(Number(x), 1)
    return b
  }
  const b = Buffer.alloc(9)
  b[0] = 0xff
  b.writeBigUInt64LE(x, 1)
  return b
}

function btcToSats(btc: number | string): bigint {
  const [whole, frac = ""] = btc.toString().split(".")
  const fracPadded = (frac + "00000000").slice(0, 8)
  return BigInt(whole) * 100000000n + BigInt(fracPadded)
}

function merkleRoot(hashes: Buffer[]): Buffer {
  if (!hashes.length) {
    return Buffer.alloc(32).fill(0)
  }
  let level = hashes

  while (level.length > 1) {
    if (level.length % 2 === 1) {
      level.push(level[level.length - 1]) // duplicate last if odd
    }

    const next = []
    for (let i = 0; i < level.length; i += 2) {
      next.push(doubleSha256(Buffer.concat([level[i], level[i + 1]])))
    }
    level = next
  }

  return level[0]
}

export function blockHash(block: GetBlock): BareHex {
  const previousHash = block.previousblockhash ?? ZERO_HASH
  const payload = Buffer.concat([
    u32LE(block.version),
    LEHexToBuf(previousHash),
    LEHexToBuf(block.merkleroot),
    u32LE(block.time),
    LEHexToBuf(block.bits),
    u32LE(block.nonce)
  ])
  const blockHash = doubleSha256(payload)

  return bufToLEHex(blockHash)
}

function encodeOutpoint(vin: TransactionInput): Buffer {
  // coinbase has no txid/vout outpoint
  if ('coinbase' in vin) {
    // coinbase "prevout": 32 bytes of 0x00 + 0xffffffff
    return Buffer.concat([Buffer.alloc(32, 0x00), Buffer.from("ffffffff", "hex")])
  }
  return Buffer.concat([
    LEHexToBuf(vin.txid),
    u32LE(vin.vout),
  ])
}

function encodeScript(hexScript: BareHex): Buffer {
  const s = Buffer.from(hexScript, 'hex')
  return Buffer.concat([varInt(s.length), s])
}

function encodeVin(vin: TransactionInput): Buffer {
  // scriptSig is in vin.scriptSig.hex for normal inputs
  // coinbase uses vin.coinbase as the scriptSig bytes
  const scriptHex = 'coinbase' in vin ? vin.coinbase : (vin.scriptSig?.hex || "")
  const seq = vin.sequence ?? 0xffffffff

  return Buffer.concat([
    encodeOutpoint(vin),
    encodeScript(scriptHex),
    u32LE(seq),
  ])
}

function encodeVout(vout: TransactionOutput): Buffer {
  // value is BTC in RPC; we need satoshis
  const sats = btcToSats(vout.value)

  const pkScriptHex = vout.scriptPubKey?.hex || ""
  return Buffer.concat([
    u64LE(sats),
    encodeScript(pkScriptHex),
  ])
}

function encodeWitnessStack(witness?: BareHex[]): Buffer {
  const items = witness ?? []
  const parts: Buffer[] = [varInt(items.length)]
  for (const item of items) {
    parts.push(encodeScript(item))
  }
  return Buffer.concat(parts)
}

function hasWitness(tx: Transaction): boolean {
  return tx.vin.some((vin) => 'coinbase' in vin ? false : (vin.txinwitness?.length ?? 0) > 0)
}

function encodeTransaction(tx: Transaction, opts?: { withWitness?: boolean }): Buffer {
  const version = tx.version ?? 1
  const locktime = tx.locktime ?? 0

  const vinParts = tx.vin.map(encodeVin)
  const voutParts = tx.vout.map(encodeVout)
  const useWitness = opts?.withWitness && hasWitness(tx)

  const parts: Buffer[] = [u32LE(version)]

  if (useWitness) {
    parts.push(Buffer.from([0x00, 0x01]))
  }

  parts.push(varInt(tx.vin.length))
  parts.push(...vinParts)
  parts.push(varInt(tx.vout.length))
  parts.push(...voutParts)

  if (useWitness) {
    for (const vin of tx.vin) {
      if ('coinbase' in vin) {
        parts.push(encodeWitnessStack([]))
      } else {
        parts.push(encodeWitnessStack(vin.txinwitness ?? undefined))
      }
    }
  }

  parts.push(u32LE(locktime))

  return Buffer.concat(parts)
}

export function txid(tx: Transaction): BareHex {
  const serialized = encodeTransaction(tx, { withWitness: false })
  const hash = doubleSha256(serialized)
  return bufToLEHex(hash)
}

function merkleRootFromTxids(txids: BareHex[]): Buffer {
  const transactionHashesLE = txids.map((txid) => LEHexToBuf(txid))
  return merkleRoot(transactionHashesLE)
}

export function transactionsRoot(transactions: Transaction[]) {
  const txids: BareHex[] = []
  for (const [idx, tx] of transactions.entries()) {
    try {
      const calcTxid = txid(tx)
      assert.equal(tx.txid, calcTxid, 'invalid tx id')
      txids.push(txid(tx))
    } catch (err: any) {
      throw addErrorContext(err, {
        transactionIndex: idx,
        transactionId: tx.txid,
        transactionHash: tx.hash
      })
    }
  }

  return bufToLEHex(merkleRootFromTxids(txids))
}

export function wtxid(tx: Transaction): BareHex {
  const serialized = encodeTransaction(tx, { withWitness: true })
  const hash = doubleSha256(serialized)
  return bufToLEHex(hash)
}

export function witnessCommitment(transactions: Transaction[]): BareHex | null {
  const coinbase = transactions[0]
  const commitment = extractWitnessCommitment(coinbase)
  if (!commitment) return null

  const wtxids = transactions.map((tx, i) => (i === 0 ? ZERO_HASH : wtxid(tx)))
  const root = merkleRootFromTxids(wtxids)
  const coinbaseReserved = extractWitnessReservedValue(coinbase)
  const payload = Buffer.concat([root, coinbaseReserved])
  return doubleSha256(payload).toString('hex')
}

export function coinbaseWitnessCommitment(transactions: Transaction[]): BareHex | null {
  return extractWitnessCommitment(transactions[0])
}

function extractWitnessCommitment(coinbase: Transaction): BareHex | null {
  for (const out of coinbase.vout) {
    const script = out.scriptPubKey?.hex ?? ''
    if (script.length < 36 * 2) continue
    if (script.startsWith('6a24aa21a9ed') && script.length >= 12 + 64) {
      return script.slice(12, 12 + 64)
    }
  }
  return null
}

function extractWitnessReservedValue(coinbase: Transaction): Buffer {
  const vin = coinbase.vin[0]
  if (!vin || !('coinbase' in vin)) return Buffer.alloc(32, 0)
  const witness = vin.txinwitness
  if (!witness || witness.length === 0 || witness[0].length !== 64) {
    return Buffer.alloc(32, 0)
  }
  return Buffer.from(witness[0], 'hex')
}
