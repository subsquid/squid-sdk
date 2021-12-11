export const BLOCK_PAD_LENGTH = 10
export const INDEX_PAD_LENGTH = 6
export const HASH_PAD_LENGTH = 5

/**
 * Formats the event id into a fixed-lentgth string. When formatted the natural string ordering
 * is the same as the ordering
 * in the blockchain (first ordered by block height, then by block ID)
 *
 * @return  id in the format 000000..00<blockNum>-000<index>
 *
 */
export function formatEventId(blockNumber: number, index: number): string {
  const blockPart = `${String(blockNumber).padStart(BLOCK_PAD_LENGTH, '0')}`
  const indexPart = `${String(index).padStart(INDEX_PAD_LENGTH, '0')}`
  return `${blockPart}-${indexPart}`
}

/**
 * Formats the event id into a fixed-lentgth string. When formatted the natural string ordering
 * is the same as the ordering
 * in the blockchain (first ordered by block height, then by block ID)
 *
 * @return  id in the format 000000..00<blockNum>-000<index>-<shorthash>
 *
 */
export function formatId({
  height,
  index,
  hash,
}: {
  height: number
  index?: number
  hash: string
}): string {
  const blockPart = `${String(height).padStart(BLOCK_PAD_LENGTH, '0')}`
  const indexPart =
    index !== undefined
      ? `-${String(index).padStart(INDEX_PAD_LENGTH, '0')}`
      : ''
  const _hash = hash.startsWith('0x') ? hash.substring(2) : hash
  const shortHash =
    _hash.length < HASH_PAD_LENGTH
      ? _hash.padEnd(HASH_PAD_LENGTH, '0')
      : _hash.slice(0, HASH_PAD_LENGTH)
  return `${blockPart}${indexPart}-${shortHash}`
}
