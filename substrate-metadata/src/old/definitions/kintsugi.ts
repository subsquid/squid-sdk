import { OldTypesBundle } from "../types";
import { ormlAlias, ormlTypes } from "./orml";

export const bundle: OldTypesBundle = {
  types: {
    ...ormlTypes,
    H256Le: "H256",
    Value: "i64",
    Collateral: "Balance",
    Wrapped: "Balance",
    UnsignedInner: "u128",
    StatusCode: {
      _enum: ["Running", "Error", "Shutdown"],
    },
    Address: "AccountId",
    LookupSource: "AccountId",
    Status: "StatusCode",
    ErrorCode: {
      _enum: ["None", "OracleOffline"],
    },
    VaultStatus: {
      _enum: {
        Active: "bool",
        Liquidated: "()",
        CommittedTheft: "()",
      },
    },
    RawBlockHeader: {
      "0": "[u8; 80]",
    },
    LockIdentifier: "[u8; 8]",
    RichBlockHeader: {
      block_header: "BlockHeader",
      block_height: "u32",
      chain_id: "u32",
      para_height: "BlockNumber",
    },
    AccountData: {
      free: "Balance",
      reserved: "Balance",
      misc_frozen: "Balance",
      fee_frozen: "Balance",
    },
    BlockHeader: {
      merkle_root: "H256Le",
      target: "U256",
      timestamp: "u32",
      version: "i32",
      hash: "H256Le",
      hash_prev_block: "H256Le",
      nonce: "u32",
    },
    BlockChain: {
      chain_id: "u32",
      start_height: "u32",
      max_height: "u32",
    },
    BtcAddress: {
      _enum: {
        P2PKH: "H160",
        P2SH: "H160",
        P2WPKHv0: "H160",
        P2WSHv0: "H256",
      },
    },
    BtcPublicKey: "[u8; 33]",
    Wallet: {
      addresses: "BTreeSet<BtcAddress>",
      public_key: "BtcPublicKey",
    },
    VaultCurrencyPair: {
      collateral: "CurrencyId",
      wrapped: "CurrencyId",
    },
    VaultId: {
      account_id: "AccountId",
      currencies: "VaultCurrencyPair",
    },
    Vault: {
      id: "VaultId",
      wallet: "Wallet",
      status: "VaultStatus",
      banned_until: "Option<BlockNumber>",
      to_be_issued_tokens: "Balance",
      issued_tokens: "Balance",
      to_be_redeemed_tokens: "Balance",
      to_be_replaced_tokens: "Balance",
      replace_collateral: "Balance",
      active_replace_collateral: "Balance",
      liquidated_collateral: "Balance",
    },
    DefaultVault: "Vault",
    IssueRequestStatus: {
      _enum: {
        Pending: "()",
        Completed: "Option<H256>",
        Cancelled: "()",
      },
    },
    IssueRequest: {
      vault: "VaultId",
      opentime: "BlockNumber",
      period: "BlockNumber",
      griefing_collateral: "Balance",
      amount: "Balance",
      fee: "Balance",
      requester: "AccountId",
      btc_address: "BtcAddress",
      btc_public_key: "BtcPublicKey",
      btc_height: "u32",
      status: "IssueRequestStatus",
    },
    RedeemRequestStatus: {
      _enum: {
        Pending: "()",
        Completed: "()",
        Reimbursed: "bool",
        Retried: "()",
      },
    },
    CurrencyId: {
      _enum: ["DOT", "INTERBTC", "INTR", "KSM", "KBTC", "KINT"],
    },
    OracleKey: {
      _enum: {
        ExchangeRate: "CurrencyId",
        FeeEstimation: "()",
      },
    },
    RedeemRequest: {
      vault: "VaultId",
      opentime: "BlockNumber",
      period: "BlockNumber",
      fee: "Balance",
      transfer_fee_btc: "Balance",
      amount_btc: "Balance",
      premium: "Balance",
      redeemer: "AccountId",
      btc_address: "BtcAddress",
      btc_height: "u32",
      status: "RedeemRequestStatus",
    },
    ReplaceRequestStatus: {
      _enum: ["Pending", "Completed", "Cancelled"],
    },
    ReplaceRequest: {
      old_vault: "VaultId",
      new_vault: "VaultId",
      amount: "Balance",
      griefing_collateral: "Balance",
      collateral: "Balance",
      accept_time: "BlockNumber",
      period: "BlockNumber",
      btc_address: "BtcAddress",
      btc_height: "u32",
      status: "ReplaceRequestStatus",
    },
    RefundRequest: {
      vault: "VaultId",
      amount_btc: "Balance",
      fee: "Balance",
      issuer: "AccountId",
      btc_address: "BtcAddress",
      issue_id: "H256",
      completed: "bool",
    },
    BalanceWrapper: {
      amount: "String",
    },
    TimestampedValue: {
      value: "Value",
      timestamp: "Moment",
    },
    Version: "u32",
    SystemVault: {
      to_be_issued_tokens: "Balance",
      issued_tokens: "Balance",
      to_be_redeemed_tokens: "Balance",
      collateral: "Balance",
      currency_pair: "VaultCurrencyPair",
    },
    DefaultSystemVault: "SystemVault",
    FixedPoint: "FixedI128",
    SignedFixedPoint: "FixedI128",
    UnsignedFixedPoint: "FixedU128",
    FundAccountJsonRpcRequest: {
      account_id: "AccountId",
    },
  },
  typesAlias: {
    ...ormlAlias,
  },
};
