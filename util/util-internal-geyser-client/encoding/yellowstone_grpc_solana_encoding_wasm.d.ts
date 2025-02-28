/* tslint:disable */
/* eslint-disable */
/**
 * @param {Uint8Array} data
 * @param {WasmUiTransactionEncoding} encoding
 * @param {number | undefined} max_supported_transaction_version
 * @param {boolean} show_rewards
 * @returns {string}
 */
export function encode_tx(data: Uint8Array, encoding: WasmUiTransactionEncoding, max_supported_transaction_version: number | undefined, show_rewards: boolean): string;
/**
 * @param {Uint8Array} err
 * @returns {string}
 */
export function decode_tx_error(err: Uint8Array): string;
/**
 * Initialize Javascript logging and panic handler
 */
export function solana_program_init(): void;
export enum WasmUiTransactionEncoding {
  Binary = 0,
  Base64 = 1,
  Base58 = 2,
  Json = 3,
  JsonParsed = 4,
}
/**
 * A hash; the 32-byte output of a hashing algorithm.
 *
 * This struct is used most often in `solana-sdk` and related crates to contain
 * a [SHA-256] hash, but may instead contain a [blake3] hash.
 *
 * [SHA-256]: https://en.wikipedia.org/wiki/SHA-2
 * [blake3]: https://github.com/BLAKE3-team/BLAKE3
 */
export class Hash {
  free(): void;
  /**
   * Create a new Hash object
   *
   * * `value` - optional hash as a base58 encoded string, `Uint8Array`, `[number]`
   * @param {any} value
   */
  constructor(value: any);
  /**
   * Return the base58 string representation of the hash
   * @returns {string}
   */
  toString(): string;
  /**
   * Checks if two `Hash`s are equal
   * @param {Hash} other
   * @returns {boolean}
   */
  equals(other: Hash): boolean;
  /**
   * Return the `Uint8Array` representation of the hash
   * @returns {Uint8Array}
   */
  toBytes(): Uint8Array;
}
/**
 * wasm-bindgen version of the Instruction struct.
 * This duplication is required until https://github.com/rustwasm/wasm-bindgen/issues/3671
 * is fixed. This must not diverge from the regular non-wasm Instruction struct.
 */
export class Instruction {
  free(): void;
}
export class Instructions {
  free(): void;
  constructor();
  /**
   * @param {Instruction} instruction
   */
  push(instruction: Instruction): void;
}
/**
 * A vanilla Ed25519 key pair
 */
export class Keypair {
  free(): void;
  /**
   * Create a new `Keypair `
   */
  constructor();
  /**
   * Convert a `Keypair` to a `Uint8Array`
   * @returns {Uint8Array}
   */
  toBytes(): Uint8Array;
  /**
   * Recover a `Keypair` from a `Uint8Array`
   * @param {Uint8Array} bytes
   * @returns {Keypair}
   */
  static fromBytes(bytes: Uint8Array): Keypair;
  /**
   * Return the `Pubkey` for this `Keypair`
   * @returns {Pubkey}
   */
  pubkey(): Pubkey;
}
/**
 * wasm-bindgen version of the Message struct.
 * This duplication is required until https://github.com/rustwasm/wasm-bindgen/issues/3671
 * is fixed. This must not diverge from the regular non-wasm Message struct.
 */
export class Message {
  free(): void;
/**
 * The id of a recent ledger entry.
 */
  recent_blockhash: Hash;
}
/**
 * The address of a [Solana account][acc].
 *
 * Some account addresses are [ed25519] public keys, with corresponding secret
 * keys that are managed off-chain. Often, though, account addresses do not
 * have corresponding secret keys &mdash; as with [_program derived
 * addresses_][pdas] &mdash; or the secret key is not relevant to the operation
 * of a program, and may have even been disposed of. As running Solana programs
 * can not safely create or manage secret keys, the full [`Keypair`] is not
 * defined in `solana-program` but in `solana-sdk`.
 *
 * [acc]: https://solana.com/docs/core/accounts
 * [ed25519]: https://ed25519.cr.yp.to/
 * [pdas]: https://solana.com/docs/core/cpi#program-derived-addresses
 * [`Keypair`]: https://docs.rs/solana-sdk/latest/solana_sdk/signer/keypair/struct.Keypair.html
 */
export class Pubkey {
  free(): void;
  /**
   * Create a new Pubkey object
   *
   * * `value` - optional public key as a base58 encoded string, `Uint8Array`, `[number]`
   * @param {any} value
   */
  constructor(value: any);
  /**
   * Return the base58 string representation of the public key
   * @returns {string}
   */
  toString(): string;
  /**
   * Check if a `Pubkey` is on the ed25519 curve.
   * @returns {boolean}
   */
  isOnCurve(): boolean;
  /**
   * Checks if two `Pubkey`s are equal
   * @param {Pubkey} other
   * @returns {boolean}
   */
  equals(other: Pubkey): boolean;
  /**
   * Return the `Uint8Array` representation of the public key
   * @returns {Uint8Array}
   */
  toBytes(): Uint8Array;
  /**
   * Derive a Pubkey from another Pubkey, string seed, and a program id
   * @param {Pubkey} base
   * @param {string} seed
   * @param {Pubkey} owner
   * @returns {Pubkey}
   */
  static createWithSeed(base: Pubkey, seed: string, owner: Pubkey): Pubkey;
  /**
   * Derive a program address from seeds and a program id
   * @param {any[]} seeds
   * @param {Pubkey} program_id
   * @returns {Pubkey}
   */
  static createProgramAddress(seeds: any[], program_id: Pubkey): Pubkey;
  /**
   * Find a valid program address
   *
   * Returns:
   * * `[PubKey, number]` - the program address and bump seed
   * @param {any[]} seeds
   * @param {Pubkey} program_id
   * @returns {any}
   */
  static findProgramAddress(seeds: any[], program_id: Pubkey): any;
}
/**
 * wasm-bindgen version of the Transaction struct.
 * This duplication is required until https://github.com/rustwasm/wasm-bindgen/issues/3671
 * is fixed. This must not diverge from the regular non-wasm Transaction struct.
 */
export class Transaction {
  free(): void;
  /**
   * Create a new `Transaction`
   * @param {Instructions} instructions
   * @param {Pubkey | undefined} [payer]
   */
  constructor(instructions: Instructions, payer?: Pubkey);
  /**
   * Return a message containing all data that should be signed.
   * @returns {Message}
   */
  message(): Message;
  /**
   * Return the serialized message data to sign.
   * @returns {Uint8Array}
   */
  messageData(): Uint8Array;
  /**
   * Verify the transaction
   */
  verify(): void;
  /**
   * @param {Keypair} keypair
   * @param {Hash} recent_blockhash
   */
  partialSign(keypair: Keypair, recent_blockhash: Hash): void;
  /**
   * @returns {boolean}
   */
  isSigned(): boolean;
  /**
   * @returns {Uint8Array}
   */
  toBytes(): Uint8Array;
  /**
   * @param {Uint8Array} bytes
   * @returns {Transaction}
   */
  static fromBytes(bytes: Uint8Array): Transaction;
}
