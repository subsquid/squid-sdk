/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "solana.storage.ConfirmedBlock";

export enum RewardType {
  Unspecified = 0,
  Fee = 1,
  Rent = 2,
  Staking = 3,
  Voting = 4,
  UNRECOGNIZED = -1,
}

export function rewardTypeFromJSON(object: any): RewardType {
  switch (object) {
    case 0:
    case "Unspecified":
      return RewardType.Unspecified;
    case 1:
    case "Fee":
      return RewardType.Fee;
    case 2:
    case "Rent":
      return RewardType.Rent;
    case 3:
    case "Staking":
      return RewardType.Staking;
    case 4:
    case "Voting":
      return RewardType.Voting;
    case -1:
    case "UNRECOGNIZED":
    default:
      return RewardType.UNRECOGNIZED;
  }
}

export function rewardTypeToJSON(object: RewardType): string {
  switch (object) {
    case RewardType.Unspecified:
      return "Unspecified";
    case RewardType.Fee:
      return "Fee";
    case RewardType.Rent:
      return "Rent";
    case RewardType.Staking:
      return "Staking";
    case RewardType.Voting:
      return "Voting";
    case RewardType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface ConfirmedBlock {
  previousBlockhash: string;
  blockhash: string;
  parentSlot: string;
  transactions: ConfirmedTransaction[];
  rewards: Reward[];
  blockTime: UnixTimestamp | undefined;
  blockHeight: BlockHeight | undefined;
  numPartitions: NumPartitions | undefined;
}

export interface ConfirmedTransaction {
  transaction: Transaction | undefined;
  meta: TransactionStatusMeta | undefined;
}

export interface Transaction {
  signatures: Uint8Array[];
  message: Message | undefined;
}

export interface Message {
  header: MessageHeader | undefined;
  accountKeys: Uint8Array[];
  recentBlockhash: Uint8Array;
  instructions: CompiledInstruction[];
  versioned: boolean;
  addressTableLookups: MessageAddressTableLookup[];
}

export interface MessageHeader {
  numRequiredSignatures: number;
  numReadonlySignedAccounts: number;
  numReadonlyUnsignedAccounts: number;
}

export interface MessageAddressTableLookup {
  accountKey: Uint8Array;
  writableIndexes: Uint8Array;
  readonlyIndexes: Uint8Array;
}

export interface TransactionStatusMeta {
  err: TransactionError | undefined;
  fee: string;
  preBalances: string[];
  postBalances: string[];
  innerInstructions: InnerInstructions[];
  innerInstructionsNone: boolean;
  logMessages: string[];
  logMessagesNone: boolean;
  preTokenBalances: TokenBalance[];
  postTokenBalances: TokenBalance[];
  rewards: Reward[];
  loadedWritableAddresses: Uint8Array[];
  loadedReadonlyAddresses: Uint8Array[];
  returnData: ReturnData | undefined;
  returnDataNone: boolean;
  /**
   * Sum of compute units consumed by all instructions.
   * Available since Solana v1.10.35 / v1.11.6.
   * Set to `None` for txs executed on earlier versions.
   */
  computeUnitsConsumed?: string | undefined;
}

export interface TransactionError {
  err: Uint8Array;
}

export interface InnerInstructions {
  index: number;
  instructions: InnerInstruction[];
}

export interface InnerInstruction {
  programIdIndex: number;
  accounts: Uint8Array;
  data: Uint8Array;
  /**
   * Invocation stack height of an inner instruction.
   * Available since Solana v1.14.6
   * Set to `None` for txs executed on earlier versions.
   */
  stackHeight?: number | undefined;
}

export interface CompiledInstruction {
  programIdIndex: number;
  accounts: Uint8Array;
  data: Uint8Array;
}

export interface TokenBalance {
  accountIndex: number;
  mint: string;
  uiTokenAmount: UiTokenAmount | undefined;
  owner: string;
  programId: string;
}

export interface UiTokenAmount {
  uiAmount: number;
  decimals: number;
  amount: string;
  uiAmountString: string;
}

export interface ReturnData {
  programId: Uint8Array;
  data: Uint8Array;
}

export interface Reward {
  pubkey: string;
  lamports: string;
  postBalance: string;
  rewardType: RewardType;
  commission: string;
}

export interface Rewards {
  rewards: Reward[];
  numPartitions: NumPartitions | undefined;
}

export interface UnixTimestamp {
  timestamp: string;
}

export interface BlockHeight {
  blockHeight: string;
}

export interface NumPartitions {
  numPartitions: string;
}

function createBaseConfirmedBlock(): ConfirmedBlock {
  return {
    previousBlockhash: "",
    blockhash: "",
    parentSlot: "0",
    transactions: [],
    rewards: [],
    blockTime: undefined,
    blockHeight: undefined,
    numPartitions: undefined,
  };
}

export const ConfirmedBlock = {
  encode(message: ConfirmedBlock, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.previousBlockhash !== "") {
      writer.uint32(10).string(message.previousBlockhash);
    }
    if (message.blockhash !== "") {
      writer.uint32(18).string(message.blockhash);
    }
    if (message.parentSlot !== "0") {
      writer.uint32(24).uint64(message.parentSlot);
    }
    for (const v of message.transactions) {
      ConfirmedTransaction.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.rewards) {
      Reward.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    if (message.blockTime !== undefined) {
      UnixTimestamp.encode(message.blockTime, writer.uint32(50).fork()).ldelim();
    }
    if (message.blockHeight !== undefined) {
      BlockHeight.encode(message.blockHeight, writer.uint32(58).fork()).ldelim();
    }
    if (message.numPartitions !== undefined) {
      NumPartitions.encode(message.numPartitions, writer.uint32(66).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConfirmedBlock {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConfirmedBlock();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.previousBlockhash = reader.string();
          break;
        case 2:
          message.blockhash = reader.string();
          break;
        case 3:
          message.parentSlot = longToString(reader.uint64() as Long);
          break;
        case 4:
          message.transactions.push(ConfirmedTransaction.decode(reader, reader.uint32()));
          break;
        case 5:
          message.rewards.push(Reward.decode(reader, reader.uint32()));
          break;
        case 6:
          message.blockTime = UnixTimestamp.decode(reader, reader.uint32());
          break;
        case 7:
          message.blockHeight = BlockHeight.decode(reader, reader.uint32());
          break;
        case 8:
          message.numPartitions = NumPartitions.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConfirmedBlock {
    return {
      previousBlockhash: isSet(object.previousBlockhash) ? String(object.previousBlockhash) : "",
      blockhash: isSet(object.blockhash) ? String(object.blockhash) : "",
      parentSlot: isSet(object.parentSlot) ? String(object.parentSlot) : "0",
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => ConfirmedTransaction.fromJSON(e))
        : [],
      rewards: Array.isArray(object?.rewards) ? object.rewards.map((e: any) => Reward.fromJSON(e)) : [],
      blockTime: isSet(object.blockTime) ? UnixTimestamp.fromJSON(object.blockTime) : undefined,
      blockHeight: isSet(object.blockHeight) ? BlockHeight.fromJSON(object.blockHeight) : undefined,
      numPartitions: isSet(object.numPartitions) ? NumPartitions.fromJSON(object.numPartitions) : undefined,
    };
  },

  toJSON(message: ConfirmedBlock): unknown {
    const obj: any = {};
    message.previousBlockhash !== undefined && (obj.previousBlockhash = message.previousBlockhash);
    message.blockhash !== undefined && (obj.blockhash = message.blockhash);
    message.parentSlot !== undefined && (obj.parentSlot = message.parentSlot);
    if (message.transactions) {
      obj.transactions = message.transactions.map((e) => e ? ConfirmedTransaction.toJSON(e) : undefined);
    } else {
      obj.transactions = [];
    }
    if (message.rewards) {
      obj.rewards = message.rewards.map((e) => e ? Reward.toJSON(e) : undefined);
    } else {
      obj.rewards = [];
    }
    message.blockTime !== undefined &&
      (obj.blockTime = message.blockTime ? UnixTimestamp.toJSON(message.blockTime) : undefined);
    message.blockHeight !== undefined &&
      (obj.blockHeight = message.blockHeight ? BlockHeight.toJSON(message.blockHeight) : undefined);
    message.numPartitions !== undefined &&
      (obj.numPartitions = message.numPartitions ? NumPartitions.toJSON(message.numPartitions) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ConfirmedBlock>, I>>(base?: I): ConfirmedBlock {
    return ConfirmedBlock.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConfirmedBlock>, I>>(object: I): ConfirmedBlock {
    const message = createBaseConfirmedBlock();
    message.previousBlockhash = object.previousBlockhash ?? "";
    message.blockhash = object.blockhash ?? "";
    message.parentSlot = object.parentSlot ?? "0";
    message.transactions = object.transactions?.map((e) => ConfirmedTransaction.fromPartial(e)) || [];
    message.rewards = object.rewards?.map((e) => Reward.fromPartial(e)) || [];
    message.blockTime = (object.blockTime !== undefined && object.blockTime !== null)
      ? UnixTimestamp.fromPartial(object.blockTime)
      : undefined;
    message.blockHeight = (object.blockHeight !== undefined && object.blockHeight !== null)
      ? BlockHeight.fromPartial(object.blockHeight)
      : undefined;
    message.numPartitions = (object.numPartitions !== undefined && object.numPartitions !== null)
      ? NumPartitions.fromPartial(object.numPartitions)
      : undefined;
    return message;
  },
};

function createBaseConfirmedTransaction(): ConfirmedTransaction {
  return { transaction: undefined, meta: undefined };
}

export const ConfirmedTransaction = {
  encode(message: ConfirmedTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transaction !== undefined) {
      Transaction.encode(message.transaction, writer.uint32(10).fork()).ldelim();
    }
    if (message.meta !== undefined) {
      TransactionStatusMeta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConfirmedTransaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConfirmedTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.transaction = Transaction.decode(reader, reader.uint32());
          break;
        case 2:
          message.meta = TransactionStatusMeta.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConfirmedTransaction {
    return {
      transaction: isSet(object.transaction) ? Transaction.fromJSON(object.transaction) : undefined,
      meta: isSet(object.meta) ? TransactionStatusMeta.fromJSON(object.meta) : undefined,
    };
  },

  toJSON(message: ConfirmedTransaction): unknown {
    const obj: any = {};
    message.transaction !== undefined &&
      (obj.transaction = message.transaction ? Transaction.toJSON(message.transaction) : undefined);
    message.meta !== undefined && (obj.meta = message.meta ? TransactionStatusMeta.toJSON(message.meta) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ConfirmedTransaction>, I>>(base?: I): ConfirmedTransaction {
    return ConfirmedTransaction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConfirmedTransaction>, I>>(object: I): ConfirmedTransaction {
    const message = createBaseConfirmedTransaction();
    message.transaction = (object.transaction !== undefined && object.transaction !== null)
      ? Transaction.fromPartial(object.transaction)
      : undefined;
    message.meta = (object.meta !== undefined && object.meta !== null)
      ? TransactionStatusMeta.fromPartial(object.meta)
      : undefined;
    return message;
  },
};

function createBaseTransaction(): Transaction {
  return { signatures: [], message: undefined };
}

export const Transaction = {
  encode(message: Transaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.signatures) {
      writer.uint32(10).bytes(v!);
    }
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Transaction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.signatures.push(reader.bytes());
          break;
        case 2:
          message.message = Message.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Transaction {
    return {
      signatures: Array.isArray(object?.signatures) ? object.signatures.map((e: any) => bytesFromBase64(e)) : [],
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
    };
  },

  toJSON(message: Transaction): unknown {
    const obj: any = {};
    if (message.signatures) {
      obj.signatures = message.signatures.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.signatures = [];
    }
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Transaction>, I>>(base?: I): Transaction {
    return Transaction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Transaction>, I>>(object: I): Transaction {
    const message = createBaseTransaction();
    message.signatures = object.signatures?.map((e) => e) || [];
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    return message;
  },
};

function createBaseMessage(): Message {
  return {
    header: undefined,
    accountKeys: [],
    recentBlockhash: new Uint8Array(),
    instructions: [],
    versioned: false,
    addressTableLookups: [],
  };
}

export const Message = {
  encode(message: Message, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.header !== undefined) {
      MessageHeader.encode(message.header, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.accountKeys) {
      writer.uint32(18).bytes(v!);
    }
    if (message.recentBlockhash.length !== 0) {
      writer.uint32(26).bytes(message.recentBlockhash);
    }
    for (const v of message.instructions) {
      CompiledInstruction.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    if (message.versioned === true) {
      writer.uint32(40).bool(message.versioned);
    }
    for (const v of message.addressTableLookups) {
      MessageAddressTableLookup.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Message {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.header = MessageHeader.decode(reader, reader.uint32());
          break;
        case 2:
          message.accountKeys.push(reader.bytes());
          break;
        case 3:
          message.recentBlockhash = reader.bytes();
          break;
        case 4:
          message.instructions.push(CompiledInstruction.decode(reader, reader.uint32()));
          break;
        case 5:
          message.versioned = reader.bool();
          break;
        case 6:
          message.addressTableLookups.push(MessageAddressTableLookup.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Message {
    return {
      header: isSet(object.header) ? MessageHeader.fromJSON(object.header) : undefined,
      accountKeys: Array.isArray(object?.accountKeys) ? object.accountKeys.map((e: any) => bytesFromBase64(e)) : [],
      recentBlockhash: isSet(object.recentBlockhash) ? bytesFromBase64(object.recentBlockhash) : new Uint8Array(),
      instructions: Array.isArray(object?.instructions)
        ? object.instructions.map((e: any) => CompiledInstruction.fromJSON(e))
        : [],
      versioned: isSet(object.versioned) ? Boolean(object.versioned) : false,
      addressTableLookups: Array.isArray(object?.addressTableLookups)
        ? object.addressTableLookups.map((e: any) => MessageAddressTableLookup.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Message): unknown {
    const obj: any = {};
    message.header !== undefined && (obj.header = message.header ? MessageHeader.toJSON(message.header) : undefined);
    if (message.accountKeys) {
      obj.accountKeys = message.accountKeys.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.accountKeys = [];
    }
    message.recentBlockhash !== undefined &&
      (obj.recentBlockhash = base64FromBytes(
        message.recentBlockhash !== undefined ? message.recentBlockhash : new Uint8Array(),
      ));
    if (message.instructions) {
      obj.instructions = message.instructions.map((e) => e ? CompiledInstruction.toJSON(e) : undefined);
    } else {
      obj.instructions = [];
    }
    message.versioned !== undefined && (obj.versioned = message.versioned);
    if (message.addressTableLookups) {
      obj.addressTableLookups = message.addressTableLookups.map((e) =>
        e ? MessageAddressTableLookup.toJSON(e) : undefined
      );
    } else {
      obj.addressTableLookups = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Message>, I>>(base?: I): Message {
    return Message.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Message>, I>>(object: I): Message {
    const message = createBaseMessage();
    message.header = (object.header !== undefined && object.header !== null)
      ? MessageHeader.fromPartial(object.header)
      : undefined;
    message.accountKeys = object.accountKeys?.map((e) => e) || [];
    message.recentBlockhash = object.recentBlockhash ?? new Uint8Array();
    message.instructions = object.instructions?.map((e) => CompiledInstruction.fromPartial(e)) || [];
    message.versioned = object.versioned ?? false;
    message.addressTableLookups = object.addressTableLookups?.map((e) => MessageAddressTableLookup.fromPartial(e)) ||
      [];
    return message;
  },
};

function createBaseMessageHeader(): MessageHeader {
  return { numRequiredSignatures: 0, numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0 };
}

export const MessageHeader = {
  encode(message: MessageHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.numRequiredSignatures !== 0) {
      writer.uint32(8).uint32(message.numRequiredSignatures);
    }
    if (message.numReadonlySignedAccounts !== 0) {
      writer.uint32(16).uint32(message.numReadonlySignedAccounts);
    }
    if (message.numReadonlyUnsignedAccounts !== 0) {
      writer.uint32(24).uint32(message.numReadonlyUnsignedAccounts);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessageHeader {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessageHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.numRequiredSignatures = reader.uint32();
          break;
        case 2:
          message.numReadonlySignedAccounts = reader.uint32();
          break;
        case 3:
          message.numReadonlyUnsignedAccounts = reader.uint32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MessageHeader {
    return {
      numRequiredSignatures: isSet(object.numRequiredSignatures) ? Number(object.numRequiredSignatures) : 0,
      numReadonlySignedAccounts: isSet(object.numReadonlySignedAccounts) ? Number(object.numReadonlySignedAccounts) : 0,
      numReadonlyUnsignedAccounts: isSet(object.numReadonlyUnsignedAccounts)
        ? Number(object.numReadonlyUnsignedAccounts)
        : 0,
    };
  },

  toJSON(message: MessageHeader): unknown {
    const obj: any = {};
    message.numRequiredSignatures !== undefined &&
      (obj.numRequiredSignatures = Math.round(message.numRequiredSignatures));
    message.numReadonlySignedAccounts !== undefined &&
      (obj.numReadonlySignedAccounts = Math.round(message.numReadonlySignedAccounts));
    message.numReadonlyUnsignedAccounts !== undefined &&
      (obj.numReadonlyUnsignedAccounts = Math.round(message.numReadonlyUnsignedAccounts));
    return obj;
  },

  create<I extends Exact<DeepPartial<MessageHeader>, I>>(base?: I): MessageHeader {
    return MessageHeader.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessageHeader>, I>>(object: I): MessageHeader {
    const message = createBaseMessageHeader();
    message.numRequiredSignatures = object.numRequiredSignatures ?? 0;
    message.numReadonlySignedAccounts = object.numReadonlySignedAccounts ?? 0;
    message.numReadonlyUnsignedAccounts = object.numReadonlyUnsignedAccounts ?? 0;
    return message;
  },
};

function createBaseMessageAddressTableLookup(): MessageAddressTableLookup {
  return { accountKey: new Uint8Array(), writableIndexes: new Uint8Array(), readonlyIndexes: new Uint8Array() };
}

export const MessageAddressTableLookup = {
  encode(message: MessageAddressTableLookup, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.accountKey.length !== 0) {
      writer.uint32(10).bytes(message.accountKey);
    }
    if (message.writableIndexes.length !== 0) {
      writer.uint32(18).bytes(message.writableIndexes);
    }
    if (message.readonlyIndexes.length !== 0) {
      writer.uint32(26).bytes(message.readonlyIndexes);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessageAddressTableLookup {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessageAddressTableLookup();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.accountKey = reader.bytes();
          break;
        case 2:
          message.writableIndexes = reader.bytes();
          break;
        case 3:
          message.readonlyIndexes = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MessageAddressTableLookup {
    return {
      accountKey: isSet(object.accountKey) ? bytesFromBase64(object.accountKey) : new Uint8Array(),
      writableIndexes: isSet(object.writableIndexes) ? bytesFromBase64(object.writableIndexes) : new Uint8Array(),
      readonlyIndexes: isSet(object.readonlyIndexes) ? bytesFromBase64(object.readonlyIndexes) : new Uint8Array(),
    };
  },

  toJSON(message: MessageAddressTableLookup): unknown {
    const obj: any = {};
    message.accountKey !== undefined &&
      (obj.accountKey = base64FromBytes(message.accountKey !== undefined ? message.accountKey : new Uint8Array()));
    message.writableIndexes !== undefined &&
      (obj.writableIndexes = base64FromBytes(
        message.writableIndexes !== undefined ? message.writableIndexes : new Uint8Array(),
      ));
    message.readonlyIndexes !== undefined &&
      (obj.readonlyIndexes = base64FromBytes(
        message.readonlyIndexes !== undefined ? message.readonlyIndexes : new Uint8Array(),
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<MessageAddressTableLookup>, I>>(base?: I): MessageAddressTableLookup {
    return MessageAddressTableLookup.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessageAddressTableLookup>, I>>(object: I): MessageAddressTableLookup {
    const message = createBaseMessageAddressTableLookup();
    message.accountKey = object.accountKey ?? new Uint8Array();
    message.writableIndexes = object.writableIndexes ?? new Uint8Array();
    message.readonlyIndexes = object.readonlyIndexes ?? new Uint8Array();
    return message;
  },
};

function createBaseTransactionStatusMeta(): TransactionStatusMeta {
  return {
    err: undefined,
    fee: "0",
    preBalances: [],
    postBalances: [],
    innerInstructions: [],
    innerInstructionsNone: false,
    logMessages: [],
    logMessagesNone: false,
    preTokenBalances: [],
    postTokenBalances: [],
    rewards: [],
    loadedWritableAddresses: [],
    loadedReadonlyAddresses: [],
    returnData: undefined,
    returnDataNone: false,
    computeUnitsConsumed: undefined,
  };
}

export const TransactionStatusMeta = {
  encode(message: TransactionStatusMeta, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.err !== undefined) {
      TransactionError.encode(message.err, writer.uint32(10).fork()).ldelim();
    }
    if (message.fee !== "0") {
      writer.uint32(16).uint64(message.fee);
    }
    writer.uint32(26).fork();
    for (const v of message.preBalances) {
      writer.uint64(v);
    }
    writer.ldelim();
    writer.uint32(34).fork();
    for (const v of message.postBalances) {
      writer.uint64(v);
    }
    writer.ldelim();
    for (const v of message.innerInstructions) {
      InnerInstructions.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    if (message.innerInstructionsNone === true) {
      writer.uint32(80).bool(message.innerInstructionsNone);
    }
    for (const v of message.logMessages) {
      writer.uint32(50).string(v!);
    }
    if (message.logMessagesNone === true) {
      writer.uint32(88).bool(message.logMessagesNone);
    }
    for (const v of message.preTokenBalances) {
      TokenBalance.encode(v!, writer.uint32(58).fork()).ldelim();
    }
    for (const v of message.postTokenBalances) {
      TokenBalance.encode(v!, writer.uint32(66).fork()).ldelim();
    }
    for (const v of message.rewards) {
      Reward.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    for (const v of message.loadedWritableAddresses) {
      writer.uint32(98).bytes(v!);
    }
    for (const v of message.loadedReadonlyAddresses) {
      writer.uint32(106).bytes(v!);
    }
    if (message.returnData !== undefined) {
      ReturnData.encode(message.returnData, writer.uint32(114).fork()).ldelim();
    }
    if (message.returnDataNone === true) {
      writer.uint32(120).bool(message.returnDataNone);
    }
    if (message.computeUnitsConsumed !== undefined) {
      writer.uint32(128).uint64(message.computeUnitsConsumed);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionStatusMeta {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionStatusMeta();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.err = TransactionError.decode(reader, reader.uint32());
          break;
        case 2:
          message.fee = longToString(reader.uint64() as Long);
          break;
        case 3:
          if ((tag & 7) === 2) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.preBalances.push(longToString(reader.uint64() as Long));
            }
          } else {
            message.preBalances.push(longToString(reader.uint64() as Long));
          }
          break;
        case 4:
          if ((tag & 7) === 2) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.postBalances.push(longToString(reader.uint64() as Long));
            }
          } else {
            message.postBalances.push(longToString(reader.uint64() as Long));
          }
          break;
        case 5:
          message.innerInstructions.push(InnerInstructions.decode(reader, reader.uint32()));
          break;
        case 10:
          message.innerInstructionsNone = reader.bool();
          break;
        case 6:
          message.logMessages.push(reader.string());
          break;
        case 11:
          message.logMessagesNone = reader.bool();
          break;
        case 7:
          message.preTokenBalances.push(TokenBalance.decode(reader, reader.uint32()));
          break;
        case 8:
          message.postTokenBalances.push(TokenBalance.decode(reader, reader.uint32()));
          break;
        case 9:
          message.rewards.push(Reward.decode(reader, reader.uint32()));
          break;
        case 12:
          message.loadedWritableAddresses.push(reader.bytes());
          break;
        case 13:
          message.loadedReadonlyAddresses.push(reader.bytes());
          break;
        case 14:
          message.returnData = ReturnData.decode(reader, reader.uint32());
          break;
        case 15:
          message.returnDataNone = reader.bool();
          break;
        case 16:
          message.computeUnitsConsumed = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TransactionStatusMeta {
    return {
      err: isSet(object.err) ? TransactionError.fromJSON(object.err) : undefined,
      fee: isSet(object.fee) ? String(object.fee) : "0",
      preBalances: Array.isArray(object?.preBalances) ? object.preBalances.map((e: any) => String(e)) : [],
      postBalances: Array.isArray(object?.postBalances) ? object.postBalances.map((e: any) => String(e)) : [],
      innerInstructions: Array.isArray(object?.innerInstructions)
        ? object.innerInstructions.map((e: any) => InnerInstructions.fromJSON(e))
        : [],
      innerInstructionsNone: isSet(object.innerInstructionsNone) ? Boolean(object.innerInstructionsNone) : false,
      logMessages: Array.isArray(object?.logMessages) ? object.logMessages.map((e: any) => String(e)) : [],
      logMessagesNone: isSet(object.logMessagesNone) ? Boolean(object.logMessagesNone) : false,
      preTokenBalances: Array.isArray(object?.preTokenBalances)
        ? object.preTokenBalances.map((e: any) => TokenBalance.fromJSON(e))
        : [],
      postTokenBalances: Array.isArray(object?.postTokenBalances)
        ? object.postTokenBalances.map((e: any) => TokenBalance.fromJSON(e))
        : [],
      rewards: Array.isArray(object?.rewards) ? object.rewards.map((e: any) => Reward.fromJSON(e)) : [],
      loadedWritableAddresses: Array.isArray(object?.loadedWritableAddresses)
        ? object.loadedWritableAddresses.map((e: any) => bytesFromBase64(e))
        : [],
      loadedReadonlyAddresses: Array.isArray(object?.loadedReadonlyAddresses)
        ? object.loadedReadonlyAddresses.map((e: any) => bytesFromBase64(e))
        : [],
      returnData: isSet(object.returnData) ? ReturnData.fromJSON(object.returnData) : undefined,
      returnDataNone: isSet(object.returnDataNone) ? Boolean(object.returnDataNone) : false,
      computeUnitsConsumed: isSet(object.computeUnitsConsumed) ? String(object.computeUnitsConsumed) : undefined,
    };
  },

  toJSON(message: TransactionStatusMeta): unknown {
    const obj: any = {};
    message.err !== undefined && (obj.err = message.err ? TransactionError.toJSON(message.err) : undefined);
    message.fee !== undefined && (obj.fee = message.fee);
    if (message.preBalances) {
      obj.preBalances = message.preBalances.map((e) => e);
    } else {
      obj.preBalances = [];
    }
    if (message.postBalances) {
      obj.postBalances = message.postBalances.map((e) => e);
    } else {
      obj.postBalances = [];
    }
    if (message.innerInstructions) {
      obj.innerInstructions = message.innerInstructions.map((e) => e ? InnerInstructions.toJSON(e) : undefined);
    } else {
      obj.innerInstructions = [];
    }
    message.innerInstructionsNone !== undefined && (obj.innerInstructionsNone = message.innerInstructionsNone);
    if (message.logMessages) {
      obj.logMessages = message.logMessages.map((e) => e);
    } else {
      obj.logMessages = [];
    }
    message.logMessagesNone !== undefined && (obj.logMessagesNone = message.logMessagesNone);
    if (message.preTokenBalances) {
      obj.preTokenBalances = message.preTokenBalances.map((e) => e ? TokenBalance.toJSON(e) : undefined);
    } else {
      obj.preTokenBalances = [];
    }
    if (message.postTokenBalances) {
      obj.postTokenBalances = message.postTokenBalances.map((e) => e ? TokenBalance.toJSON(e) : undefined);
    } else {
      obj.postTokenBalances = [];
    }
    if (message.rewards) {
      obj.rewards = message.rewards.map((e) => e ? Reward.toJSON(e) : undefined);
    } else {
      obj.rewards = [];
    }
    if (message.loadedWritableAddresses) {
      obj.loadedWritableAddresses = message.loadedWritableAddresses.map((e) =>
        base64FromBytes(e !== undefined ? e : new Uint8Array())
      );
    } else {
      obj.loadedWritableAddresses = [];
    }
    if (message.loadedReadonlyAddresses) {
      obj.loadedReadonlyAddresses = message.loadedReadonlyAddresses.map((e) =>
        base64FromBytes(e !== undefined ? e : new Uint8Array())
      );
    } else {
      obj.loadedReadonlyAddresses = [];
    }
    message.returnData !== undefined &&
      (obj.returnData = message.returnData ? ReturnData.toJSON(message.returnData) : undefined);
    message.returnDataNone !== undefined && (obj.returnDataNone = message.returnDataNone);
    message.computeUnitsConsumed !== undefined && (obj.computeUnitsConsumed = message.computeUnitsConsumed);
    return obj;
  },

  create<I extends Exact<DeepPartial<TransactionStatusMeta>, I>>(base?: I): TransactionStatusMeta {
    return TransactionStatusMeta.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TransactionStatusMeta>, I>>(object: I): TransactionStatusMeta {
    const message = createBaseTransactionStatusMeta();
    message.err = (object.err !== undefined && object.err !== null)
      ? TransactionError.fromPartial(object.err)
      : undefined;
    message.fee = object.fee ?? "0";
    message.preBalances = object.preBalances?.map((e) => e) || [];
    message.postBalances = object.postBalances?.map((e) => e) || [];
    message.innerInstructions = object.innerInstructions?.map((e) => InnerInstructions.fromPartial(e)) || [];
    message.innerInstructionsNone = object.innerInstructionsNone ?? false;
    message.logMessages = object.logMessages?.map((e) => e) || [];
    message.logMessagesNone = object.logMessagesNone ?? false;
    message.preTokenBalances = object.preTokenBalances?.map((e) => TokenBalance.fromPartial(e)) || [];
    message.postTokenBalances = object.postTokenBalances?.map((e) => TokenBalance.fromPartial(e)) || [];
    message.rewards = object.rewards?.map((e) => Reward.fromPartial(e)) || [];
    message.loadedWritableAddresses = object.loadedWritableAddresses?.map((e) => e) || [];
    message.loadedReadonlyAddresses = object.loadedReadonlyAddresses?.map((e) => e) || [];
    message.returnData = (object.returnData !== undefined && object.returnData !== null)
      ? ReturnData.fromPartial(object.returnData)
      : undefined;
    message.returnDataNone = object.returnDataNone ?? false;
    message.computeUnitsConsumed = object.computeUnitsConsumed ?? undefined;
    return message;
  },
};

function createBaseTransactionError(): TransactionError {
  return { err: new Uint8Array() };
}

export const TransactionError = {
  encode(message: TransactionError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.err.length !== 0) {
      writer.uint32(10).bytes(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TransactionError {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransactionError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.err = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TransactionError {
    return { err: isSet(object.err) ? bytesFromBase64(object.err) : new Uint8Array() };
  },

  toJSON(message: TransactionError): unknown {
    const obj: any = {};
    message.err !== undefined &&
      (obj.err = base64FromBytes(message.err !== undefined ? message.err : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<TransactionError>, I>>(base?: I): TransactionError {
    return TransactionError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TransactionError>, I>>(object: I): TransactionError {
    const message = createBaseTransactionError();
    message.err = object.err ?? new Uint8Array();
    return message;
  },
};

function createBaseInnerInstructions(): InnerInstructions {
  return { index: 0, instructions: [] };
}

export const InnerInstructions = {
  encode(message: InnerInstructions, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.index !== 0) {
      writer.uint32(8).uint32(message.index);
    }
    for (const v of message.instructions) {
      InnerInstruction.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InnerInstructions {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInnerInstructions();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.index = reader.uint32();
          break;
        case 2:
          message.instructions.push(InnerInstruction.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): InnerInstructions {
    return {
      index: isSet(object.index) ? Number(object.index) : 0,
      instructions: Array.isArray(object?.instructions)
        ? object.instructions.map((e: any) => InnerInstruction.fromJSON(e))
        : [],
    };
  },

  toJSON(message: InnerInstructions): unknown {
    const obj: any = {};
    message.index !== undefined && (obj.index = Math.round(message.index));
    if (message.instructions) {
      obj.instructions = message.instructions.map((e) => e ? InnerInstruction.toJSON(e) : undefined);
    } else {
      obj.instructions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<InnerInstructions>, I>>(base?: I): InnerInstructions {
    return InnerInstructions.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<InnerInstructions>, I>>(object: I): InnerInstructions {
    const message = createBaseInnerInstructions();
    message.index = object.index ?? 0;
    message.instructions = object.instructions?.map((e) => InnerInstruction.fromPartial(e)) || [];
    return message;
  },
};

function createBaseInnerInstruction(): InnerInstruction {
  return { programIdIndex: 0, accounts: new Uint8Array(), data: new Uint8Array(), stackHeight: undefined };
}

export const InnerInstruction = {
  encode(message: InnerInstruction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.programIdIndex !== 0) {
      writer.uint32(8).uint32(message.programIdIndex);
    }
    if (message.accounts.length !== 0) {
      writer.uint32(18).bytes(message.accounts);
    }
    if (message.data.length !== 0) {
      writer.uint32(26).bytes(message.data);
    }
    if (message.stackHeight !== undefined) {
      writer.uint32(32).uint32(message.stackHeight);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InnerInstruction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInnerInstruction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.programIdIndex = reader.uint32();
          break;
        case 2:
          message.accounts = reader.bytes();
          break;
        case 3:
          message.data = reader.bytes();
          break;
        case 4:
          message.stackHeight = reader.uint32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): InnerInstruction {
    return {
      programIdIndex: isSet(object.programIdIndex) ? Number(object.programIdIndex) : 0,
      accounts: isSet(object.accounts) ? bytesFromBase64(object.accounts) : new Uint8Array(),
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(),
      stackHeight: isSet(object.stackHeight) ? Number(object.stackHeight) : undefined,
    };
  },

  toJSON(message: InnerInstruction): unknown {
    const obj: any = {};
    message.programIdIndex !== undefined && (obj.programIdIndex = Math.round(message.programIdIndex));
    message.accounts !== undefined &&
      (obj.accounts = base64FromBytes(message.accounts !== undefined ? message.accounts : new Uint8Array()));
    message.data !== undefined &&
      (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
    message.stackHeight !== undefined && (obj.stackHeight = Math.round(message.stackHeight));
    return obj;
  },

  create<I extends Exact<DeepPartial<InnerInstruction>, I>>(base?: I): InnerInstruction {
    return InnerInstruction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<InnerInstruction>, I>>(object: I): InnerInstruction {
    const message = createBaseInnerInstruction();
    message.programIdIndex = object.programIdIndex ?? 0;
    message.accounts = object.accounts ?? new Uint8Array();
    message.data = object.data ?? new Uint8Array();
    message.stackHeight = object.stackHeight ?? undefined;
    return message;
  },
};

function createBaseCompiledInstruction(): CompiledInstruction {
  return { programIdIndex: 0, accounts: new Uint8Array(), data: new Uint8Array() };
}

export const CompiledInstruction = {
  encode(message: CompiledInstruction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.programIdIndex !== 0) {
      writer.uint32(8).uint32(message.programIdIndex);
    }
    if (message.accounts.length !== 0) {
      writer.uint32(18).bytes(message.accounts);
    }
    if (message.data.length !== 0) {
      writer.uint32(26).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CompiledInstruction {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCompiledInstruction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.programIdIndex = reader.uint32();
          break;
        case 2:
          message.accounts = reader.bytes();
          break;
        case 3:
          message.data = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CompiledInstruction {
    return {
      programIdIndex: isSet(object.programIdIndex) ? Number(object.programIdIndex) : 0,
      accounts: isSet(object.accounts) ? bytesFromBase64(object.accounts) : new Uint8Array(),
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(),
    };
  },

  toJSON(message: CompiledInstruction): unknown {
    const obj: any = {};
    message.programIdIndex !== undefined && (obj.programIdIndex = Math.round(message.programIdIndex));
    message.accounts !== undefined &&
      (obj.accounts = base64FromBytes(message.accounts !== undefined ? message.accounts : new Uint8Array()));
    message.data !== undefined &&
      (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<CompiledInstruction>, I>>(base?: I): CompiledInstruction {
    return CompiledInstruction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CompiledInstruction>, I>>(object: I): CompiledInstruction {
    const message = createBaseCompiledInstruction();
    message.programIdIndex = object.programIdIndex ?? 0;
    message.accounts = object.accounts ?? new Uint8Array();
    message.data = object.data ?? new Uint8Array();
    return message;
  },
};

function createBaseTokenBalance(): TokenBalance {
  return { accountIndex: 0, mint: "", uiTokenAmount: undefined, owner: "", programId: "" };
}

export const TokenBalance = {
  encode(message: TokenBalance, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.accountIndex !== 0) {
      writer.uint32(8).uint32(message.accountIndex);
    }
    if (message.mint !== "") {
      writer.uint32(18).string(message.mint);
    }
    if (message.uiTokenAmount !== undefined) {
      UiTokenAmount.encode(message.uiTokenAmount, writer.uint32(26).fork()).ldelim();
    }
    if (message.owner !== "") {
      writer.uint32(34).string(message.owner);
    }
    if (message.programId !== "") {
      writer.uint32(42).string(message.programId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TokenBalance {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTokenBalance();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.accountIndex = reader.uint32();
          break;
        case 2:
          message.mint = reader.string();
          break;
        case 3:
          message.uiTokenAmount = UiTokenAmount.decode(reader, reader.uint32());
          break;
        case 4:
          message.owner = reader.string();
          break;
        case 5:
          message.programId = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TokenBalance {
    return {
      accountIndex: isSet(object.accountIndex) ? Number(object.accountIndex) : 0,
      mint: isSet(object.mint) ? String(object.mint) : "",
      uiTokenAmount: isSet(object.uiTokenAmount) ? UiTokenAmount.fromJSON(object.uiTokenAmount) : undefined,
      owner: isSet(object.owner) ? String(object.owner) : "",
      programId: isSet(object.programId) ? String(object.programId) : "",
    };
  },

  toJSON(message: TokenBalance): unknown {
    const obj: any = {};
    message.accountIndex !== undefined && (obj.accountIndex = Math.round(message.accountIndex));
    message.mint !== undefined && (obj.mint = message.mint);
    message.uiTokenAmount !== undefined &&
      (obj.uiTokenAmount = message.uiTokenAmount ? UiTokenAmount.toJSON(message.uiTokenAmount) : undefined);
    message.owner !== undefined && (obj.owner = message.owner);
    message.programId !== undefined && (obj.programId = message.programId);
    return obj;
  },

  create<I extends Exact<DeepPartial<TokenBalance>, I>>(base?: I): TokenBalance {
    return TokenBalance.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TokenBalance>, I>>(object: I): TokenBalance {
    const message = createBaseTokenBalance();
    message.accountIndex = object.accountIndex ?? 0;
    message.mint = object.mint ?? "";
    message.uiTokenAmount = (object.uiTokenAmount !== undefined && object.uiTokenAmount !== null)
      ? UiTokenAmount.fromPartial(object.uiTokenAmount)
      : undefined;
    message.owner = object.owner ?? "";
    message.programId = object.programId ?? "";
    return message;
  },
};

function createBaseUiTokenAmount(): UiTokenAmount {
  return { uiAmount: 0, decimals: 0, amount: "", uiAmountString: "" };
}

export const UiTokenAmount = {
  encode(message: UiTokenAmount, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.uiAmount !== 0) {
      writer.uint32(9).double(message.uiAmount);
    }
    if (message.decimals !== 0) {
      writer.uint32(16).uint32(message.decimals);
    }
    if (message.amount !== "") {
      writer.uint32(26).string(message.amount);
    }
    if (message.uiAmountString !== "") {
      writer.uint32(34).string(message.uiAmountString);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UiTokenAmount {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUiTokenAmount();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.uiAmount = reader.double();
          break;
        case 2:
          message.decimals = reader.uint32();
          break;
        case 3:
          message.amount = reader.string();
          break;
        case 4:
          message.uiAmountString = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): UiTokenAmount {
    return {
      uiAmount: isSet(object.uiAmount) ? Number(object.uiAmount) : 0,
      decimals: isSet(object.decimals) ? Number(object.decimals) : 0,
      amount: isSet(object.amount) ? String(object.amount) : "",
      uiAmountString: isSet(object.uiAmountString) ? String(object.uiAmountString) : "",
    };
  },

  toJSON(message: UiTokenAmount): unknown {
    const obj: any = {};
    message.uiAmount !== undefined && (obj.uiAmount = message.uiAmount);
    message.decimals !== undefined && (obj.decimals = Math.round(message.decimals));
    message.amount !== undefined && (obj.amount = message.amount);
    message.uiAmountString !== undefined && (obj.uiAmountString = message.uiAmountString);
    return obj;
  },

  create<I extends Exact<DeepPartial<UiTokenAmount>, I>>(base?: I): UiTokenAmount {
    return UiTokenAmount.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UiTokenAmount>, I>>(object: I): UiTokenAmount {
    const message = createBaseUiTokenAmount();
    message.uiAmount = object.uiAmount ?? 0;
    message.decimals = object.decimals ?? 0;
    message.amount = object.amount ?? "";
    message.uiAmountString = object.uiAmountString ?? "";
    return message;
  },
};

function createBaseReturnData(): ReturnData {
  return { programId: new Uint8Array(), data: new Uint8Array() };
}

export const ReturnData = {
  encode(message: ReturnData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.programId.length !== 0) {
      writer.uint32(10).bytes(message.programId);
    }
    if (message.data.length !== 0) {
      writer.uint32(18).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReturnData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReturnData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.programId = reader.bytes();
          break;
        case 2:
          message.data = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ReturnData {
    return {
      programId: isSet(object.programId) ? bytesFromBase64(object.programId) : new Uint8Array(),
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(),
    };
  },

  toJSON(message: ReturnData): unknown {
    const obj: any = {};
    message.programId !== undefined &&
      (obj.programId = base64FromBytes(message.programId !== undefined ? message.programId : new Uint8Array()));
    message.data !== undefined &&
      (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ReturnData>, I>>(base?: I): ReturnData {
    return ReturnData.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReturnData>, I>>(object: I): ReturnData {
    const message = createBaseReturnData();
    message.programId = object.programId ?? new Uint8Array();
    message.data = object.data ?? new Uint8Array();
    return message;
  },
};

function createBaseReward(): Reward {
  return { pubkey: "", lamports: "0", postBalance: "0", rewardType: 0, commission: "" };
}

export const Reward = {
  encode(message: Reward, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pubkey !== "") {
      writer.uint32(10).string(message.pubkey);
    }
    if (message.lamports !== "0") {
      writer.uint32(16).int64(message.lamports);
    }
    if (message.postBalance !== "0") {
      writer.uint32(24).uint64(message.postBalance);
    }
    if (message.rewardType !== 0) {
      writer.uint32(32).int32(message.rewardType);
    }
    if (message.commission !== "") {
      writer.uint32(42).string(message.commission);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Reward {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReward();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.pubkey = reader.string();
          break;
        case 2:
          message.lamports = longToString(reader.int64() as Long);
          break;
        case 3:
          message.postBalance = longToString(reader.uint64() as Long);
          break;
        case 4:
          message.rewardType = reader.int32() as any;
          break;
        case 5:
          message.commission = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Reward {
    return {
      pubkey: isSet(object.pubkey) ? String(object.pubkey) : "",
      lamports: isSet(object.lamports) ? String(object.lamports) : "0",
      postBalance: isSet(object.postBalance) ? String(object.postBalance) : "0",
      rewardType: isSet(object.rewardType) ? rewardTypeFromJSON(object.rewardType) : 0,
      commission: isSet(object.commission) ? String(object.commission) : "",
    };
  },

  toJSON(message: Reward): unknown {
    const obj: any = {};
    message.pubkey !== undefined && (obj.pubkey = message.pubkey);
    message.lamports !== undefined && (obj.lamports = message.lamports);
    message.postBalance !== undefined && (obj.postBalance = message.postBalance);
    message.rewardType !== undefined && (obj.rewardType = rewardTypeToJSON(message.rewardType));
    message.commission !== undefined && (obj.commission = message.commission);
    return obj;
  },

  create<I extends Exact<DeepPartial<Reward>, I>>(base?: I): Reward {
    return Reward.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Reward>, I>>(object: I): Reward {
    const message = createBaseReward();
    message.pubkey = object.pubkey ?? "";
    message.lamports = object.lamports ?? "0";
    message.postBalance = object.postBalance ?? "0";
    message.rewardType = object.rewardType ?? 0;
    message.commission = object.commission ?? "";
    return message;
  },
};

function createBaseRewards(): Rewards {
  return { rewards: [], numPartitions: undefined };
}

export const Rewards = {
  encode(message: Rewards, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.rewards) {
      Reward.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.numPartitions !== undefined) {
      NumPartitions.encode(message.numPartitions, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Rewards {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRewards();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.rewards.push(Reward.decode(reader, reader.uint32()));
          break;
        case 2:
          message.numPartitions = NumPartitions.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Rewards {
    return {
      rewards: Array.isArray(object?.rewards) ? object.rewards.map((e: any) => Reward.fromJSON(e)) : [],
      numPartitions: isSet(object.numPartitions) ? NumPartitions.fromJSON(object.numPartitions) : undefined,
    };
  },

  toJSON(message: Rewards): unknown {
    const obj: any = {};
    if (message.rewards) {
      obj.rewards = message.rewards.map((e) => e ? Reward.toJSON(e) : undefined);
    } else {
      obj.rewards = [];
    }
    message.numPartitions !== undefined &&
      (obj.numPartitions = message.numPartitions ? NumPartitions.toJSON(message.numPartitions) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Rewards>, I>>(base?: I): Rewards {
    return Rewards.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Rewards>, I>>(object: I): Rewards {
    const message = createBaseRewards();
    message.rewards = object.rewards?.map((e) => Reward.fromPartial(e)) || [];
    message.numPartitions = (object.numPartitions !== undefined && object.numPartitions !== null)
      ? NumPartitions.fromPartial(object.numPartitions)
      : undefined;
    return message;
  },
};

function createBaseUnixTimestamp(): UnixTimestamp {
  return { timestamp: "0" };
}

export const UnixTimestamp = {
  encode(message: UnixTimestamp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.timestamp !== "0") {
      writer.uint32(8).int64(message.timestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UnixTimestamp {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUnixTimestamp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.timestamp = longToString(reader.int64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): UnixTimestamp {
    return { timestamp: isSet(object.timestamp) ? String(object.timestamp) : "0" };
  },

  toJSON(message: UnixTimestamp): unknown {
    const obj: any = {};
    message.timestamp !== undefined && (obj.timestamp = message.timestamp);
    return obj;
  },

  create<I extends Exact<DeepPartial<UnixTimestamp>, I>>(base?: I): UnixTimestamp {
    return UnixTimestamp.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UnixTimestamp>, I>>(object: I): UnixTimestamp {
    const message = createBaseUnixTimestamp();
    message.timestamp = object.timestamp ?? "0";
    return message;
  },
};

function createBaseBlockHeight(): BlockHeight {
  return { blockHeight: "0" };
}

export const BlockHeight = {
  encode(message: BlockHeight, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockHeight !== "0") {
      writer.uint32(8).uint64(message.blockHeight);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockHeight {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockHeight();
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

  fromJSON(object: any): BlockHeight {
    return { blockHeight: isSet(object.blockHeight) ? String(object.blockHeight) : "0" };
  },

  toJSON(message: BlockHeight): unknown {
    const obj: any = {};
    message.blockHeight !== undefined && (obj.blockHeight = message.blockHeight);
    return obj;
  },

  create<I extends Exact<DeepPartial<BlockHeight>, I>>(base?: I): BlockHeight {
    return BlockHeight.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlockHeight>, I>>(object: I): BlockHeight {
    const message = createBaseBlockHeight();
    message.blockHeight = object.blockHeight ?? "0";
    return message;
  },
};

function createBaseNumPartitions(): NumPartitions {
  return { numPartitions: "0" };
}

export const NumPartitions = {
  encode(message: NumPartitions, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.numPartitions !== "0") {
      writer.uint32(8).uint64(message.numPartitions);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NumPartitions {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNumPartitions();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.numPartitions = longToString(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): NumPartitions {
    return { numPartitions: isSet(object.numPartitions) ? String(object.numPartitions) : "0" };
  },

  toJSON(message: NumPartitions): unknown {
    const obj: any = {};
    message.numPartitions !== undefined && (obj.numPartitions = message.numPartitions);
    return obj;
  },

  create<I extends Exact<DeepPartial<NumPartitions>, I>>(base?: I): NumPartitions {
    return NumPartitions.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<NumPartitions>, I>>(object: I): NumPartitions {
    const message = createBaseNumPartitions();
    message.numPartitions = object.numPartitions ?? "0";
    return message;
  },
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

function longToString(long: Long) {
  return long.toString();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
