import { GetBlock, Transaction } from './rpc-data'
import fs from 'fs'
import assert from 'node:assert'
import { blockHash, coinbaseWitnessCommitment, transactionsRoot, witnessCommitment } from './verification'


export function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error("Usage: ts-node src/testing.ts <block.json>")
    process.exit(1)
  }
  console.error(`Reading ${filePath}...`)
  const block: GetBlock = JSON.parse(fs.readFileSync(filePath).toString()).result
  const hash = blockHash(block)
  const transactions = block.tx as Transaction[]
  const txRoot = transactionsRoot(transactions)
  console.error("Checking block hash...")
  assert.equal(block.hash, hash)
  console.error("Checking tx root...")
  assert.equal(block.merkleroot, txRoot)
  console.error("Checking witness data...")
  const commitment = witnessCommitment(transactions)
  const coinbaseCommitment = coinbaseWitnessCommitment(transactions)
  assert.equal(
    commitment,
    coinbaseCommitment,
    "failed to verify witness commitment",
  )
  console.error('OK!')
}

main()
