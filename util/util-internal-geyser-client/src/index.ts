/**
 * TypeScript/JavaScript client for gRPC Geyser.
 */

import {
  ChannelCredentials,
  credentials,
  ChannelOptions,
  Metadata,
} from "@grpc/grpc-js";

// Import generated gRPC client and types.
import {
  CommitmentLevel,
  GetLatestBlockhashResponse,
  GeyserClient,
  IsBlockhashValidResponse,
  SubscribeRequestAccountsDataSlice,
  SubscribeRequestFilterAccounts,
  SubscribeRequestFilterBlocks,
  SubscribeRequestFilterBlocksMeta,
  SubscribeRequestFilterEntry,
  SubscribeRequestFilterSlots,
  SubscribeRequestFilterTransactions,
  SubscribeUpdateTransactionInfo,
} from "./grpc/geyser";

// Reexport automatically generated types
export {
  CommitmentLevel,
  SubscribeRequest,
  SubscribeRequestAccountsDataSlice,
  SubscribeRequestFilterAccounts,
  SubscribeRequestFilterAccountsFilter,
  SubscribeRequestFilterAccountsFilterMemcmp,
  SubscribeRequestFilterAccountsFilterLamports,
  SubscribeRequestFilterBlocks,
  SubscribeRequestFilterBlocksMeta,
  SubscribeRequestFilterEntry,
  SubscribeRequestFilterSlots,
  SubscribeRequestFilterTransactions,
  SubscribeRequest_AccountsEntry,
  SubscribeRequest_BlocksEntry,
  SubscribeRequest_BlocksMetaEntry,
  SubscribeRequest_SlotsEntry,
  SubscribeRequest_TransactionsEntry,
  SubscribeUpdate,
  SubscribeUpdateAccount,
  SubscribeUpdateAccountInfo,
  SubscribeUpdateBlock,
  SubscribeUpdateBlockMeta,
  SubscribeUpdatePing,
  SubscribeUpdateSlot,
  SubscribeUpdateTransaction,
  SubscribeUpdateTransactionInfo,
} from "./grpc/geyser";

export {
    RewardType,
    Reward
} from './grpc/solana-storage'

// Import transaction encoding function created in Rust
import * as wasm from "../encoding/yellowstone_grpc_solana_encoding_wasm";

export const txEncode = {
  encoding: wasm.WasmUiTransactionEncoding,
  encode_raw: wasm.encode_tx,
  encode: <T extends wasm.WasmUiTransactionEncoding>(
    message: SubscribeUpdateTransactionInfo,
    encoding: T,
    max_supported_transaction_version: number | undefined,
    show_rewards: boolean
  ): any => {
    return JSON.parse(
      wasm.encode_tx(
        SubscribeUpdateTransactionInfo.encode(message).finish(),
        encoding,
        max_supported_transaction_version,
        show_rewards
      )
    );
  },
};

export const txErrDecode = {
  decode_raw: wasm.decode_tx_error,
  decode: (buf: Uint8Array): any => {
    return JSON.parse(wasm.decode_tx_error(buf));
  },
};

export default class Client {
  _client: GeyserClient;
  _insecureXToken: string | undefined;
  constructor(
    endpoint: string,
    xToken: string | undefined,
    channelOptions: ChannelOptions | undefined
  ) {
    let creds: ChannelCredentials;

    const endpointURL = new URL(endpoint);
    let port = endpointURL.port;
    if (port == "") {
      switch (endpointURL.protocol) {
        case "https:":
          port = "443";
          break;
        case "http:":
          port = "80";
          break;
      }
    }

    // Check if we need to use TLS.
    if (endpointURL.protocol === "https:") {
      creds = credentials.combineChannelCredentials(
        credentials.createSsl(),
        credentials.createFromMetadataGenerator((_params, callback) => {
          const metadata = new Metadata();
          if (xToken !== undefined) {
            metadata.add("x-access-token", xToken);
          }
          return callback(null, metadata);
        })
      );
    } else {
      creds = ChannelCredentials.createInsecure();
      if (xToken !== undefined) {
        this._insecureXToken = xToken;
      }
    }

    this._client = new GeyserClient(
      `${endpointURL.hostname}:${port}`,
      creds,
      channelOptions
    );
  }

  private _getInsecureMetadata(): Metadata {
    const metadata = new Metadata();
    if (this._insecureXToken) {
      metadata.add("x-token", this._insecureXToken);
    }
    return metadata;
  }

  async subscribe() {
    return await this._client.subscribe(this._getInsecureMetadata());
  }

  async subscribeOnce(
    accounts: { [key: string]: SubscribeRequestFilterAccounts },
    slots: { [key: string]: SubscribeRequestFilterSlots },
    transactions: { [key: string]: SubscribeRequestFilterTransactions },
    transactionsStatus: { [key: string]: SubscribeRequestFilterTransactions },
    entry: { [key: string]: SubscribeRequestFilterEntry },
    blocks: { [key: string]: SubscribeRequestFilterBlocks },
    blocksMeta: { [key: string]: SubscribeRequestFilterBlocksMeta },
    commitment: CommitmentLevel | undefined,
    accountsDataSlice: SubscribeRequestAccountsDataSlice[]
  ) {
    const stream = await this._client.subscribe(this._getInsecureMetadata());

    await new Promise<void>((resolve, reject) => {
      stream.write(
        {
          accounts,
          slots,
          transactions,
          transactionsStatus,
          entry,
          blocks,
          blocksMeta,
          commitment,
          accountsDataSlice,
        },
        (err: any) => {
          if (err === null || err === undefined) {
            resolve();
          } else {
            reject(err);
          }
        }
      );
    });

    return stream;
  }

  async ping(count: number): Promise<number> {
    return await new Promise<number>((resolve, reject) => {
      this._client.ping(
        { count },
        this._getInsecureMetadata(),
        (err, response) => {
          if (err === null || err === undefined) {
            resolve(response.count);
          } else {
            reject(err);
          }
        }
      );
    });
  }

  async getLatestBlockhash(
    commitment?: CommitmentLevel
  ): Promise<GetLatestBlockhashResponse> {
    return await new Promise<GetLatestBlockhashResponse>((resolve, reject) => {
      this._client.getLatestBlockhash(
        { commitment },
        this._getInsecureMetadata(),
        (err, response) => {
          if (err === null || err === undefined) {
            resolve(response);
          } else {
            reject(err);
          }
        }
      );
    });
  }

  async getBlockHeight(commitment?: CommitmentLevel): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      this._client.getBlockHeight(
        { commitment },
        this._getInsecureMetadata(),
        (err, response) => {
          if (err === null || err === undefined) {
            resolve(response.blockHeight);
          } else {
            reject(err);
          }
        }
      );
    });
  }

  async getSlot(commitment?: CommitmentLevel): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      this._client.getSlot(
        { commitment },
        this._getInsecureMetadata(),
        (err, response) => {
          if (err === null || err === undefined) {
            resolve(response.slot);
          } else {
            reject(err);
          }
        }
      );
    });
  }

  async isBlockhashValid(
    blockhash: string,
    commitment?: CommitmentLevel
  ): Promise<IsBlockhashValidResponse> {
    return await new Promise<IsBlockhashValidResponse>((resolve, reject) => {
      this._client.isBlockhashValid(
        { blockhash, commitment },
        this._getInsecureMetadata(),
        (err, response) => {
          if (err === null || err === undefined) {
            resolve(response);
          } else {
            reject(err);
          }
        }
      );
    });
  }

  async getVersion(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      this._client.getVersion(
        {},
        this._getInsecureMetadata(),
        (err, response) => {
          if (err === null || err === undefined) {
            resolve(response.version);
          } else {
            reject(err);
          }
        }
      );
    });
  }
}
