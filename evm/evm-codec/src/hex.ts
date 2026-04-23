/**
 * Hex helpers that operate on plain `Uint8Array`s. The codec layer keeps
 * all of its storage as `Uint8Array` (see `Sink.buf` and `Src.buf`) so
 * that the public API never hands a Buffer back to the caller; but
 * internally we take advantage of Node's native hex encoder/decoder on
 * `Buffer.prototype` because the pure-JS path is ~3-4x slower on large
 * calldata-sized inputs. A short pure-JS fallback is provided for
 * non-Node runtimes, where `Buffer` is not defined.
 *
 * Crucially none of this allocates an extra data copy: `Buffer.from(arr.buffer,
 * arr.byteOffset, arr.byteLength)` is a zero-copy view over the same
 * underlying `ArrayBuffer`, and the inverse — `write(..., 'hex')` — writes
 * directly into the target `Uint8Array`'s memory.
 */

const HAS_BUFFER = typeof Buffer !== 'undefined'

// Byte value → two lowercase hex chars. Used on the JS fallback path.
const BYTE_TO_HEX: string[] = (() => {
  const t: string[] = new Array(256)
  for (let i = 0; i < 256; i++) {
    t[i] = (i < 16 ? '0' : '') + i.toString(16)
  }
  return t
})()

// Hex-char code → nibble (0-15). 0xff marks an invalid char. Indexed by
// `char.charCodeAt()`; we only need codes 0-127 since all hex digits are
// ASCII. Used on the JS fallback path.
const HEX_CODE_TO_NIBBLE: Uint8Array = (() => {
  const t = new Uint8Array(128).fill(0xff)
  for (let i = 0; i < 10; i++) t[0x30 + i] = i // '0'-'9'
  for (let i = 0; i < 6; i++) t[0x61 + i] = 10 + i // 'a'-'f'
  for (let i = 0; i < 6; i++) t[0x41 + i] = 10 + i // 'A'-'F'
  return t
})()

/**
 * Lowercase-hex-encode `length` bytes of `buf` starting at `offset` into a
 * string. No leading `0x`.
 */
export function bytesToHexString(buf: Uint8Array, offset: number, length: number): string {
  if (HAS_BUFFER) {
    // Zero-copy Buffer view over the same memory; delegates to the
    // native hex encoder.
    return Buffer.from(buf.buffer, buf.byteOffset + offset, length).toString('hex')
  }
  let out = ''
  const end = offset + length
  for (let i = offset; i < end; i++) {
    out += BYTE_TO_HEX[buf[i]]
  }
  return out
}

/**
 * Decode `length` bytes of lowercase/uppercase hex text from `str`
 * (starting at `strOffset`) and write them into `dest` at `destOffset`.
 * Returns `true` on success, `false` if the input contained any
 * non-hex character. The destination is left partially written on
 * failure — callers should validate first if they care about that.
 */
export function writeHexInto(
  str: string,
  strOffset: number,
  length: number,
  dest: Uint8Array,
  destOffset: number,
): boolean {
  if (HAS_BUFFER) {
    // Native hex decoder writes straight into dest's memory via a
    // zero-copy Buffer view.
    const view = Buffer.from(dest.buffer, dest.byteOffset + destOffset, length)
    const src = strOffset === 0 ? str : str.slice(strOffset, strOffset + length * 2)
    return view.write(src, 'hex') === length
  }
  for (let i = 0; i < length; i++) {
    const hi = HEX_CODE_TO_NIBBLE[str.charCodeAt(strOffset + 2 * i)]
    const lo = HEX_CODE_TO_NIBBLE[str.charCodeAt(strOffset + 2 * i + 1)]
    if (hi === 0xff || lo === 0xff) return false
    dest[destOffset + i] = (hi << 4) | lo
  }
  return true
}

/**
 * Decode the hex substring of `str` starting at `strOffset` into a fresh
 * `Uint8Array`. Uses the native hex decoder when available — this is the
 * single-call form of {@link writeHexInto} and is ~2-3x faster on typical
 * calldata inputs than `new Uint8Array(len)` + `writeHexInto`. Returns
 * the decoded bytes.
 */
export function hexToBytes(str: string, strOffset: number = 0): Uint8Array {
  if (HAS_BUFFER) {
    // `Buffer.from(hex, 'hex')` allocates directly via the Buffer pool
    // (no extra zero-init, no view object), which is consistently the
    // fastest path. Buffer extends Uint8Array, so the return type is
    // compatible with every consumer of this helper.
    return Buffer.from(strOffset === 0 ? str : str.slice(strOffset), 'hex')
  }
  const len = (str.length - strOffset) >>> 1
  const out = new Uint8Array(len)
  writeHexInto(str, strOffset, len, out, 0)
  return out
}
