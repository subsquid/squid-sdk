/* eslint-disable */
import {
  CallOptions,
  ChannelCredentials,
  Client,
  ClientDuplexStream,
  ClientOptions,
  ClientUnaryCall,
  handleBidiStreamingCall,
  handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  ServiceError,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Timestamp } from "./google/protobuf/timestamp";
import {
  BlockHeight,
  Rewards,
  Transaction,
  TransactionError,
  TransactionStatusMeta,
  UnixTimestamp,
} from "./solana-storage";

export const protobufPackage = "geyser";

export enum CommitmentLevel {
  PROCESSED = 0,
  CONFIRMED = 1,
  FINALIZED = 2,
  UNRECOGNIZED = -1,
}

export function commitmentLevelFromJSON(object: any): CommitmentLevel {
  switch (object) {
    case 0:
    case "PROCESSED":
      return CommitmentLevel.PROCESSED;
    case 1:
    case "CONFIRMED":
      return CommitmentLevel.CONFIRMED;
    case 2:
    case "FINALIZED":
      return CommitmentLevel.FINALIZED;
    case -1:
    case "UNRECOGNIZED":
    default:
      return CommitmentLevel.UNRECOGNIZED;
  }
}

export function commitmentLevelToJSON(object: CommitmentLevel): string {
  switch (object) {
    case CommitmentLevel.PROCESSED:
      return "PROCESSED";
    case CommitmentLevel.CONFIRMED:
      return "CONFIRMED";
    case CommitmentLevel.FINALIZED:
      return "FINALIZED";
    case CommitmentLevel.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum SlotStatus {
  SLOT_PROCESSED = 0,
  SLOT_CONFIRMED = 1,
  SLOT_FINALIZED = 2,
  SLOT_FIRST_SHRED_RECEIVED = 3,
  SLOT_COMPLETED = 4,
  SLOT_CREATED_BANK = 5,
  SLOT_DEAD = 6,
  UNRECOGNIZED = -1,
}

export function slotStatusFromJSON(object: any): SlotStatus {
  switch (object) {
    case 0:
    case "SLOT_PROCESSED":
      return SlotStatus.SLOT_PROCESSED;
    case 1:
    case "SLOT_CONFIRMED":
      return SlotStatus.SLOT_CONFIRMED;
    case 2:
    case "SLOT_FINALIZED":
      return SlotStatus.SLOT_FINALIZED;
    case 3:
    case "SLOT_FIRST_SHRED_RECEIVED":
      return SlotStatus.SLOT_FIRST_SHRED_RECEIVED;
    case 4:
    case "SLOT_COMPLETED":
      return SlotStatus.SLOT_COMPLETED;
    case 5:
    case "SLOT_CREATED_BANK":
      return SlotStatus.SLOT_CREATED_BANK;
    case 6:
    case "SLOT_DEAD":
      return SlotStatus.SLOT_DEAD;
    case -1:
    case "UNRECOGNIZED":
    default:
      return SlotStatus.UNRECOGNIZED;
  }
}

export function slotStatusToJSON(object: SlotStatus): string {
  switch (object) {
    case SlotStatus.SLOT_PROCESSED:
      return "SLOT_PROCESSED";
    case SlotStatus.SLOT_CONFIRMED:
      return "SLOT_CONFIRMED";
    case SlotStatus.SLOT_FINALIZED:
      return "SLOT_FINALIZED";
    case SlotStatus.SLOT_FIRST_SHRED_RECEIVED:
      return "SLOT_FIRST_SHRED_RECEIVED";
    case SlotStatus.SLOT_COMPLETED:
      return "SLOT_COMPLETED";
    case SlotStatus.SLOT_CREATED_BANK:
      return "SLOT_CREATED_BANK";
    case SlotStatus.SLOT_DEAD:
      return "SLOT_DEAD";
    case SlotStatus.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface SubscribeRequest {
  accounts: { [key: string]: SubscribeRequestFilterAccounts };
  slots: { [key: string]: SubscribeRequestFilterSlots };
  transactions: { [key: string]: SubscribeRequestFilterTransactions };
  transactionsStatus: { [key: string]: SubscribeRequestFilterTransactions };
  blocks: { [key: string]: SubscribeRequestFilterBlocks };
  blocksMeta: { [key: string]: SubscribeRequestFilterBlocksMeta };
  entry: { [key: string]: SubscribeRequestFilterEntry };
  commitment?: CommitmentLevel | undefined;
  accountsDataSlice: SubscribeRequestAccountsDataSlice[];
  ping?: SubscribeRequestPing | undefined;
  fromSlot?: string | undefined;
}

export interface SubscribeRequest_AccountsEntry {
  key: string;
  value: SubscribeRequestFilterAccounts | undefined;
}

export interface SubscribeRequest_SlotsEntry {
  key: string;
  value: SubscribeRequestFilterSlots | undefined;
}

export interface SubscribeRequest_TransactionsEntry {
  key: string;
  value: SubscribeRequestFilterTransactions | undefined;
}

export interface SubscribeRequest_TransactionsStatusEntry {
  key: string;
  value: SubscribeRequestFilterTransactions | undefined;
}

export interface SubscribeRequest_BlocksEntry {
  key: string;
  value: SubscribeRequestFilterBlocks | undefined;
}

export interface SubscribeRequest_BlocksMetaEntry {
  key: string;
  value: SubscribeRequestFilterBlocksMeta | undefined;
}

export interface SubscribeRequest_EntryEntry {
  key: string;
  value: SubscribeRequestFilterEntry | undefined;
}

export interface SubscribeRequestFilterAccounts {
  account: string[];
  owner: string[];
  filters: SubscribeRequestFilterAccountsFilter[];
  nonemptyTxnSignature?: boolean | undefined;
}

export interface SubscribeRequestFilterAccountsFilter {
  memcmp?: SubscribeRequestFilterAccountsFilterMemcmp | undefined;
  datasize?: string | undefined;
  tokenAccountState?: boolean | undefined;
  lamports?: SubscribeRequestFilterAccountsFilterLamports | undefined;
}

export interface SubscribeRequestFilterAccountsFilterMemcmp {
  offset: string;
  bytes?: Uint8Array | undefined;
  base58?: string | undefined;
  base64?: string | undefined;
}

export interface SubscribeRequestFilterAccountsFilterLamports {
  eq?: string | undefined;
  ne?: string | undefined;
  lt?: string | undefined;
  gt?: string | undefined;
}

export interface SubscribeRequestFilterSlots {
  filterByCommitment?: boolean | undefined;
  interslotUpdates?: boolean | undefined;
}

export interface SubscribeRequestFilterTransactions {
  vote?: boolean | undefined;
  failed?: boolean | undefined;
  signature?: string | undefined;
  accountInclude: string[];
  accountExclude: string[];
  accountRequired: string[];
}

export interface SubscribeRequestFilterBlocks {
  accountInclude: string[];
  includeTransactions?: boolean | undefined;
  includeAccounts?: boolean | undefined;
  includeEntries?: boolean | undefined;
}

export interface SubscribeRequestFilterBlocksMeta {
}

export interface SubscribeRequestFilterEntry {
}

export interface SubscribeRequestAccountsDataSlice {
  offset: string;
  length: string;
}

export interface SubscribeRequestPing {
  id: number;
}

export interface SubscribeUpdate {
  filters: string[];
  account?: SubscribeUpdateAccount | undefined;
  slot?: SubscribeUpdateSlot | undefined;
  transaction?: SubscribeUpdateTransaction | undefined;
  transactionStatus?: SubscribeUpdateTransactionStatus | undefined;
  block?: SubscribeUpdateBlock | undefined;
  ping?: SubscribeUpdatePing | undefined;
  pong?: SubscribeUpdatePong | undefined;
  blockMeta?: SubscribeUpdateBlockMeta | undefined;
  entry?: SubscribeUpdateEntry | undefined;
  createdAt: Date | undefined;
}

export interface SubscribeUpdateAccount {
  account: SubscribeUpdateAccountInfo | undefined;
  slot: string;
  isStartup: boolean;
}

export interface SubscribeUpdateAccountInfo {
  pubkey: Uint8Array;
  lamports: string;
  owner: Uint8Array;
  executable: boolean;
  rentEpoch: string;
  data: Uint8Array;
  writeVersion: string;
  txnSignature?: Uint8Array | undefined;
}

export interface SubscribeUpdateSlot {
  slot: string;
  parent?: string | undefined;
  status: SlotStatus;
  deadError?: string | undefined;
}

export interface SubscribeUpdateTransaction {
  transaction: SubscribeUpdateTransactionInfo | undefined;
  slot: string;
}

export interface SubscribeUpdateTransactionInfo {
  signature: Uint8Array;
  isVote: boolean;
  transaction: Transaction | undefined;
  meta: TransactionStatusMeta | undefined;
  index: string;
}

export interface SubscribeUpdateTransactionStatus {
  slot: string;
  signature: Uint8Array;
  isVote: boolean;
  index: string;
  err: TransactionError | undefined;
}

export interface SubscribeUpdateBlock {
  slot: string;
  blockhash: string;
  rewards: Rewards | undefined;
  blockTime: UnixTimestamp | undefined;
  blockHeight: BlockHeight | undefined;
  parentSlot: string;
  parentBlockhash: string;
  executedTransactionCount: string;
  transactions: SubscribeUpdateTransactionInfo[];
  updatedAccountCount: string;
  accounts: SubscribeUpdateAccountInfo[];
  entriesCount: string;
  entries: SubscribeUpdateEntry[];
}

export interface SubscribeUpdateBlockMeta {
  slot: string;
  blockhash: string;
  rewards: Rewards | undefined;
  blockTime: UnixTimestamp | undefined;
  blockHeight: BlockHeight | undefined;
  parentSlot: string;
  parentBlockhash: string;
  executedTransactionCount: string;
  entriesCount: string;
}

export interface SubscribeUpdateEntry {
  slot: string;
  index: string;
  numHashes: string;
  hash: Uint8Array;
  executedTransactionCount: string;
  /** added in v1.18, for solana 1.17 value is always 0 */
  startingTransactionIndex: string;
}

export interface SubscribeUpdatePing {
}

export interface SubscribeUpdatePong {
  id: number;
}

export interface PingRequest {
  count: number;
}

export interface PongResponse {
  count: number;
}

export interface GetLatestBlockhashRequest {
  commitment?: CommitmentLevel | undefined;
}

export interface GetLatestBlockhashResponse {
  slot: string;
  blockhash: string;
  lastValidBlockHeight: string;
}

export interface GetBlockHeightRequest {
  commitment?: CommitmentLevel | undefined;
}

export interface GetBlockHeightResponse {
  blockHeight: string;
}

export interface GetSlotRequest {
  commitment?: CommitmentLevel | undefined;
}

export interface GetSlotResponse {
  slot: string;
}

export interface GetVersionRequest {
}

export interface GetVersionResponse {
  version: string;
}

export interface IsBlockhashValidRequest {
  blockhash: string;
  commitment?: CommitmentLevel | undefined;
}

export interface IsBlockhashValidResponse {
  slot: string;
  valid: boolean;
}

function createBaseSubscribeRequest(): SubscribeRequest {
  return {
    accounts: {},
    slots: {},
    transactions: {},
    transactionsStatus: {},
    blocks: {},
    blocksMeta: {},
    entry: {},
    commitment: undefined,
    accountsDataSlice: [],
    ping: undefined,
    fromSlot: undefined,
  };
}

export const SubscribeRequest = {
  encode(message: SubscribeRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.accounts).forEach(([key, value]) => {
      SubscribeRequest_AccountsEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    Object.entries(message.slots).forEach(([key, value]) => {
      SubscribeRequest_SlotsEntry.encode({ key: key as any, value }, writer.uint32(18).fork()).ldelim();
    });
    Object.entries(message.transactions).forEach(([key, value]) => {
      SubscribeRequest_TransactionsEntry.encode({ key: key as any, value }, writer.uint32(26).fork()).ldelim();
    });
    Object.entries(message.transactionsStatus).forEach(([key, value]) => {
      SubscribeRequest_TransactionsStatusEntry.encode({ key: key as any, value }, writer.uint32(82).fork()).ldelim();
    });
    Object.entries(message.blocks).forEach(([key, value]) => {
      SubscribeRequest_BlocksEntry.encode({ key: key as any, value }, writer.uint32(34).fork()).ldelim();
    });
    Object.entries(message.blocksMeta).forEach(([key, value]) => {
      SubscribeRequest_BlocksMetaEntry.encode({ key: key as any, value }, writer.uint32(42).fork()).ldelim();
    });
    Object.entries(message.entry).forEach(([key, value]) => {
      SubscribeRequest_EntryEntry.encode({ key: key as any, value }, writer.uint32(66).fork()).ldelim();
    });
    if (message.commitment !== undefined) {
      writer.uint32(48).int32(message.commitment);
    }
    for (const v of message.accountsDataSlice) {
      SubscribeRequestAccountsDataSlice.encode(v!, writer.uint32(58).fork()).ldelim();
    }
    if (message.ping !== undefined) {
      SubscribeRequestPing.encode(message.ping, writer.uint32(74).fork()).ldelim();
    }
    if (message.fromSlot !== undefined) {
      writer.uint32(88).uint64(message.fromSlot);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          const entry1 = SubscribeRequest_AccountsEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.accounts[entry1.key] = entry1.value;
          }
          break;
        case 2:
          const entry2 = SubscribeRequest_SlotsEntry.decode(reader, reader.uint32());
          if (entry2.value !== undefined) {
            message.slots[entry2.key] = entry2.value;
          }
          break;
        case 3:
          const entry3 = SubscribeRequest_TransactionsEntry.decode(reader, reader.uint32());
          if (entry3.value !== undefined) {
            message.transactions[entry3.key] = entry3.value;
          }
          break;
        case 10:
          const entry10 = SubscribeRequest_TransactionsStatusEntry.decode(reader, reader.uint32());
          if (entry10.value !== undefined) {
            message.transactionsStatus[entry10.key] = entry10.value;
          }
          break;
        case 4:
          const entry4 = SubscribeRequest_BlocksEntry.decode(reader, reader.uint32());
          if (entry4.value !== undefined) {
            message.blocks[entry4.key] = entry4.value;
          }
          break;
        case 5:
          const entry5 = SubscribeRequest_BlocksMetaEntry.decode(reader, reader.uint32());
          if (entry5.value !== undefined) {
            message.blocksMeta[entry5.key] = entry5.value;
          }
          break;
        case 8:
          const entry8 = SubscribeRequest_EntryEntry.decode(reader, reader.uint32());
          if (entry8.value !== undefined) {
            message.entry[entry8.key] = entry8.value;
          }
          break;
        case 6:
          message.commitment = reader.int32() as any;
          break;
        case 7:
          message.accountsDataSlice.push(SubscribeRequestAccountsDataSlice.decode(reader, reader.uint32()));
          break;
        case 9:
          message.ping = SubscribeRequestPing.decode(reader, reader.uint32());
          break;
        case 11:
          message.fromSlot = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest {
    return {
      accounts: isObject(object.accounts)
        ? Object.entries(object.accounts).reduce<{ [key: string]: SubscribeRequestFilterAccounts }>(
          (acc, [key, value]) => {
            acc[key] = SubscribeRequestFilterAccounts.fromJSON(value);
            return acc;
          },
          {},
        )
        : {},
      slots: isObject(object.slots)
        ? Object.entries(object.slots).reduce<{ [key: string]: SubscribeRequestFilterSlots }>((acc, [key, value]) => {
          acc[key] = SubscribeRequestFilterSlots.fromJSON(value);
          return acc;
        }, {})
        : {},
      transactions: isObject(object.transactions)
        ? Object.entries(object.transactions).reduce<{ [key: string]: SubscribeRequestFilterTransactions }>(
          (acc, [key, value]) => {
            acc[key] = SubscribeRequestFilterTransactions.fromJSON(value);
            return acc;
          },
          {},
        )
        : {},
      transactionsStatus: isObject(object.transactionsStatus)
        ? Object.entries(object.transactionsStatus).reduce<{ [key: string]: SubscribeRequestFilterTransactions }>(
          (acc, [key, value]) => {
            acc[key] = SubscribeRequestFilterTransactions.fromJSON(value);
            return acc;
          },
          {},
        )
        : {},
      blocks: isObject(object.blocks)
        ? Object.entries(object.blocks).reduce<{ [key: string]: SubscribeRequestFilterBlocks }>((acc, [key, value]) => {
          acc[key] = SubscribeRequestFilterBlocks.fromJSON(value);
          return acc;
        }, {})
        : {},
      blocksMeta: isObject(object.blocksMeta)
        ? Object.entries(object.blocksMeta).reduce<{ [key: string]: SubscribeRequestFilterBlocksMeta }>(
          (acc, [key, value]) => {
            acc[key] = SubscribeRequestFilterBlocksMeta.fromJSON(value);
            return acc;
          },
          {},
        )
        : {},
      entry: isObject(object.entry)
        ? Object.entries(object.entry).reduce<{ [key: string]: SubscribeRequestFilterEntry }>((acc, [key, value]) => {
          acc[key] = SubscribeRequestFilterEntry.fromJSON(value);
          return acc;
        }, {})
        : {},
      commitment: isSet(object.commitment) ? commitmentLevelFromJSON(object.commitment) : undefined,
      accountsDataSlice: Array.isArray(object?.accountsDataSlice)
        ? object.accountsDataSlice.map((e: any) => SubscribeRequestAccountsDataSlice.fromJSON(e))
        : [],
      ping: isSet(object.ping) ? SubscribeRequestPing.fromJSON(object.ping) : undefined,
      fromSlot: isSet(object.fromSlot) ? String(object.fromSlot) : undefined,
    };
  },

  toJSON(message: SubscribeRequest): unknown {
    const obj: any = {};
    obj.accounts = {};
    if (message.accounts) {
      Object.entries(message.accounts).forEach(([k, v]) => {
        obj.accounts[k] = SubscribeRequestFilterAccounts.toJSON(v);
      });
    }
    obj.slots = {};
    if (message.slots) {
      Object.entries(message.slots).forEach(([k, v]) => {
        obj.slots[k] = SubscribeRequestFilterSlots.toJSON(v);
      });
    }
    obj.transactions = {};
    if (message.transactions) {
      Object.entries(message.transactions).forEach(([k, v]) => {
        obj.transactions[k] = SubscribeRequestFilterTransactions.toJSON(v);
      });
    }
    obj.transactionsStatus = {};
    if (message.transactionsStatus) {
      Object.entries(message.transactionsStatus).forEach(([k, v]) => {
        obj.transactionsStatus[k] = SubscribeRequestFilterTransactions.toJSON(v);
      });
    }
    obj.blocks = {};
    if (message.blocks) {
      Object.entries(message.blocks).forEach(([k, v]) => {
        obj.blocks[k] = SubscribeRequestFilterBlocks.toJSON(v);
      });
    }
    obj.blocksMeta = {};
    if (message.blocksMeta) {
      Object.entries(message.blocksMeta).forEach(([k, v]) => {
        obj.blocksMeta[k] = SubscribeRequestFilterBlocksMeta.toJSON(v);
      });
    }
    obj.entry = {};
    if (message.entry) {
      Object.entries(message.entry).forEach(([k, v]) => {
        obj.entry[k] = SubscribeRequestFilterEntry.toJSON(v);
      });
    }
    message.commitment !== undefined &&
      (obj.commitment = message.commitment !== undefined ? commitmentLevelToJSON(message.commitment) : undefined);
    if (message.accountsDataSlice) {
      obj.accountsDataSlice = message.accountsDataSlice.map((e) =>
        e ? SubscribeRequestAccountsDataSlice.toJSON(e) : undefined
      );
    } else {
      obj.accountsDataSlice = [];
    }
    message.ping !== undefined && (obj.ping = message.ping ? SubscribeRequestPing.toJSON(message.ping) : undefined);
    message.fromSlot !== undefined && (obj.fromSlot = message.fromSlot);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest>, I>>(base?: I): SubscribeRequest {
    return SubscribeRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest>, I>>(object: I): SubscribeRequest {
    const message = createBaseSubscribeRequest();
    message.accounts = Object.entries(object.accounts ?? {}).reduce<{ [key: string]: SubscribeRequestFilterAccounts }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = SubscribeRequestFilterAccounts.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    message.slots = Object.entries(object.slots ?? {}).reduce<{ [key: string]: SubscribeRequestFilterSlots }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = SubscribeRequestFilterSlots.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    message.transactions = Object.entries(object.transactions ?? {}).reduce<
      { [key: string]: SubscribeRequestFilterTransactions }
    >((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = SubscribeRequestFilterTransactions.fromPartial(value);
      }
      return acc;
    }, {});
    message.transactionsStatus = Object.entries(object.transactionsStatus ?? {}).reduce<
      { [key: string]: SubscribeRequestFilterTransactions }
    >((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = SubscribeRequestFilterTransactions.fromPartial(value);
      }
      return acc;
    }, {});
    message.blocks = Object.entries(object.blocks ?? {}).reduce<{ [key: string]: SubscribeRequestFilterBlocks }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = SubscribeRequestFilterBlocks.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    message.blocksMeta = Object.entries(object.blocksMeta ?? {}).reduce<
      { [key: string]: SubscribeRequestFilterBlocksMeta }
    >((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = SubscribeRequestFilterBlocksMeta.fromPartial(value);
      }
      return acc;
    }, {});
    message.entry = Object.entries(object.entry ?? {}).reduce<{ [key: string]: SubscribeRequestFilterEntry }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = SubscribeRequestFilterEntry.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    message.commitment = object.commitment ?? undefined;
    message.accountsDataSlice =
      object.accountsDataSlice?.map((e) => SubscribeRequestAccountsDataSlice.fromPartial(e)) || [];
    message.ping = (object.ping !== undefined && object.ping !== null)
      ? SubscribeRequestPing.fromPartial(object.ping)
      : undefined;
    message.fromSlot = object.fromSlot ?? undefined;
    return message;
  },
};

function createBaseSubscribeRequest_AccountsEntry(): SubscribeRequest_AccountsEntry {
  return { key: "", value: undefined };
}

export const SubscribeRequest_AccountsEntry = {
  encode(message: SubscribeRequest_AccountsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SubscribeRequestFilterAccounts.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest_AccountsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest_AccountsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SubscribeRequestFilterAccounts.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest_AccountsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SubscribeRequestFilterAccounts.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SubscribeRequest_AccountsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SubscribeRequestFilterAccounts.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest_AccountsEntry>, I>>(base?: I): SubscribeRequest_AccountsEntry {
    return SubscribeRequest_AccountsEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest_AccountsEntry>, I>>(
    object: I,
  ): SubscribeRequest_AccountsEntry {
    const message = createBaseSubscribeRequest_AccountsEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SubscribeRequestFilterAccounts.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequest_SlotsEntry(): SubscribeRequest_SlotsEntry {
  return { key: "", value: undefined };
}

export const SubscribeRequest_SlotsEntry = {
  encode(message: SubscribeRequest_SlotsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SubscribeRequestFilterSlots.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest_SlotsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest_SlotsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SubscribeRequestFilterSlots.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest_SlotsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SubscribeRequestFilterSlots.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SubscribeRequest_SlotsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SubscribeRequestFilterSlots.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest_SlotsEntry>, I>>(base?: I): SubscribeRequest_SlotsEntry {
    return SubscribeRequest_SlotsEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest_SlotsEntry>, I>>(object: I): SubscribeRequest_SlotsEntry {
    const message = createBaseSubscribeRequest_SlotsEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SubscribeRequestFilterSlots.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequest_TransactionsEntry(): SubscribeRequest_TransactionsEntry {
  return { key: "", value: undefined };
}

export const SubscribeRequest_TransactionsEntry = {
  encode(message: SubscribeRequest_TransactionsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SubscribeRequestFilterTransactions.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest_TransactionsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest_TransactionsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SubscribeRequestFilterTransactions.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest_TransactionsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SubscribeRequestFilterTransactions.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SubscribeRequest_TransactionsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SubscribeRequestFilterTransactions.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest_TransactionsEntry>, I>>(
    base?: I,
  ): SubscribeRequest_TransactionsEntry {
    return SubscribeRequest_TransactionsEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest_TransactionsEntry>, I>>(
    object: I,
  ): SubscribeRequest_TransactionsEntry {
    const message = createBaseSubscribeRequest_TransactionsEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SubscribeRequestFilterTransactions.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequest_TransactionsStatusEntry(): SubscribeRequest_TransactionsStatusEntry {
  return { key: "", value: undefined };
}

export const SubscribeRequest_TransactionsStatusEntry = {
  encode(message: SubscribeRequest_TransactionsStatusEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SubscribeRequestFilterTransactions.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest_TransactionsStatusEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest_TransactionsStatusEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SubscribeRequestFilterTransactions.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest_TransactionsStatusEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SubscribeRequestFilterTransactions.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SubscribeRequest_TransactionsStatusEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SubscribeRequestFilterTransactions.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest_TransactionsStatusEntry>, I>>(
    base?: I,
  ): SubscribeRequest_TransactionsStatusEntry {
    return SubscribeRequest_TransactionsStatusEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest_TransactionsStatusEntry>, I>>(
    object: I,
  ): SubscribeRequest_TransactionsStatusEntry {
    const message = createBaseSubscribeRequest_TransactionsStatusEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SubscribeRequestFilterTransactions.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequest_BlocksEntry(): SubscribeRequest_BlocksEntry {
  return { key: "", value: undefined };
}

export const SubscribeRequest_BlocksEntry = {
  encode(message: SubscribeRequest_BlocksEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SubscribeRequestFilterBlocks.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest_BlocksEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest_BlocksEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SubscribeRequestFilterBlocks.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest_BlocksEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SubscribeRequestFilterBlocks.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SubscribeRequest_BlocksEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SubscribeRequestFilterBlocks.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest_BlocksEntry>, I>>(base?: I): SubscribeRequest_BlocksEntry {
    return SubscribeRequest_BlocksEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest_BlocksEntry>, I>>(object: I): SubscribeRequest_BlocksEntry {
    const message = createBaseSubscribeRequest_BlocksEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SubscribeRequestFilterBlocks.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequest_BlocksMetaEntry(): SubscribeRequest_BlocksMetaEntry {
  return { key: "", value: undefined };
}

export const SubscribeRequest_BlocksMetaEntry = {
  encode(message: SubscribeRequest_BlocksMetaEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SubscribeRequestFilterBlocksMeta.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest_BlocksMetaEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest_BlocksMetaEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SubscribeRequestFilterBlocksMeta.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest_BlocksMetaEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SubscribeRequestFilterBlocksMeta.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SubscribeRequest_BlocksMetaEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SubscribeRequestFilterBlocksMeta.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest_BlocksMetaEntry>, I>>(
    base?: I,
  ): SubscribeRequest_BlocksMetaEntry {
    return SubscribeRequest_BlocksMetaEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest_BlocksMetaEntry>, I>>(
    object: I,
  ): SubscribeRequest_BlocksMetaEntry {
    const message = createBaseSubscribeRequest_BlocksMetaEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SubscribeRequestFilterBlocksMeta.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequest_EntryEntry(): SubscribeRequest_EntryEntry {
  return { key: "", value: undefined };
}

export const SubscribeRequest_EntryEntry = {
  encode(message: SubscribeRequest_EntryEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SubscribeRequestFilterEntry.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest_EntryEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest_EntryEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SubscribeRequestFilterEntry.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest_EntryEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SubscribeRequestFilterEntry.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SubscribeRequest_EntryEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SubscribeRequestFilterEntry.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest_EntryEntry>, I>>(base?: I): SubscribeRequest_EntryEntry {
    return SubscribeRequest_EntryEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest_EntryEntry>, I>>(object: I): SubscribeRequest_EntryEntry {
    const message = createBaseSubscribeRequest_EntryEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SubscribeRequestFilterEntry.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequestFilterAccounts(): SubscribeRequestFilterAccounts {
  return { account: [], owner: [], filters: [], nonemptyTxnSignature: undefined };
}

export const SubscribeRequestFilterAccounts = {
  encode(message: SubscribeRequestFilterAccounts, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.account) {
      writer.uint32(18).string(v!);
    }
    for (const v of message.owner) {
      writer.uint32(26).string(v!);
    }
    for (const v of message.filters) {
      SubscribeRequestFilterAccountsFilter.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    if (message.nonemptyTxnSignature !== undefined) {
      writer.uint32(40).bool(message.nonemptyTxnSignature);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterAccounts {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterAccounts();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.account.push(reader.string());
          break;
        case 3:
          message.owner.push(reader.string());
          break;
        case 4:
          message.filters.push(SubscribeRequestFilterAccountsFilter.decode(reader, reader.uint32()));
          break;
        case 5:
          message.nonemptyTxnSignature = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestFilterAccounts {
    return {
      account: Array.isArray(object?.account) ? object.account.map((e: any) => String(e)) : [],
      owner: Array.isArray(object?.owner) ? object.owner.map((e: any) => String(e)) : [],
      filters: Array.isArray(object?.filters)
        ? object.filters.map((e: any) => SubscribeRequestFilterAccountsFilter.fromJSON(e))
        : [],
      nonemptyTxnSignature: isSet(object.nonemptyTxnSignature) ? Boolean(object.nonemptyTxnSignature) : undefined,
    };
  },

  toJSON(message: SubscribeRequestFilterAccounts): unknown {
    const obj: any = {};
    if (message.account) {
      obj.account = message.account.map((e) => e);
    } else {
      obj.account = [];
    }
    if (message.owner) {
      obj.owner = message.owner.map((e) => e);
    } else {
      obj.owner = [];
    }
    if (message.filters) {
      obj.filters = message.filters.map((e) => e ? SubscribeRequestFilterAccountsFilter.toJSON(e) : undefined);
    } else {
      obj.filters = [];
    }
    message.nonemptyTxnSignature !== undefined && (obj.nonemptyTxnSignature = message.nonemptyTxnSignature);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterAccounts>, I>>(base?: I): SubscribeRequestFilterAccounts {
    return SubscribeRequestFilterAccounts.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterAccounts>, I>>(
    object: I,
  ): SubscribeRequestFilterAccounts {
    const message = createBaseSubscribeRequestFilterAccounts();
    message.account = object.account?.map((e) => e) || [];
    message.owner = object.owner?.map((e) => e) || [];
    message.filters = object.filters?.map((e) => SubscribeRequestFilterAccountsFilter.fromPartial(e)) || [];
    message.nonemptyTxnSignature = object.nonemptyTxnSignature ?? undefined;
    return message;
  },
};

function createBaseSubscribeRequestFilterAccountsFilter(): SubscribeRequestFilterAccountsFilter {
  return { memcmp: undefined, datasize: undefined, tokenAccountState: undefined, lamports: undefined };
}

export const SubscribeRequestFilterAccountsFilter = {
  encode(message: SubscribeRequestFilterAccountsFilter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.memcmp !== undefined) {
      SubscribeRequestFilterAccountsFilterMemcmp.encode(message.memcmp, writer.uint32(10).fork()).ldelim();
    }
    if (message.datasize !== undefined) {
      writer.uint32(16).uint64(message.datasize);
    }
    if (message.tokenAccountState !== undefined) {
      writer.uint32(24).bool(message.tokenAccountState);
    }
    if (message.lamports !== undefined) {
      SubscribeRequestFilterAccountsFilterLamports.encode(message.lamports, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterAccountsFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterAccountsFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.memcmp = SubscribeRequestFilterAccountsFilterMemcmp.decode(reader, reader.uint32());
          break;
        case 2:
          message.datasize = longToString(reader.uint64() as Long);
          break;
        case 3:
          message.tokenAccountState = reader.bool();
          break;
        case 4:
          message.lamports = SubscribeRequestFilterAccountsFilterLamports.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestFilterAccountsFilter {
    return {
      memcmp: isSet(object.memcmp) ? SubscribeRequestFilterAccountsFilterMemcmp.fromJSON(object.memcmp) : undefined,
      datasize: isSet(object.datasize) ? String(object.datasize) : undefined,
      tokenAccountState: isSet(object.tokenAccountState) ? Boolean(object.tokenAccountState) : undefined,
      lamports: isSet(object.lamports)
        ? SubscribeRequestFilterAccountsFilterLamports.fromJSON(object.lamports)
        : undefined,
    };
  },

  toJSON(message: SubscribeRequestFilterAccountsFilter): unknown {
    const obj: any = {};
    message.memcmp !== undefined &&
      (obj.memcmp = message.memcmp ? SubscribeRequestFilterAccountsFilterMemcmp.toJSON(message.memcmp) : undefined);
    message.datasize !== undefined && (obj.datasize = message.datasize);
    message.tokenAccountState !== undefined && (obj.tokenAccountState = message.tokenAccountState);
    message.lamports !== undefined && (obj.lamports = message.lamports
      ? SubscribeRequestFilterAccountsFilterLamports.toJSON(message.lamports)
      : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterAccountsFilter>, I>>(
    base?: I,
  ): SubscribeRequestFilterAccountsFilter {
    return SubscribeRequestFilterAccountsFilter.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterAccountsFilter>, I>>(
    object: I,
  ): SubscribeRequestFilterAccountsFilter {
    const message = createBaseSubscribeRequestFilterAccountsFilter();
    message.memcmp = (object.memcmp !== undefined && object.memcmp !== null)
      ? SubscribeRequestFilterAccountsFilterMemcmp.fromPartial(object.memcmp)
      : undefined;
    message.datasize = object.datasize ?? undefined;
    message.tokenAccountState = object.tokenAccountState ?? undefined;
    message.lamports = (object.lamports !== undefined && object.lamports !== null)
      ? SubscribeRequestFilterAccountsFilterLamports.fromPartial(object.lamports)
      : undefined;
    return message;
  },
};

function createBaseSubscribeRequestFilterAccountsFilterMemcmp(): SubscribeRequestFilterAccountsFilterMemcmp {
  return { offset: "0", bytes: undefined, base58: undefined, base64: undefined };
}

export const SubscribeRequestFilterAccountsFilterMemcmp = {
  encode(message: SubscribeRequestFilterAccountsFilterMemcmp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.offset !== "0") {
      writer.uint32(8).uint64(message.offset);
    }
    if (message.bytes !== undefined) {
      writer.uint32(18).bytes(message.bytes);
    }
    if (message.base58 !== undefined) {
      writer.uint32(26).string(message.base58);
    }
    if (message.base64 !== undefined) {
      writer.uint32(34).string(message.base64);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterAccountsFilterMemcmp {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterAccountsFilterMemcmp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.offset = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.bytes = reader.bytes();
          break;
        case 3:
          message.base58 = reader.string();
          break;
        case 4:
          message.base64 = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestFilterAccountsFilterMemcmp {
    return {
      offset: isSet(object.offset) ? String(object.offset) : "0",
      bytes: isSet(object.bytes) ? bytesFromBase64(object.bytes) : undefined,
      base58: isSet(object.base58) ? String(object.base58) : undefined,
      base64: isSet(object.base64) ? String(object.base64) : undefined,
    };
  },

  toJSON(message: SubscribeRequestFilterAccountsFilterMemcmp): unknown {
    const obj: any = {};
    message.offset !== undefined && (obj.offset = message.offset);
    message.bytes !== undefined &&
      (obj.bytes = message.bytes !== undefined ? base64FromBytes(message.bytes) : undefined);
    message.base58 !== undefined && (obj.base58 = message.base58);
    message.base64 !== undefined && (obj.base64 = message.base64);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterAccountsFilterMemcmp>, I>>(
    base?: I,
  ): SubscribeRequestFilterAccountsFilterMemcmp {
    return SubscribeRequestFilterAccountsFilterMemcmp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterAccountsFilterMemcmp>, I>>(
    object: I,
  ): SubscribeRequestFilterAccountsFilterMemcmp {
    const message = createBaseSubscribeRequestFilterAccountsFilterMemcmp();
    message.offset = object.offset ?? "0";
    message.bytes = object.bytes ?? undefined;
    message.base58 = object.base58 ?? undefined;
    message.base64 = object.base64 ?? undefined;
    return message;
  },
};

function createBaseSubscribeRequestFilterAccountsFilterLamports(): SubscribeRequestFilterAccountsFilterLamports {
  return { eq: undefined, ne: undefined, lt: undefined, gt: undefined };
}

export const SubscribeRequestFilterAccountsFilterLamports = {
  encode(message: SubscribeRequestFilterAccountsFilterLamports, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.eq !== undefined) {
      writer.uint32(8).uint64(message.eq);
    }
    if (message.ne !== undefined) {
      writer.uint32(16).uint64(message.ne);
    }
    if (message.lt !== undefined) {
      writer.uint32(24).uint64(message.lt);
    }
    if (message.gt !== undefined) {
      writer.uint32(32).uint64(message.gt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterAccountsFilterLamports {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterAccountsFilterLamports();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.eq = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.ne = longToString(reader.uint64() as Long);
          break;
        case 3:
          message.lt = longToString(reader.uint64() as Long);
          break;
        case 4:
          message.gt = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestFilterAccountsFilterLamports {
    return {
      eq: isSet(object.eq) ? String(object.eq) : undefined,
      ne: isSet(object.ne) ? String(object.ne) : undefined,
      lt: isSet(object.lt) ? String(object.lt) : undefined,
      gt: isSet(object.gt) ? String(object.gt) : undefined,
    };
  },

  toJSON(message: SubscribeRequestFilterAccountsFilterLamports): unknown {
    const obj: any = {};
    message.eq !== undefined && (obj.eq = message.eq);
    message.ne !== undefined && (obj.ne = message.ne);
    message.lt !== undefined && (obj.lt = message.lt);
    message.gt !== undefined && (obj.gt = message.gt);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterAccountsFilterLamports>, I>>(
    base?: I,
  ): SubscribeRequestFilterAccountsFilterLamports {
    return SubscribeRequestFilterAccountsFilterLamports.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterAccountsFilterLamports>, I>>(
    object: I,
  ): SubscribeRequestFilterAccountsFilterLamports {
    const message = createBaseSubscribeRequestFilterAccountsFilterLamports();
    message.eq = object.eq ?? undefined;
    message.ne = object.ne ?? undefined;
    message.lt = object.lt ?? undefined;
    message.gt = object.gt ?? undefined;
    return message;
  },
};

function createBaseSubscribeRequestFilterSlots(): SubscribeRequestFilterSlots {
  return { filterByCommitment: undefined, interslotUpdates: undefined };
}

export const SubscribeRequestFilterSlots = {
  encode(message: SubscribeRequestFilterSlots, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.filterByCommitment !== undefined) {
      writer.uint32(8).bool(message.filterByCommitment);
    }
    if (message.interslotUpdates !== undefined) {
      writer.uint32(16).bool(message.interslotUpdates);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterSlots {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterSlots();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.filterByCommitment = reader.bool();
          break;
        case 2:
          message.interslotUpdates = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestFilterSlots {
    return {
      filterByCommitment: isSet(object.filterByCommitment) ? Boolean(object.filterByCommitment) : undefined,
      interslotUpdates: isSet(object.interslotUpdates) ? Boolean(object.interslotUpdates) : undefined,
    };
  },

  toJSON(message: SubscribeRequestFilterSlots): unknown {
    const obj: any = {};
    message.filterByCommitment !== undefined && (obj.filterByCommitment = message.filterByCommitment);
    message.interslotUpdates !== undefined && (obj.interslotUpdates = message.interslotUpdates);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterSlots>, I>>(base?: I): SubscribeRequestFilterSlots {
    return SubscribeRequestFilterSlots.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterSlots>, I>>(object: I): SubscribeRequestFilterSlots {
    const message = createBaseSubscribeRequestFilterSlots();
    message.filterByCommitment = object.filterByCommitment ?? undefined;
    message.interslotUpdates = object.interslotUpdates ?? undefined;
    return message;
  },
};

function createBaseSubscribeRequestFilterTransactions(): SubscribeRequestFilterTransactions {
  return {
    vote: undefined,
    failed: undefined,
    signature: undefined,
    accountInclude: [],
    accountExclude: [],
    accountRequired: [],
  };
}

export const SubscribeRequestFilterTransactions = {
  encode(message: SubscribeRequestFilterTransactions, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.vote !== undefined) {
      writer.uint32(8).bool(message.vote);
    }
    if (message.failed !== undefined) {
      writer.uint32(16).bool(message.failed);
    }
    if (message.signature !== undefined) {
      writer.uint32(42).string(message.signature);
    }
    for (const v of message.accountInclude) {
      writer.uint32(26).string(v!);
    }
    for (const v of message.accountExclude) {
      writer.uint32(34).string(v!);
    }
    for (const v of message.accountRequired) {
      writer.uint32(50).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterTransactions {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterTransactions();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.vote = reader.bool();
          break;
        case 2:
          message.failed = reader.bool();
          break;
        case 5:
          message.signature = reader.string();
          break;
        case 3:
          message.accountInclude.push(reader.string());
          break;
        case 4:
          message.accountExclude.push(reader.string());
          break;
        case 6:
          message.accountRequired.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestFilterTransactions {
    return {
      vote: isSet(object.vote) ? Boolean(object.vote) : undefined,
      failed: isSet(object.failed) ? Boolean(object.failed) : undefined,
      signature: isSet(object.signature) ? String(object.signature) : undefined,
      accountInclude: Array.isArray(object?.accountInclude) ? object.accountInclude.map((e: any) => String(e)) : [],
      accountExclude: Array.isArray(object?.accountExclude) ? object.accountExclude.map((e: any) => String(e)) : [],
      accountRequired: Array.isArray(object?.accountRequired) ? object.accountRequired.map((e: any) => String(e)) : [],
    };
  },

  toJSON(message: SubscribeRequestFilterTransactions): unknown {
    const obj: any = {};
    message.vote !== undefined && (obj.vote = message.vote);
    message.failed !== undefined && (obj.failed = message.failed);
    message.signature !== undefined && (obj.signature = message.signature);
    if (message.accountInclude) {
      obj.accountInclude = message.accountInclude.map((e) => e);
    } else {
      obj.accountInclude = [];
    }
    if (message.accountExclude) {
      obj.accountExclude = message.accountExclude.map((e) => e);
    } else {
      obj.accountExclude = [];
    }
    if (message.accountRequired) {
      obj.accountRequired = message.accountRequired.map((e) => e);
    } else {
      obj.accountRequired = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterTransactions>, I>>(
    base?: I,
  ): SubscribeRequestFilterTransactions {
    return SubscribeRequestFilterTransactions.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterTransactions>, I>>(
    object: I,
  ): SubscribeRequestFilterTransactions {
    const message = createBaseSubscribeRequestFilterTransactions();
    message.vote = object.vote ?? undefined;
    message.failed = object.failed ?? undefined;
    message.signature = object.signature ?? undefined;
    message.accountInclude = object.accountInclude?.map((e) => e) || [];
    message.accountExclude = object.accountExclude?.map((e) => e) || [];
    message.accountRequired = object.accountRequired?.map((e) => e) || [];
    return message;
  },
};

function createBaseSubscribeRequestFilterBlocks(): SubscribeRequestFilterBlocks {
  return { accountInclude: [], includeTransactions: undefined, includeAccounts: undefined, includeEntries: undefined };
}

export const SubscribeRequestFilterBlocks = {
  encode(message: SubscribeRequestFilterBlocks, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.accountInclude) {
      writer.uint32(10).string(v!);
    }
    if (message.includeTransactions !== undefined) {
      writer.uint32(16).bool(message.includeTransactions);
    }
    if (message.includeAccounts !== undefined) {
      writer.uint32(24).bool(message.includeAccounts);
    }
    if (message.includeEntries !== undefined) {
      writer.uint32(32).bool(message.includeEntries);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterBlocks {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterBlocks();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.accountInclude.push(reader.string());
          break;
        case 2:
          message.includeTransactions = reader.bool();
          break;
        case 3:
          message.includeAccounts = reader.bool();
          break;
        case 4:
          message.includeEntries = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestFilterBlocks {
    return {
      accountInclude: Array.isArray(object?.accountInclude) ? object.accountInclude.map((e: any) => String(e)) : [],
      includeTransactions: isSet(object.includeTransactions) ? Boolean(object.includeTransactions) : undefined,
      includeAccounts: isSet(object.includeAccounts) ? Boolean(object.includeAccounts) : undefined,
      includeEntries: isSet(object.includeEntries) ? Boolean(object.includeEntries) : undefined,
    };
  },

  toJSON(message: SubscribeRequestFilterBlocks): unknown {
    const obj: any = {};
    if (message.accountInclude) {
      obj.accountInclude = message.accountInclude.map((e) => e);
    } else {
      obj.accountInclude = [];
    }
    message.includeTransactions !== undefined && (obj.includeTransactions = message.includeTransactions);
    message.includeAccounts !== undefined && (obj.includeAccounts = message.includeAccounts);
    message.includeEntries !== undefined && (obj.includeEntries = message.includeEntries);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterBlocks>, I>>(base?: I): SubscribeRequestFilterBlocks {
    return SubscribeRequestFilterBlocks.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterBlocks>, I>>(object: I): SubscribeRequestFilterBlocks {
    const message = createBaseSubscribeRequestFilterBlocks();
    message.accountInclude = object.accountInclude?.map((e) => e) || [];
    message.includeTransactions = object.includeTransactions ?? undefined;
    message.includeAccounts = object.includeAccounts ?? undefined;
    message.includeEntries = object.includeEntries ?? undefined;
    return message;
  },
};

function createBaseSubscribeRequestFilterBlocksMeta(): SubscribeRequestFilterBlocksMeta {
  return {};
}

export const SubscribeRequestFilterBlocksMeta = {
  encode(_: SubscribeRequestFilterBlocksMeta, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterBlocksMeta {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterBlocksMeta();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): SubscribeRequestFilterBlocksMeta {
    return {};
  },

  toJSON(_: SubscribeRequestFilterBlocksMeta): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterBlocksMeta>, I>>(
    base?: I,
  ): SubscribeRequestFilterBlocksMeta {
    return SubscribeRequestFilterBlocksMeta.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterBlocksMeta>, I>>(
    _: I,
  ): SubscribeRequestFilterBlocksMeta {
    const message = createBaseSubscribeRequestFilterBlocksMeta();
    return message;
  },
};

function createBaseSubscribeRequestFilterEntry(): SubscribeRequestFilterEntry {
  return {};
}

export const SubscribeRequestFilterEntry = {
  encode(_: SubscribeRequestFilterEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestFilterEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestFilterEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): SubscribeRequestFilterEntry {
    return {};
  },

  toJSON(_: SubscribeRequestFilterEntry): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestFilterEntry>, I>>(base?: I): SubscribeRequestFilterEntry {
    return SubscribeRequestFilterEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestFilterEntry>, I>>(_: I): SubscribeRequestFilterEntry {
    const message = createBaseSubscribeRequestFilterEntry();
    return message;
  },
};

function createBaseSubscribeRequestAccountsDataSlice(): SubscribeRequestAccountsDataSlice {
  return { offset: "0", length: "0" };
}

export const SubscribeRequestAccountsDataSlice = {
  encode(message: SubscribeRequestAccountsDataSlice, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.offset !== "0") {
      writer.uint32(8).uint64(message.offset);
    }
    if (message.length !== "0") {
      writer.uint32(16).uint64(message.length);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestAccountsDataSlice {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestAccountsDataSlice();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.offset = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.length = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestAccountsDataSlice {
    return {
      offset: isSet(object.offset) ? String(object.offset) : "0",
      length: isSet(object.length) ? String(object.length) : "0",
    };
  },

  toJSON(message: SubscribeRequestAccountsDataSlice): unknown {
    const obj: any = {};
    message.offset !== undefined && (obj.offset = message.offset);
    message.length !== undefined && (obj.length = message.length);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestAccountsDataSlice>, I>>(
    base?: I,
  ): SubscribeRequestAccountsDataSlice {
    return SubscribeRequestAccountsDataSlice.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestAccountsDataSlice>, I>>(
    object: I,
  ): SubscribeRequestAccountsDataSlice {
    const message = createBaseSubscribeRequestAccountsDataSlice();
    message.offset = object.offset ?? "0";
    message.length = object.length ?? "0";
    return message;
  },
};

function createBaseSubscribeRequestPing(): SubscribeRequestPing {
  return { id: 0 };
}

export const SubscribeRequestPing = {
  encode(message: SubscribeRequestPing, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).int32(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequestPing {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequestPing();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequestPing {
    return { id: isSet(object.id) ? Number(object.id) : 0 };
  },

  toJSON(message: SubscribeRequestPing): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = Math.round(message.id));
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequestPing>, I>>(base?: I): SubscribeRequestPing {
    return SubscribeRequestPing.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequestPing>, I>>(object: I): SubscribeRequestPing {
    const message = createBaseSubscribeRequestPing();
    message.id = object.id ?? 0;
    return message;
  },
};

function createBaseSubscribeUpdate(): SubscribeUpdate {
  return {
    filters: [],
    account: undefined,
    slot: undefined,
    transaction: undefined,
    transactionStatus: undefined,
    block: undefined,
    ping: undefined,
    pong: undefined,
    blockMeta: undefined,
    entry: undefined,
    createdAt: undefined,
  };
}

export const SubscribeUpdate = {
  encode(message: SubscribeUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.filters) {
      writer.uint32(10).string(v!);
    }
    if (message.account !== undefined) {
      SubscribeUpdateAccount.encode(message.account, writer.uint32(18).fork()).ldelim();
    }
    if (message.slot !== undefined) {
      SubscribeUpdateSlot.encode(message.slot, writer.uint32(26).fork()).ldelim();
    }
    if (message.transaction !== undefined) {
      SubscribeUpdateTransaction.encode(message.transaction, writer.uint32(34).fork()).ldelim();
    }
    if (message.transactionStatus !== undefined) {
      SubscribeUpdateTransactionStatus.encode(message.transactionStatus, writer.uint32(82).fork()).ldelim();
    }
    if (message.block !== undefined) {
      SubscribeUpdateBlock.encode(message.block, writer.uint32(42).fork()).ldelim();
    }
    if (message.ping !== undefined) {
      SubscribeUpdatePing.encode(message.ping, writer.uint32(50).fork()).ldelim();
    }
    if (message.pong !== undefined) {
      SubscribeUpdatePong.encode(message.pong, writer.uint32(74).fork()).ldelim();
    }
    if (message.blockMeta !== undefined) {
      SubscribeUpdateBlockMeta.encode(message.blockMeta, writer.uint32(58).fork()).ldelim();
    }
    if (message.entry !== undefined) {
      SubscribeUpdateEntry.encode(message.entry, writer.uint32(66).fork()).ldelim();
    }
    if (message.createdAt !== undefined) {
      Timestamp.encode(toTimestamp(message.createdAt), writer.uint32(90).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdate {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.filters.push(reader.string());
          break;
        case 2:
          message.account = SubscribeUpdateAccount.decode(reader, reader.uint32());
          break;
        case 3:
          message.slot = SubscribeUpdateSlot.decode(reader, reader.uint32());
          break;
        case 4:
          message.transaction = SubscribeUpdateTransaction.decode(reader, reader.uint32());
          break;
        case 10:
          message.transactionStatus = SubscribeUpdateTransactionStatus.decode(reader, reader.uint32());
          break;
        case 5:
          message.block = SubscribeUpdateBlock.decode(reader, reader.uint32());
          break;
        case 6:
          message.ping = SubscribeUpdatePing.decode(reader, reader.uint32());
          break;
        case 9:
          message.pong = SubscribeUpdatePong.decode(reader, reader.uint32());
          break;
        case 7:
          message.blockMeta = SubscribeUpdateBlockMeta.decode(reader, reader.uint32());
          break;
        case 8:
          message.entry = SubscribeUpdateEntry.decode(reader, reader.uint32());
          break;
        case 11:
          message.createdAt = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdate {
    return {
      filters: Array.isArray(object?.filters) ? object.filters.map((e: any) => String(e)) : [],
      account: isSet(object.account) ? SubscribeUpdateAccount.fromJSON(object.account) : undefined,
      slot: isSet(object.slot) ? SubscribeUpdateSlot.fromJSON(object.slot) : undefined,
      transaction: isSet(object.transaction) ? SubscribeUpdateTransaction.fromJSON(object.transaction) : undefined,
      transactionStatus: isSet(object.transactionStatus)
        ? SubscribeUpdateTransactionStatus.fromJSON(object.transactionStatus)
        : undefined,
      block: isSet(object.block) ? SubscribeUpdateBlock.fromJSON(object.block) : undefined,
      ping: isSet(object.ping) ? SubscribeUpdatePing.fromJSON(object.ping) : undefined,
      pong: isSet(object.pong) ? SubscribeUpdatePong.fromJSON(object.pong) : undefined,
      blockMeta: isSet(object.blockMeta) ? SubscribeUpdateBlockMeta.fromJSON(object.blockMeta) : undefined,
      entry: isSet(object.entry) ? SubscribeUpdateEntry.fromJSON(object.entry) : undefined,
      createdAt: isSet(object.createdAt) ? fromJsonTimestamp(object.createdAt) : undefined,
    };
  },

  toJSON(message: SubscribeUpdate): unknown {
    const obj: any = {};
    if (message.filters) {
      obj.filters = message.filters.map((e) => e);
    } else {
      obj.filters = [];
    }
    message.account !== undefined &&
      (obj.account = message.account ? SubscribeUpdateAccount.toJSON(message.account) : undefined);
    message.slot !== undefined && (obj.slot = message.slot ? SubscribeUpdateSlot.toJSON(message.slot) : undefined);
    message.transaction !== undefined &&
      (obj.transaction = message.transaction ? SubscribeUpdateTransaction.toJSON(message.transaction) : undefined);
    message.transactionStatus !== undefined && (obj.transactionStatus = message.transactionStatus
      ? SubscribeUpdateTransactionStatus.toJSON(message.transactionStatus)
      : undefined);
    message.block !== undefined && (obj.block = message.block ? SubscribeUpdateBlock.toJSON(message.block) : undefined);
    message.ping !== undefined && (obj.ping = message.ping ? SubscribeUpdatePing.toJSON(message.ping) : undefined);
    message.pong !== undefined && (obj.pong = message.pong ? SubscribeUpdatePong.toJSON(message.pong) : undefined);
    message.blockMeta !== undefined &&
      (obj.blockMeta = message.blockMeta ? SubscribeUpdateBlockMeta.toJSON(message.blockMeta) : undefined);
    message.entry !== undefined && (obj.entry = message.entry ? SubscribeUpdateEntry.toJSON(message.entry) : undefined);
    message.createdAt !== undefined && (obj.createdAt = message.createdAt.toISOString());
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdate>, I>>(base?: I): SubscribeUpdate {
    return SubscribeUpdate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdate>, I>>(object: I): SubscribeUpdate {
    const message = createBaseSubscribeUpdate();
    message.filters = object.filters?.map((e) => e) || [];
    message.account = (object.account !== undefined && object.account !== null)
      ? SubscribeUpdateAccount.fromPartial(object.account)
      : undefined;
    message.slot = (object.slot !== undefined && object.slot !== null)
      ? SubscribeUpdateSlot.fromPartial(object.slot)
      : undefined;
    message.transaction = (object.transaction !== undefined && object.transaction !== null)
      ? SubscribeUpdateTransaction.fromPartial(object.transaction)
      : undefined;
    message.transactionStatus = (object.transactionStatus !== undefined && object.transactionStatus !== null)
      ? SubscribeUpdateTransactionStatus.fromPartial(object.transactionStatus)
      : undefined;
    message.block = (object.block !== undefined && object.block !== null)
      ? SubscribeUpdateBlock.fromPartial(object.block)
      : undefined;
    message.ping = (object.ping !== undefined && object.ping !== null)
      ? SubscribeUpdatePing.fromPartial(object.ping)
      : undefined;
    message.pong = (object.pong !== undefined && object.pong !== null)
      ? SubscribeUpdatePong.fromPartial(object.pong)
      : undefined;
    message.blockMeta = (object.blockMeta !== undefined && object.blockMeta !== null)
      ? SubscribeUpdateBlockMeta.fromPartial(object.blockMeta)
      : undefined;
    message.entry = (object.entry !== undefined && object.entry !== null)
      ? SubscribeUpdateEntry.fromPartial(object.entry)
      : undefined;
    message.createdAt = object.createdAt ?? undefined;
    return message;
  },
};

function createBaseSubscribeUpdateAccount(): SubscribeUpdateAccount {
  return { account: undefined, slot: "0", isStartup: false };
}

export const SubscribeUpdateAccount = {
  encode(message: SubscribeUpdateAccount, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.account !== undefined) {
      SubscribeUpdateAccountInfo.encode(message.account, writer.uint32(10).fork()).ldelim();
    }
    if (message.slot !== "0") {
      writer.uint32(16).uint64(message.slot);
    }
    if (message.isStartup === true) {
      writer.uint32(24).bool(message.isStartup);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateAccount {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateAccount();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.account = SubscribeUpdateAccountInfo.decode(reader, reader.uint32());
          break;
        case 2:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 3:
          message.isStartup = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateAccount {
    return {
      account: isSet(object.account) ? SubscribeUpdateAccountInfo.fromJSON(object.account) : undefined,
      slot: isSet(object.slot) ? String(object.slot) : "0",
      isStartup: isSet(object.isStartup) ? Boolean(object.isStartup) : false,
    };
  },

  toJSON(message: SubscribeUpdateAccount): unknown {
    const obj: any = {};
    message.account !== undefined &&
      (obj.account = message.account ? SubscribeUpdateAccountInfo.toJSON(message.account) : undefined);
    message.slot !== undefined && (obj.slot = message.slot);
    message.isStartup !== undefined && (obj.isStartup = message.isStartup);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateAccount>, I>>(base?: I): SubscribeUpdateAccount {
    return SubscribeUpdateAccount.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateAccount>, I>>(object: I): SubscribeUpdateAccount {
    const message = createBaseSubscribeUpdateAccount();
    message.account = (object.account !== undefined && object.account !== null)
      ? SubscribeUpdateAccountInfo.fromPartial(object.account)
      : undefined;
    message.slot = object.slot ?? "0";
    message.isStartup = object.isStartup ?? false;
    return message;
  },
};

function createBaseSubscribeUpdateAccountInfo(): SubscribeUpdateAccountInfo {
  return {
    pubkey: new Uint8Array(),
    lamports: "0",
    owner: new Uint8Array(),
    executable: false,
    rentEpoch: "0",
    data: new Uint8Array(),
    writeVersion: "0",
    txnSignature: undefined,
  };
}

export const SubscribeUpdateAccountInfo = {
  encode(message: SubscribeUpdateAccountInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pubkey.length !== 0) {
      writer.uint32(10).bytes(message.pubkey);
    }
    if (message.lamports !== "0") {
      writer.uint32(16).uint64(message.lamports);
    }
    if (message.owner.length !== 0) {
      writer.uint32(26).bytes(message.owner);
    }
    if (message.executable === true) {
      writer.uint32(32).bool(message.executable);
    }
    if (message.rentEpoch !== "0") {
      writer.uint32(40).uint64(message.rentEpoch);
    }
    if (message.data.length !== 0) {
      writer.uint32(50).bytes(message.data);
    }
    if (message.writeVersion !== "0") {
      writer.uint32(56).uint64(message.writeVersion);
    }
    if (message.txnSignature !== undefined) {
      writer.uint32(66).bytes(message.txnSignature);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateAccountInfo {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateAccountInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.pubkey = reader.bytes();
          break;
        case 2:
          message.lamports = longToString(reader.uint64() as Long);
          break;
        case 3:
          message.owner = reader.bytes();
          break;
        case 4:
          message.executable = reader.bool();
          break;
        case 5:
          message.rentEpoch = longToString(reader.uint64() as Long);
          break;
        case 6:
          message.data = reader.bytes();
          break;
        case 7:
          message.writeVersion = longToString(reader.uint64() as Long);
          break;
        case 8:
          message.txnSignature = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateAccountInfo {
    return {
      pubkey: isSet(object.pubkey) ? bytesFromBase64(object.pubkey) : new Uint8Array(),
      lamports: isSet(object.lamports) ? String(object.lamports) : "0",
      owner: isSet(object.owner) ? bytesFromBase64(object.owner) : new Uint8Array(),
      executable: isSet(object.executable) ? Boolean(object.executable) : false,
      rentEpoch: isSet(object.rentEpoch) ? String(object.rentEpoch) : "0",
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(),
      writeVersion: isSet(object.writeVersion) ? String(object.writeVersion) : "0",
      txnSignature: isSet(object.txnSignature) ? bytesFromBase64(object.txnSignature) : undefined,
    };
  },

  toJSON(message: SubscribeUpdateAccountInfo): unknown {
    const obj: any = {};
    message.pubkey !== undefined &&
      (obj.pubkey = base64FromBytes(message.pubkey !== undefined ? message.pubkey : new Uint8Array()));
    message.lamports !== undefined && (obj.lamports = message.lamports);
    message.owner !== undefined &&
      (obj.owner = base64FromBytes(message.owner !== undefined ? message.owner : new Uint8Array()));
    message.executable !== undefined && (obj.executable = message.executable);
    message.rentEpoch !== undefined && (obj.rentEpoch = message.rentEpoch);
    message.data !== undefined &&
      (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
    message.writeVersion !== undefined && (obj.writeVersion = message.writeVersion);
    message.txnSignature !== undefined &&
      (obj.txnSignature = message.txnSignature !== undefined ? base64FromBytes(message.txnSignature) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateAccountInfo>, I>>(base?: I): SubscribeUpdateAccountInfo {
    return SubscribeUpdateAccountInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateAccountInfo>, I>>(object: I): SubscribeUpdateAccountInfo {
    const message = createBaseSubscribeUpdateAccountInfo();
    message.pubkey = object.pubkey ?? new Uint8Array();
    message.lamports = object.lamports ?? "0";
    message.owner = object.owner ?? new Uint8Array();
    message.executable = object.executable ?? false;
    message.rentEpoch = object.rentEpoch ?? "0";
    message.data = object.data ?? new Uint8Array();
    message.writeVersion = object.writeVersion ?? "0";
    message.txnSignature = object.txnSignature ?? undefined;
    return message;
  },
};

function createBaseSubscribeUpdateSlot(): SubscribeUpdateSlot {
  return { slot: "0", parent: undefined, status: 0, deadError: undefined };
}

export const SubscribeUpdateSlot = {
  encode(message: SubscribeUpdateSlot, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.parent !== undefined) {
      writer.uint32(16).uint64(message.parent);
    }
    if (message.status !== 0) {
      writer.uint32(24).int32(message.status);
    }
    if (message.deadError !== undefined) {
      writer.uint32(34).string(message.deadError);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateSlot {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateSlot();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.parent = longToString(reader.uint64() as Long);
          break;
        case 3:
          message.status = reader.int32() as any;
          break;
        case 4:
          message.deadError = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateSlot {
    return {
      slot: isSet(object.slot) ? String(object.slot) : "0",
      parent: isSet(object.parent) ? String(object.parent) : undefined,
      status: isSet(object.status) ? slotStatusFromJSON(object.status) : 0,
      deadError: isSet(object.deadError) ? String(object.deadError) : undefined,
    };
  },

  toJSON(message: SubscribeUpdateSlot): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    message.parent !== undefined && (obj.parent = message.parent);
    message.status !== undefined && (obj.status = slotStatusToJSON(message.status));
    message.deadError !== undefined && (obj.deadError = message.deadError);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateSlot>, I>>(base?: I): SubscribeUpdateSlot {
    return SubscribeUpdateSlot.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateSlot>, I>>(object: I): SubscribeUpdateSlot {
    const message = createBaseSubscribeUpdateSlot();
    message.slot = object.slot ?? "0";
    message.parent = object.parent ?? undefined;
    message.status = object.status ?? 0;
    message.deadError = object.deadError ?? undefined;
    return message;
  },
};

function createBaseSubscribeUpdateTransaction(): SubscribeUpdateTransaction {
  return { transaction: undefined, slot: "0" };
}

export const SubscribeUpdateTransaction = {
  encode(message: SubscribeUpdateTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transaction !== undefined) {
      SubscribeUpdateTransactionInfo.encode(message.transaction, writer.uint32(10).fork()).ldelim();
    }
    if (message.slot !== "0") {
      writer.uint32(16).uint64(message.slot);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.transaction = SubscribeUpdateTransactionInfo.decode(reader, reader.uint32());
          break;
        case 2:
          message.slot = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateTransaction {
    return {
      transaction: isSet(object.transaction) ? SubscribeUpdateTransactionInfo.fromJSON(object.transaction) : undefined,
      slot: isSet(object.slot) ? String(object.slot) : "0",
    };
  },

  toJSON(message: SubscribeUpdateTransaction): unknown {
    const obj: any = {};
    message.transaction !== undefined &&
      (obj.transaction = message.transaction ? SubscribeUpdateTransactionInfo.toJSON(message.transaction) : undefined);
    message.slot !== undefined && (obj.slot = message.slot);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateTransaction>, I>>(base?: I): SubscribeUpdateTransaction {
    return SubscribeUpdateTransaction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateTransaction>, I>>(object: I): SubscribeUpdateTransaction {
    const message = createBaseSubscribeUpdateTransaction();
    message.transaction = (object.transaction !== undefined && object.transaction !== null)
      ? SubscribeUpdateTransactionInfo.fromPartial(object.transaction)
      : undefined;
    message.slot = object.slot ?? "0";
    return message;
  },
};

function createBaseSubscribeUpdateTransactionInfo(): SubscribeUpdateTransactionInfo {
  return { signature: new Uint8Array(), isVote: false, transaction: undefined, meta: undefined, index: "0" };
}

export const SubscribeUpdateTransactionInfo = {
  encode(message: SubscribeUpdateTransactionInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.signature.length !== 0) {
      writer.uint32(10).bytes(message.signature);
    }
    if (message.isVote === true) {
      writer.uint32(16).bool(message.isVote);
    }
    if (message.transaction !== undefined) {
      Transaction.encode(message.transaction, writer.uint32(26).fork()).ldelim();
    }
    if (message.meta !== undefined) {
      TransactionStatusMeta.encode(message.meta, writer.uint32(34).fork()).ldelim();
    }
    if (message.index !== "0") {
      writer.uint32(40).uint64(message.index);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateTransactionInfo {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateTransactionInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.signature = reader.bytes();
          break;
        case 2:
          message.isVote = reader.bool();
          break;
        case 3:
          message.transaction = Transaction.decode(reader, reader.uint32());
          break;
        case 4:
          message.meta = TransactionStatusMeta.decode(reader, reader.uint32());
          break;
        case 5:
          message.index = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateTransactionInfo {
    return {
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
      isVote: isSet(object.isVote) ? Boolean(object.isVote) : false,
      transaction: isSet(object.transaction) ? Transaction.fromJSON(object.transaction) : undefined,
      meta: isSet(object.meta) ? TransactionStatusMeta.fromJSON(object.meta) : undefined,
      index: isSet(object.index) ? String(object.index) : "0",
    };
  },

  toJSON(message: SubscribeUpdateTransactionInfo): unknown {
    const obj: any = {};
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    message.isVote !== undefined && (obj.isVote = message.isVote);
    message.transaction !== undefined &&
      (obj.transaction = message.transaction ? Transaction.toJSON(message.transaction) : undefined);
    message.meta !== undefined && (obj.meta = message.meta ? TransactionStatusMeta.toJSON(message.meta) : undefined);
    message.index !== undefined && (obj.index = message.index);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateTransactionInfo>, I>>(base?: I): SubscribeUpdateTransactionInfo {
    return SubscribeUpdateTransactionInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateTransactionInfo>, I>>(
    object: I,
  ): SubscribeUpdateTransactionInfo {
    const message = createBaseSubscribeUpdateTransactionInfo();
    message.signature = object.signature ?? new Uint8Array();
    message.isVote = object.isVote ?? false;
    message.transaction = (object.transaction !== undefined && object.transaction !== null)
      ? Transaction.fromPartial(object.transaction)
      : undefined;
    message.meta = (object.meta !== undefined && object.meta !== null)
      ? TransactionStatusMeta.fromPartial(object.meta)
      : undefined;
    message.index = object.index ?? "0";
    return message;
  },
};

function createBaseSubscribeUpdateTransactionStatus(): SubscribeUpdateTransactionStatus {
  return { slot: "0", signature: new Uint8Array(), isVote: false, index: "0", err: undefined };
}

export const SubscribeUpdateTransactionStatus = {
  encode(message: SubscribeUpdateTransactionStatus, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.signature.length !== 0) {
      writer.uint32(18).bytes(message.signature);
    }
    if (message.isVote === true) {
      writer.uint32(24).bool(message.isVote);
    }
    if (message.index !== "0") {
      writer.uint32(32).uint64(message.index);
    }
    if (message.err !== undefined) {
      TransactionError.encode(message.err, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateTransactionStatus {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateTransactionStatus();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.signature = reader.bytes();
          break;
        case 3:
          message.isVote = reader.bool();
          break;
        case 4:
          message.index = longToString(reader.uint64() as Long);
          break;
        case 5:
          message.err = TransactionError.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateTransactionStatus {
    return {
      slot: isSet(object.slot) ? String(object.slot) : "0",
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
      isVote: isSet(object.isVote) ? Boolean(object.isVote) : false,
      index: isSet(object.index) ? String(object.index) : "0",
      err: isSet(object.err) ? TransactionError.fromJSON(object.err) : undefined,
    };
  },

  toJSON(message: SubscribeUpdateTransactionStatus): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    message.isVote !== undefined && (obj.isVote = message.isVote);
    message.index !== undefined && (obj.index = message.index);
    message.err !== undefined && (obj.err = message.err ? TransactionError.toJSON(message.err) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateTransactionStatus>, I>>(
    base?: I,
  ): SubscribeUpdateTransactionStatus {
    return SubscribeUpdateTransactionStatus.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateTransactionStatus>, I>>(
    object: I,
  ): SubscribeUpdateTransactionStatus {
    const message = createBaseSubscribeUpdateTransactionStatus();
    message.slot = object.slot ?? "0";
    message.signature = object.signature ?? new Uint8Array();
    message.isVote = object.isVote ?? false;
    message.index = object.index ?? "0";
    message.err = (object.err !== undefined && object.err !== null)
      ? TransactionError.fromPartial(object.err)
      : undefined;
    return message;
  },
};

function createBaseSubscribeUpdateBlock(): SubscribeUpdateBlock {
  return {
    slot: "0",
    blockhash: "",
    rewards: undefined,
    blockTime: undefined,
    blockHeight: undefined,
    parentSlot: "0",
    parentBlockhash: "",
    executedTransactionCount: "0",
    transactions: [],
    updatedAccountCount: "0",
    accounts: [],
    entriesCount: "0",
    entries: [],
  };
}

export const SubscribeUpdateBlock = {
  encode(message: SubscribeUpdateBlock, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.blockhash !== "") {
      writer.uint32(18).string(message.blockhash);
    }
    if (message.rewards !== undefined) {
      Rewards.encode(message.rewards, writer.uint32(26).fork()).ldelim();
    }
    if (message.blockTime !== undefined) {
      UnixTimestamp.encode(message.blockTime, writer.uint32(34).fork()).ldelim();
    }
    if (message.blockHeight !== undefined) {
      BlockHeight.encode(message.blockHeight, writer.uint32(42).fork()).ldelim();
    }
    if (message.parentSlot !== "0") {
      writer.uint32(56).uint64(message.parentSlot);
    }
    if (message.parentBlockhash !== "") {
      writer.uint32(66).string(message.parentBlockhash);
    }
    if (message.executedTransactionCount !== "0") {
      writer.uint32(72).uint64(message.executedTransactionCount);
    }
    for (const v of message.transactions) {
      SubscribeUpdateTransactionInfo.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.updatedAccountCount !== "0") {
      writer.uint32(80).uint64(message.updatedAccountCount);
    }
    for (const v of message.accounts) {
      SubscribeUpdateAccountInfo.encode(v!, writer.uint32(90).fork()).ldelim();
    }
    if (message.entriesCount !== "0") {
      writer.uint32(96).uint64(message.entriesCount);
    }
    for (const v of message.entries) {
      SubscribeUpdateEntry.encode(v!, writer.uint32(106).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateBlock {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateBlock();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.blockhash = reader.string();
          break;
        case 3:
          message.rewards = Rewards.decode(reader, reader.uint32());
          break;
        case 4:
          message.blockTime = UnixTimestamp.decode(reader, reader.uint32());
          break;
        case 5:
          message.blockHeight = BlockHeight.decode(reader, reader.uint32());
          break;
        case 7:
          message.parentSlot = longToString(reader.uint64() as Long);
          break;
        case 8:
          message.parentBlockhash = reader.string();
          break;
        case 9:
          message.executedTransactionCount = longToString(reader.uint64() as Long);
          break;
        case 6:
          message.transactions.push(SubscribeUpdateTransactionInfo.decode(reader, reader.uint32()));
          break;
        case 10:
          message.updatedAccountCount = longToString(reader.uint64() as Long);
          break;
        case 11:
          message.accounts.push(SubscribeUpdateAccountInfo.decode(reader, reader.uint32()));
          break;
        case 12:
          message.entriesCount = longToString(reader.uint64() as Long);
          break;
        case 13:
          message.entries.push(SubscribeUpdateEntry.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateBlock {
    return {
      slot: isSet(object.slot) ? String(object.slot) : "0",
      blockhash: isSet(object.blockhash) ? String(object.blockhash) : "",
      rewards: isSet(object.rewards) ? Rewards.fromJSON(object.rewards) : undefined,
      blockTime: isSet(object.blockTime) ? UnixTimestamp.fromJSON(object.blockTime) : undefined,
      blockHeight: isSet(object.blockHeight) ? BlockHeight.fromJSON(object.blockHeight) : undefined,
      parentSlot: isSet(object.parentSlot) ? String(object.parentSlot) : "0",
      parentBlockhash: isSet(object.parentBlockhash) ? String(object.parentBlockhash) : "",
      executedTransactionCount: isSet(object.executedTransactionCount) ? String(object.executedTransactionCount) : "0",
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => SubscribeUpdateTransactionInfo.fromJSON(e))
        : [],
      updatedAccountCount: isSet(object.updatedAccountCount) ? String(object.updatedAccountCount) : "0",
      accounts: Array.isArray(object?.accounts)
        ? object.accounts.map((e: any) => SubscribeUpdateAccountInfo.fromJSON(e))
        : [],
      entriesCount: isSet(object.entriesCount) ? String(object.entriesCount) : "0",
      entries: Array.isArray(object?.entries) ? object.entries.map((e: any) => SubscribeUpdateEntry.fromJSON(e)) : [],
    };
  },

  toJSON(message: SubscribeUpdateBlock): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    message.blockhash !== undefined && (obj.blockhash = message.blockhash);
    message.rewards !== undefined && (obj.rewards = message.rewards ? Rewards.toJSON(message.rewards) : undefined);
    message.blockTime !== undefined &&
      (obj.blockTime = message.blockTime ? UnixTimestamp.toJSON(message.blockTime) : undefined);
    message.blockHeight !== undefined &&
      (obj.blockHeight = message.blockHeight ? BlockHeight.toJSON(message.blockHeight) : undefined);
    message.parentSlot !== undefined && (obj.parentSlot = message.parentSlot);
    message.parentBlockhash !== undefined && (obj.parentBlockhash = message.parentBlockhash);
    message.executedTransactionCount !== undefined && (obj.executedTransactionCount = message.executedTransactionCount);
    if (message.transactions) {
      obj.transactions = message.transactions.map((e) => e ? SubscribeUpdateTransactionInfo.toJSON(e) : undefined);
    } else {
      obj.transactions = [];
    }
    message.updatedAccountCount !== undefined && (obj.updatedAccountCount = message.updatedAccountCount);
    if (message.accounts) {
      obj.accounts = message.accounts.map((e) => e ? SubscribeUpdateAccountInfo.toJSON(e) : undefined);
    } else {
      obj.accounts = [];
    }
    message.entriesCount !== undefined && (obj.entriesCount = message.entriesCount);
    if (message.entries) {
      obj.entries = message.entries.map((e) => e ? SubscribeUpdateEntry.toJSON(e) : undefined);
    } else {
      obj.entries = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateBlock>, I>>(base?: I): SubscribeUpdateBlock {
    return SubscribeUpdateBlock.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateBlock>, I>>(object: I): SubscribeUpdateBlock {
    const message = createBaseSubscribeUpdateBlock();
    message.slot = object.slot ?? "0";
    message.blockhash = object.blockhash ?? "";
    message.rewards = (object.rewards !== undefined && object.rewards !== null)
      ? Rewards.fromPartial(object.rewards)
      : undefined;
    message.blockTime = (object.blockTime !== undefined && object.blockTime !== null)
      ? UnixTimestamp.fromPartial(object.blockTime)
      : undefined;
    message.blockHeight = (object.blockHeight !== undefined && object.blockHeight !== null)
      ? BlockHeight.fromPartial(object.blockHeight)
      : undefined;
    message.parentSlot = object.parentSlot ?? "0";
    message.parentBlockhash = object.parentBlockhash ?? "";
    message.executedTransactionCount = object.executedTransactionCount ?? "0";
    message.transactions = object.transactions?.map((e) => SubscribeUpdateTransactionInfo.fromPartial(e)) || [];
    message.updatedAccountCount = object.updatedAccountCount ?? "0";
    message.accounts = object.accounts?.map((e) => SubscribeUpdateAccountInfo.fromPartial(e)) || [];
    message.entriesCount = object.entriesCount ?? "0";
    message.entries = object.entries?.map((e) => SubscribeUpdateEntry.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSubscribeUpdateBlockMeta(): SubscribeUpdateBlockMeta {
  return {
    slot: "0",
    blockhash: "",
    rewards: undefined,
    blockTime: undefined,
    blockHeight: undefined,
    parentSlot: "0",
    parentBlockhash: "",
    executedTransactionCount: "0",
    entriesCount: "0",
  };
}

export const SubscribeUpdateBlockMeta = {
  encode(message: SubscribeUpdateBlockMeta, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.blockhash !== "") {
      writer.uint32(18).string(message.blockhash);
    }
    if (message.rewards !== undefined) {
      Rewards.encode(message.rewards, writer.uint32(26).fork()).ldelim();
    }
    if (message.blockTime !== undefined) {
      UnixTimestamp.encode(message.blockTime, writer.uint32(34).fork()).ldelim();
    }
    if (message.blockHeight !== undefined) {
      BlockHeight.encode(message.blockHeight, writer.uint32(42).fork()).ldelim();
    }
    if (message.parentSlot !== "0") {
      writer.uint32(48).uint64(message.parentSlot);
    }
    if (message.parentBlockhash !== "") {
      writer.uint32(58).string(message.parentBlockhash);
    }
    if (message.executedTransactionCount !== "0") {
      writer.uint32(64).uint64(message.executedTransactionCount);
    }
    if (message.entriesCount !== "0") {
      writer.uint32(72).uint64(message.entriesCount);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateBlockMeta {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateBlockMeta();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.blockhash = reader.string();
          break;
        case 3:
          message.rewards = Rewards.decode(reader, reader.uint32());
          break;
        case 4:
          message.blockTime = UnixTimestamp.decode(reader, reader.uint32());
          break;
        case 5:
          message.blockHeight = BlockHeight.decode(reader, reader.uint32());
          break;
        case 6:
          message.parentSlot = longToString(reader.uint64() as Long);
          break;
        case 7:
          message.parentBlockhash = reader.string();
          break;
        case 8:
          message.executedTransactionCount = longToString(reader.uint64() as Long);
          break;
        case 9:
          message.entriesCount = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateBlockMeta {
    return {
      slot: isSet(object.slot) ? String(object.slot) : "0",
      blockhash: isSet(object.blockhash) ? String(object.blockhash) : "",
      rewards: isSet(object.rewards) ? Rewards.fromJSON(object.rewards) : undefined,
      blockTime: isSet(object.blockTime) ? UnixTimestamp.fromJSON(object.blockTime) : undefined,
      blockHeight: isSet(object.blockHeight) ? BlockHeight.fromJSON(object.blockHeight) : undefined,
      parentSlot: isSet(object.parentSlot) ? String(object.parentSlot) : "0",
      parentBlockhash: isSet(object.parentBlockhash) ? String(object.parentBlockhash) : "",
      executedTransactionCount: isSet(object.executedTransactionCount) ? String(object.executedTransactionCount) : "0",
      entriesCount: isSet(object.entriesCount) ? String(object.entriesCount) : "0",
    };
  },

  toJSON(message: SubscribeUpdateBlockMeta): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    message.blockhash !== undefined && (obj.blockhash = message.blockhash);
    message.rewards !== undefined && (obj.rewards = message.rewards ? Rewards.toJSON(message.rewards) : undefined);
    message.blockTime !== undefined &&
      (obj.blockTime = message.blockTime ? UnixTimestamp.toJSON(message.blockTime) : undefined);
    message.blockHeight !== undefined &&
      (obj.blockHeight = message.blockHeight ? BlockHeight.toJSON(message.blockHeight) : undefined);
    message.parentSlot !== undefined && (obj.parentSlot = message.parentSlot);
    message.parentBlockhash !== undefined && (obj.parentBlockhash = message.parentBlockhash);
    message.executedTransactionCount !== undefined && (obj.executedTransactionCount = message.executedTransactionCount);
    message.entriesCount !== undefined && (obj.entriesCount = message.entriesCount);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateBlockMeta>, I>>(base?: I): SubscribeUpdateBlockMeta {
    return SubscribeUpdateBlockMeta.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateBlockMeta>, I>>(object: I): SubscribeUpdateBlockMeta {
    const message = createBaseSubscribeUpdateBlockMeta();
    message.slot = object.slot ?? "0";
    message.blockhash = object.blockhash ?? "";
    message.rewards = (object.rewards !== undefined && object.rewards !== null)
      ? Rewards.fromPartial(object.rewards)
      : undefined;
    message.blockTime = (object.blockTime !== undefined && object.blockTime !== null)
      ? UnixTimestamp.fromPartial(object.blockTime)
      : undefined;
    message.blockHeight = (object.blockHeight !== undefined && object.blockHeight !== null)
      ? BlockHeight.fromPartial(object.blockHeight)
      : undefined;
    message.parentSlot = object.parentSlot ?? "0";
    message.parentBlockhash = object.parentBlockhash ?? "";
    message.executedTransactionCount = object.executedTransactionCount ?? "0";
    message.entriesCount = object.entriesCount ?? "0";
    return message;
  },
};

function createBaseSubscribeUpdateEntry(): SubscribeUpdateEntry {
  return {
    slot: "0",
    index: "0",
    numHashes: "0",
    hash: new Uint8Array(),
    executedTransactionCount: "0",
    startingTransactionIndex: "0",
  };
}

export const SubscribeUpdateEntry = {
  encode(message: SubscribeUpdateEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.index !== "0") {
      writer.uint32(16).uint64(message.index);
    }
    if (message.numHashes !== "0") {
      writer.uint32(24).uint64(message.numHashes);
    }
    if (message.hash.length !== 0) {
      writer.uint32(34).bytes(message.hash);
    }
    if (message.executedTransactionCount !== "0") {
      writer.uint32(40).uint64(message.executedTransactionCount);
    }
    if (message.startingTransactionIndex !== "0") {
      writer.uint32(48).uint64(message.startingTransactionIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdateEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdateEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.index = longToString(reader.uint64() as Long);
          break;
        case 3:
          message.numHashes = longToString(reader.uint64() as Long);
          break;
        case 4:
          message.hash = reader.bytes();
          break;
        case 5:
          message.executedTransactionCount = longToString(reader.uint64() as Long);
          break;
        case 6:
          message.startingTransactionIndex = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdateEntry {
    return {
      slot: isSet(object.slot) ? String(object.slot) : "0",
      index: isSet(object.index) ? String(object.index) : "0",
      numHashes: isSet(object.numHashes) ? String(object.numHashes) : "0",
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      executedTransactionCount: isSet(object.executedTransactionCount) ? String(object.executedTransactionCount) : "0",
      startingTransactionIndex: isSet(object.startingTransactionIndex) ? String(object.startingTransactionIndex) : "0",
    };
  },

  toJSON(message: SubscribeUpdateEntry): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    message.index !== undefined && (obj.index = message.index);
    message.numHashes !== undefined && (obj.numHashes = message.numHashes);
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    message.executedTransactionCount !== undefined && (obj.executedTransactionCount = message.executedTransactionCount);
    message.startingTransactionIndex !== undefined && (obj.startingTransactionIndex = message.startingTransactionIndex);
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdateEntry>, I>>(base?: I): SubscribeUpdateEntry {
    return SubscribeUpdateEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdateEntry>, I>>(object: I): SubscribeUpdateEntry {
    const message = createBaseSubscribeUpdateEntry();
    message.slot = object.slot ?? "0";
    message.index = object.index ?? "0";
    message.numHashes = object.numHashes ?? "0";
    message.hash = object.hash ?? new Uint8Array();
    message.executedTransactionCount = object.executedTransactionCount ?? "0";
    message.startingTransactionIndex = object.startingTransactionIndex ?? "0";
    return message;
  },
};

function createBaseSubscribeUpdatePing(): SubscribeUpdatePing {
  return {};
}

export const SubscribeUpdatePing = {
  encode(_: SubscribeUpdatePing, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdatePing {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdatePing();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): SubscribeUpdatePing {
    return {};
  },

  toJSON(_: SubscribeUpdatePing): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdatePing>, I>>(base?: I): SubscribeUpdatePing {
    return SubscribeUpdatePing.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdatePing>, I>>(_: I): SubscribeUpdatePing {
    const message = createBaseSubscribeUpdatePing();
    return message;
  },
};

function createBaseSubscribeUpdatePong(): SubscribeUpdatePong {
  return { id: 0 };
}

export const SubscribeUpdatePong = {
  encode(message: SubscribeUpdatePong, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).int32(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeUpdatePong {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeUpdatePong();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SubscribeUpdatePong {
    return { id: isSet(object.id) ? Number(object.id) : 0 };
  },

  toJSON(message: SubscribeUpdatePong): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = Math.round(message.id));
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeUpdatePong>, I>>(base?: I): SubscribeUpdatePong {
    return SubscribeUpdatePong.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeUpdatePong>, I>>(object: I): SubscribeUpdatePong {
    const message = createBaseSubscribeUpdatePong();
    message.id = object.id ?? 0;
    return message;
  },
};

function createBasePingRequest(): PingRequest {
  return { count: 0 };
}

export const PingRequest = {
  encode(message: PingRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.count !== 0) {
      writer.uint32(8).int32(message.count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PingRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePingRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.count = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PingRequest {
    return { count: isSet(object.count) ? Number(object.count) : 0 };
  },

  toJSON(message: PingRequest): unknown {
    const obj: any = {};
    message.count !== undefined && (obj.count = Math.round(message.count));
    return obj;
  },

  create<I extends Exact<DeepPartial<PingRequest>, I>>(base?: I): PingRequest {
    return PingRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<PingRequest>, I>>(object: I): PingRequest {
    const message = createBasePingRequest();
    message.count = object.count ?? 0;
    return message;
  },
};

function createBasePongResponse(): PongResponse {
  return { count: 0 };
}

export const PongResponse = {
  encode(message: PongResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.count !== 0) {
      writer.uint32(8).int32(message.count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PongResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePongResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.count = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PongResponse {
    return { count: isSet(object.count) ? Number(object.count) : 0 };
  },

  toJSON(message: PongResponse): unknown {
    const obj: any = {};
    message.count !== undefined && (obj.count = Math.round(message.count));
    return obj;
  },

  create<I extends Exact<DeepPartial<PongResponse>, I>>(base?: I): PongResponse {
    return PongResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<PongResponse>, I>>(object: I): PongResponse {
    const message = createBasePongResponse();
    message.count = object.count ?? 0;
    return message;
  },
};

function createBaseGetLatestBlockhashRequest(): GetLatestBlockhashRequest {
  return { commitment: undefined };
}

export const GetLatestBlockhashRequest = {
  encode(message: GetLatestBlockhashRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.commitment !== undefined) {
      writer.uint32(8).int32(message.commitment);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetLatestBlockhashRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetLatestBlockhashRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.commitment = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetLatestBlockhashRequest {
    return { commitment: isSet(object.commitment) ? commitmentLevelFromJSON(object.commitment) : undefined };
  },

  toJSON(message: GetLatestBlockhashRequest): unknown {
    const obj: any = {};
    message.commitment !== undefined &&
      (obj.commitment = message.commitment !== undefined ? commitmentLevelToJSON(message.commitment) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetLatestBlockhashRequest>, I>>(base?: I): GetLatestBlockhashRequest {
    return GetLatestBlockhashRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetLatestBlockhashRequest>, I>>(object: I): GetLatestBlockhashRequest {
    const message = createBaseGetLatestBlockhashRequest();
    message.commitment = object.commitment ?? undefined;
    return message;
  },
};

function createBaseGetLatestBlockhashResponse(): GetLatestBlockhashResponse {
  return { slot: "0", blockhash: "", lastValidBlockHeight: "0" };
}

export const GetLatestBlockhashResponse = {
  encode(message: GetLatestBlockhashResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.blockhash !== "") {
      writer.uint32(18).string(message.blockhash);
    }
    if (message.lastValidBlockHeight !== "0") {
      writer.uint32(24).uint64(message.lastValidBlockHeight);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetLatestBlockhashResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetLatestBlockhashResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.blockhash = reader.string();
          break;
        case 3:
          message.lastValidBlockHeight = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetLatestBlockhashResponse {
    return {
      slot: isSet(object.slot) ? String(object.slot) : "0",
      blockhash: isSet(object.blockhash) ? String(object.blockhash) : "",
      lastValidBlockHeight: isSet(object.lastValidBlockHeight) ? String(object.lastValidBlockHeight) : "0",
    };
  },

  toJSON(message: GetLatestBlockhashResponse): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    message.blockhash !== undefined && (obj.blockhash = message.blockhash);
    message.lastValidBlockHeight !== undefined && (obj.lastValidBlockHeight = message.lastValidBlockHeight);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetLatestBlockhashResponse>, I>>(base?: I): GetLatestBlockhashResponse {
    return GetLatestBlockhashResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetLatestBlockhashResponse>, I>>(object: I): GetLatestBlockhashResponse {
    const message = createBaseGetLatestBlockhashResponse();
    message.slot = object.slot ?? "0";
    message.blockhash = object.blockhash ?? "";
    message.lastValidBlockHeight = object.lastValidBlockHeight ?? "0";
    return message;
  },
};

function createBaseGetBlockHeightRequest(): GetBlockHeightRequest {
  return { commitment: undefined };
}

export const GetBlockHeightRequest = {
  encode(message: GetBlockHeightRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.commitment !== undefined) {
      writer.uint32(8).int32(message.commitment);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlockHeightRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlockHeightRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.commitment = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetBlockHeightRequest {
    return { commitment: isSet(object.commitment) ? commitmentLevelFromJSON(object.commitment) : undefined };
  },

  toJSON(message: GetBlockHeightRequest): unknown {
    const obj: any = {};
    message.commitment !== undefined &&
      (obj.commitment = message.commitment !== undefined ? commitmentLevelToJSON(message.commitment) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlockHeightRequest>, I>>(base?: I): GetBlockHeightRequest {
    return GetBlockHeightRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetBlockHeightRequest>, I>>(object: I): GetBlockHeightRequest {
    const message = createBaseGetBlockHeightRequest();
    message.commitment = object.commitment ?? undefined;
    return message;
  },
};

function createBaseGetBlockHeightResponse(): GetBlockHeightResponse {
  return { blockHeight: "0" };
}

export const GetBlockHeightResponse = {
  encode(message: GetBlockHeightResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockHeight !== "0") {
      writer.uint32(8).uint64(message.blockHeight);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlockHeightResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlockHeightResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.blockHeight = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetBlockHeightResponse {
    return { blockHeight: isSet(object.blockHeight) ? String(object.blockHeight) : "0" };
  },

  toJSON(message: GetBlockHeightResponse): unknown {
    const obj: any = {};
    message.blockHeight !== undefined && (obj.blockHeight = message.blockHeight);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlockHeightResponse>, I>>(base?: I): GetBlockHeightResponse {
    return GetBlockHeightResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetBlockHeightResponse>, I>>(object: I): GetBlockHeightResponse {
    const message = createBaseGetBlockHeightResponse();
    message.blockHeight = object.blockHeight ?? "0";
    return message;
  },
};

function createBaseGetSlotRequest(): GetSlotRequest {
  return { commitment: undefined };
}

export const GetSlotRequest = {
  encode(message: GetSlotRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.commitment !== undefined) {
      writer.uint32(8).int32(message.commitment);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetSlotRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetSlotRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.commitment = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetSlotRequest {
    return { commitment: isSet(object.commitment) ? commitmentLevelFromJSON(object.commitment) : undefined };
  },

  toJSON(message: GetSlotRequest): unknown {
    const obj: any = {};
    message.commitment !== undefined &&
      (obj.commitment = message.commitment !== undefined ? commitmentLevelToJSON(message.commitment) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetSlotRequest>, I>>(base?: I): GetSlotRequest {
    return GetSlotRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetSlotRequest>, I>>(object: I): GetSlotRequest {
    const message = createBaseGetSlotRequest();
    message.commitment = object.commitment ?? undefined;
    return message;
  },
};

function createBaseGetSlotResponse(): GetSlotResponse {
  return { slot: "0" };
}

export const GetSlotResponse = {
  encode(message: GetSlotResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetSlotResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetSlotResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetSlotResponse {
    return { slot: isSet(object.slot) ? String(object.slot) : "0" };
  },

  toJSON(message: GetSlotResponse): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetSlotResponse>, I>>(base?: I): GetSlotResponse {
    return GetSlotResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetSlotResponse>, I>>(object: I): GetSlotResponse {
    const message = createBaseGetSlotResponse();
    message.slot = object.slot ?? "0";
    return message;
  },
};

function createBaseGetVersionRequest(): GetVersionRequest {
  return {};
}

export const GetVersionRequest = {
  encode(_: GetVersionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetVersionRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetVersionRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): GetVersionRequest {
    return {};
  },

  toJSON(_: GetVersionRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetVersionRequest>, I>>(base?: I): GetVersionRequest {
    return GetVersionRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetVersionRequest>, I>>(_: I): GetVersionRequest {
    const message = createBaseGetVersionRequest();
    return message;
  },
};

function createBaseGetVersionResponse(): GetVersionResponse {
  return { version: "" };
}

export const GetVersionResponse = {
  encode(message: GetVersionResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== "") {
      writer.uint32(10).string(message.version);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetVersionResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetVersionResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.version = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetVersionResponse {
    return { version: isSet(object.version) ? String(object.version) : "" };
  },

  toJSON(message: GetVersionResponse): unknown {
    const obj: any = {};
    message.version !== undefined && (obj.version = message.version);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetVersionResponse>, I>>(base?: I): GetVersionResponse {
    return GetVersionResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetVersionResponse>, I>>(object: I): GetVersionResponse {
    const message = createBaseGetVersionResponse();
    message.version = object.version ?? "";
    return message;
  },
};

function createBaseIsBlockhashValidRequest(): IsBlockhashValidRequest {
  return { blockhash: "", commitment: undefined };
}

export const IsBlockhashValidRequest = {
  encode(message: IsBlockhashValidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockhash !== "") {
      writer.uint32(10).string(message.blockhash);
    }
    if (message.commitment !== undefined) {
      writer.uint32(16).int32(message.commitment);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IsBlockhashValidRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIsBlockhashValidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.blockhash = reader.string();
          break;
        case 2:
          message.commitment = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): IsBlockhashValidRequest {
    return {
      blockhash: isSet(object.blockhash) ? String(object.blockhash) : "",
      commitment: isSet(object.commitment) ? commitmentLevelFromJSON(object.commitment) : undefined,
    };
  },

  toJSON(message: IsBlockhashValidRequest): unknown {
    const obj: any = {};
    message.blockhash !== undefined && (obj.blockhash = message.blockhash);
    message.commitment !== undefined &&
      (obj.commitment = message.commitment !== undefined ? commitmentLevelToJSON(message.commitment) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<IsBlockhashValidRequest>, I>>(base?: I): IsBlockhashValidRequest {
    return IsBlockhashValidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IsBlockhashValidRequest>, I>>(object: I): IsBlockhashValidRequest {
    const message = createBaseIsBlockhashValidRequest();
    message.blockhash = object.blockhash ?? "";
    message.commitment = object.commitment ?? undefined;
    return message;
  },
};

function createBaseIsBlockhashValidResponse(): IsBlockhashValidResponse {
  return { slot: "0", valid: false };
}

export const IsBlockhashValidResponse = {
  encode(message: IsBlockhashValidResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== "0") {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.valid === true) {
      writer.uint32(16).bool(message.valid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IsBlockhashValidResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIsBlockhashValidResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToString(reader.uint64() as Long);
          break;
        case 2:
          message.valid = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): IsBlockhashValidResponse {
    return {
      slot: isSet(object.slot) ? String(object.slot) : "0",
      valid: isSet(object.valid) ? Boolean(object.valid) : false,
    };
  },

  toJSON(message: IsBlockhashValidResponse): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = message.slot);
    message.valid !== undefined && (obj.valid = message.valid);
    return obj;
  },

  create<I extends Exact<DeepPartial<IsBlockhashValidResponse>, I>>(base?: I): IsBlockhashValidResponse {
    return IsBlockhashValidResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IsBlockhashValidResponse>, I>>(object: I): IsBlockhashValidResponse {
    const message = createBaseIsBlockhashValidResponse();
    message.slot = object.slot ?? "0";
    message.valid = object.valid ?? false;
    return message;
  },
};

export type GeyserService = typeof GeyserService;
export const GeyserService = {
  subscribe: {
    path: "/geyser.Geyser/Subscribe",
    requestStream: true,
    responseStream: true,
    requestSerialize: (value: SubscribeRequest) => Buffer.from(SubscribeRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SubscribeRequest.decode(value),
    responseSerialize: (value: SubscribeUpdate) => Buffer.from(SubscribeUpdate.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SubscribeUpdate.decode(value),
  },
  ping: {
    path: "/geyser.Geyser/Ping",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: PingRequest) => Buffer.from(PingRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => PingRequest.decode(value),
    responseSerialize: (value: PongResponse) => Buffer.from(PongResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => PongResponse.decode(value),
  },
  getLatestBlockhash: {
    path: "/geyser.Geyser/GetLatestBlockhash",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetLatestBlockhashRequest) =>
      Buffer.from(GetLatestBlockhashRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetLatestBlockhashRequest.decode(value),
    responseSerialize: (value: GetLatestBlockhashResponse) =>
      Buffer.from(GetLatestBlockhashResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetLatestBlockhashResponse.decode(value),
  },
  getBlockHeight: {
    path: "/geyser.Geyser/GetBlockHeight",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlockHeightRequest) => Buffer.from(GetBlockHeightRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlockHeightRequest.decode(value),
    responseSerialize: (value: GetBlockHeightResponse) => Buffer.from(GetBlockHeightResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlockHeightResponse.decode(value),
  },
  getSlot: {
    path: "/geyser.Geyser/GetSlot",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetSlotRequest) => Buffer.from(GetSlotRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetSlotRequest.decode(value),
    responseSerialize: (value: GetSlotResponse) => Buffer.from(GetSlotResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetSlotResponse.decode(value),
  },
  isBlockhashValid: {
    path: "/geyser.Geyser/IsBlockhashValid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: IsBlockhashValidRequest) => Buffer.from(IsBlockhashValidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => IsBlockhashValidRequest.decode(value),
    responseSerialize: (value: IsBlockhashValidResponse) =>
      Buffer.from(IsBlockhashValidResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => IsBlockhashValidResponse.decode(value),
  },
  getVersion: {
    path: "/geyser.Geyser/GetVersion",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetVersionRequest) => Buffer.from(GetVersionRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetVersionRequest.decode(value),
    responseSerialize: (value: GetVersionResponse) => Buffer.from(GetVersionResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetVersionResponse.decode(value),
  },
} as const;

export interface GeyserServer extends UntypedServiceImplementation {
  subscribe: handleBidiStreamingCall<SubscribeRequest, SubscribeUpdate>;
  ping: handleUnaryCall<PingRequest, PongResponse>;
  getLatestBlockhash: handleUnaryCall<GetLatestBlockhashRequest, GetLatestBlockhashResponse>;
  getBlockHeight: handleUnaryCall<GetBlockHeightRequest, GetBlockHeightResponse>;
  getSlot: handleUnaryCall<GetSlotRequest, GetSlotResponse>;
  isBlockhashValid: handleUnaryCall<IsBlockhashValidRequest, IsBlockhashValidResponse>;
  getVersion: handleUnaryCall<GetVersionRequest, GetVersionResponse>;
}

export interface GeyserClient extends Client {
  subscribe(): ClientDuplexStream<SubscribeRequest, SubscribeUpdate>;
  subscribe(options: Partial<CallOptions>): ClientDuplexStream<SubscribeRequest, SubscribeUpdate>;
  subscribe(metadata: Metadata, options?: Partial<CallOptions>): ClientDuplexStream<SubscribeRequest, SubscribeUpdate>;
  ping(request: PingRequest, callback: (error: ServiceError | null, response: PongResponse) => void): ClientUnaryCall;
  ping(
    request: PingRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: PongResponse) => void,
  ): ClientUnaryCall;
  ping(
    request: PingRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: PongResponse) => void,
  ): ClientUnaryCall;
  getLatestBlockhash(
    request: GetLatestBlockhashRequest,
    callback: (error: ServiceError | null, response: GetLatestBlockhashResponse) => void,
  ): ClientUnaryCall;
  getLatestBlockhash(
    request: GetLatestBlockhashRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetLatestBlockhashResponse) => void,
  ): ClientUnaryCall;
  getLatestBlockhash(
    request: GetLatestBlockhashRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetLatestBlockhashResponse) => void,
  ): ClientUnaryCall;
  getBlockHeight(
    request: GetBlockHeightRequest,
    callback: (error: ServiceError | null, response: GetBlockHeightResponse) => void,
  ): ClientUnaryCall;
  getBlockHeight(
    request: GetBlockHeightRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlockHeightResponse) => void,
  ): ClientUnaryCall;
  getBlockHeight(
    request: GetBlockHeightRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlockHeightResponse) => void,
  ): ClientUnaryCall;
  getSlot(
    request: GetSlotRequest,
    callback: (error: ServiceError | null, response: GetSlotResponse) => void,
  ): ClientUnaryCall;
  getSlot(
    request: GetSlotRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetSlotResponse) => void,
  ): ClientUnaryCall;
  getSlot(
    request: GetSlotRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetSlotResponse) => void,
  ): ClientUnaryCall;
  isBlockhashValid(
    request: IsBlockhashValidRequest,
    callback: (error: ServiceError | null, response: IsBlockhashValidResponse) => void,
  ): ClientUnaryCall;
  isBlockhashValid(
    request: IsBlockhashValidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: IsBlockhashValidResponse) => void,
  ): ClientUnaryCall;
  isBlockhashValid(
    request: IsBlockhashValidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: IsBlockhashValidResponse) => void,
  ): ClientUnaryCall;
  getVersion(
    request: GetVersionRequest,
    callback: (error: ServiceError | null, response: GetVersionResponse) => void,
  ): ClientUnaryCall;
  getVersion(
    request: GetVersionRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetVersionResponse) => void,
  ): ClientUnaryCall;
  getVersion(
    request: GetVersionRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetVersionResponse) => void,
  ): ClientUnaryCall;
}

export const GeyserClient = makeGenericClientConstructor(GeyserService, "geyser.Geyser") as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): GeyserClient;
  service: typeof GeyserService;
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function toTimestamp(date: Date): Timestamp {
  const seconds = Math.trunc(date.getTime() / 1_000).toString();
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = Number(t.seconds) * 1_000;
  millis += t.nanos / 1_000_000;
  return new Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof Date) {
    return o;
  } else if (typeof o === "string") {
    return new Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function longToString(long: Long) {
  return long.toString();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
