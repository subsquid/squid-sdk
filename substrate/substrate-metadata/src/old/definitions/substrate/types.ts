export const types = {
  "GenericAccountId": "[u8; 32]",
  "GenericAccountIndex": "u32",
  "GenericLookupSource": "DoNotConstruct",
  "GenericConsensusEngineId": "[u8; 4]",
  "GenericMultiAddress": {
    "_enum": {
      "Id": "AccountId",
      "Index": "Compact<AccountIndex>",
      "Raw": "Bytes",
      "Address32": "H256",
      "Address20": "H160"
    }
  },
  "GenericVote": "u8",
  "StorageKey": "Bytes",
  "Data": {
    "_enum": {
      "None": "Null",
      "Raw0": "[u8; 0]",
      "Raw1": "[u8; 1]",
      "Raw2": "[u8; 2]",
      "Raw3": "[u8; 3]",
      "Raw4": "[u8; 4]",
      "Raw5": "[u8; 5]",
      "Raw6": "[u8; 6]",
      "Raw7": "[u8; 7]",
      "Raw8": "[u8; 8]",
      "Raw9": "[u8; 9]",
      "Raw10": "[u8; 10]",
      "Raw11": "[u8; 11]",
      "Raw12": "[u8; 12]",
      "Raw13": "[u8; 13]",
      "Raw14": "[u8; 14]",
      "Raw15": "[u8; 15]",
      "Raw16": "[u8; 16]",
      "Raw17": "[u8; 17]",
      "Raw18": "[u8; 18]",
      "Raw19": "[u8; 19]",
      "Raw20": "[u8; 20]",
      "Raw21": "[u8; 21]",
      "Raw22": "[u8; 22]",
      "Raw23": "[u8; 23]",
      "Raw24": "[u8; 24]",
      "Raw25": "[u8; 25]",
      "Raw26": "[u8; 26]",
      "Raw27": "[u8; 27]",
      "Raw28": "[u8; 28]",
      "Raw29": "[u8; 29]",
      "Raw30": "[u8; 30]",
      "Raw31": "[u8; 31]",
      "Raw32": "[u8; 32]",
      "BlakeTwo256": "H256",
      "Sha256": "H256",
      "Keccak256": "H256",
      "ShaThree256": "H256"
    }
  },
  "AssetApprovalKey": {
    "owner": "AccountId",
    "delegate": "AccountId"
  },
  "AssetApproval": {
    "amount": "TAssetBalance",
    "deposit": "TAssetDepositBalance"
  },
  "AssetBalance": {
    "balance": "TAssetBalance",
    "isFrozen": "bool",
    "isSufficient": "bool"
  },
  "AssetDestroyWitness": {
    "accounts": "Compact<u32>",
    "sufficients": "Compact<u32>",
    "approvals": "Compact<u32>"
  },
  "AssetDetails": {
    "owner": "AccountId",
    "issuer": "AccountId",
    "admin": "AccountId",
    "freezer": "AccountId",
    "supply": "TAssetBalance",
    "deposit": "TAssetDepositBalance",
    "minBalance": "TAssetBalance",
    "isSufficient": "bool",
    "accounts": "u32",
    "sufficients": "u32",
    "approvals": "u32",
    "isFrozen": "bool"
  },
  "AssetMetadata": {
    "deposit": "TAssetDepositBalance",
    "name": "Vec<u8>",
    "symbol": "Vec<u8>",
    "decimals": "u8",
    "isFrozen": "bool"
  },
  "TAssetBalance": "u64",
  "TAssetDepositBalance": "BalanceOf",
  "BlockAttestations": {
    "receipt": "CandidateReceipt",
    "valid": "Vec<AccountId>",
    "invalid": "Vec<AccountId>"
  },
  "IncludedBlocks": {
    "actualNumber": "BlockNumber",
    "session": "SessionIndex",
    "randomSeed": "H256",
    "activeParachains": "Vec<ParaId>",
    "paraBlocks": "Vec<Hash>"
  },
  "MoreAttestations": {},
  "RawAuraPreDigest": {
    "slotNumber": "u64"
  },
  "ExtrinsicOrHash": {
    "_enum": {
      "Hash": "Hash",
      "Extrinsic": "Bytes"
    }
  },
  "ExtrinsicStatus": {
    "_enum": {
      "Future": "Null",
      "Ready": "Null",
      "Broadcast": "Vec<Text>",
      "InBlock": "Hash",
      "Retracted": "Hash",
      "FinalityTimeout": "Hash",
      "Finalized": "Hash",
      "Usurped": "Hash",
      "Dropped": "Null",
      "Invalid": "Null"
    }
  },
  "UncleEntryItem": {
    "_enum": {
      "InclusionHeight": "BlockNumber",
      "Uncle": "(Hash, Option<AccountId>)"
    }
  },
  "AllowedSlots": {
    "_enum": [
      "PrimarySlots",
      "PrimaryAndSecondaryPlainSlots",
      "PrimaryAndSecondaryVRFSlots"
    ]
  },
  "BabeAuthorityWeight": "u64",
  "BabeEpochConfiguration": {
    "c": "(u64, u64)",
    "allowedSlots": "AllowedSlots"
  },
  "BabeBlockWeight": "u32",
  "BabeEquivocationProof": {
    "offender": "AuthorityId",
    "slotNumber": "SlotNumber",
    "firstHeader": "Header",
    "secondHeader": "Header"
  },
  "BabeWeight": "u64",
  "MaybeRandomness": "Option<Randomness>",
  "MaybeVrf": "Option<VrfData>",
  "EpochAuthorship": {
    "primary": "Vec<u64>",
    "secondary": "Vec<u64>",
    "secondary_vrf": "Vec<u64>"
  },
  "NextConfigDescriptor": {
    "_enum": {
      "V0": "Null",
      "V1": "NextConfigDescriptorV1"
    }
  },
  "NextConfigDescriptorV1": {
    "c": "(u64, u64)",
    "allowedSlots": "AllowedSlots"
  },
  "Randomness": "Hash",
  "RawBabePreDigest": {
    "_enum": {
      "Phantom": "Null",
      "Primary": "RawBabePreDigestPrimary",
      "SecondaryPlain": "RawBabePreDigestSecondaryPlain",
      "SecondaryVRF": "RawBabePreDigestSecondaryVRF"
    }
  },
  "RawBabePreDigestPrimary": {
    "authorityIndex": "u32",
    "slotNumber": "SlotNumber",
    "vrfOutput": "VrfOutput",
    "vrfProof": "VrfProof"
  },
  "RawBabePreDigestSecondaryPlain": {
    "authorityIndex": "u32",
    "slotNumber": "SlotNumber"
  },
  "RawBabePreDigestSecondaryVRF": {
    "authorityIndex": "u32",
    "slotNumber": "SlotNumber",
    "vrfOutput": "VrfOutput",
    "vrfProof": "VrfProof"
  },
  "RawBabePreDigestTo159": {
    "_enum": {
      "Primary": "RawBabePreDigestPrimaryTo159",
      "Secondary": "RawBabePreDigestSecondaryTo159"
    }
  },
  "RawBabePreDigestPrimaryTo159": {
    "authorityIndex": "u32",
    "slotNumber": "SlotNumber",
    "weight": "BabeBlockWeight",
    "vrfOutput": "VrfOutput",
    "vrfProof": "VrfProof"
  },
  "RawBabePreDigestSecondaryTo159": {
    "authorityIndex": "u32",
    "slotNumber": "SlotNumber",
    "weight": "BabeBlockWeight"
  },
  "RawBabePreDigestCompat": {
    "_enum": {
      "Zero": "u32",
      "One": "u32",
      "Two": "u32",
      "Three": "u32"
    }
  },
  "SlotNumber": "u64",
  "VrfData": "[u8; 32]",
  "VrfOutput": "[u8; 32]",
  "VrfProof": "[u8; 64]",
  "AccountData": {
    "free": "Balance",
    "reserved": "Balance",
    "miscFrozen": "Balance",
    "feeFrozen": "Balance"
  },
  "BalanceLockTo212": {
    "id": "LockIdentifier",
    "amount": "Balance",
    "until": "BlockNumber",
    "reasons": "WithdrawReasons"
  },
  "BalanceLock": {
    "id": "LockIdentifier",
    "amount": "Balance",
    "reasons": "Reasons"
  },
  "BalanceStatus": {
    "_enum": [
      "Free",
      "Reserved"
    ]
  },
  "Reasons": {
    "_enum": [
      "Fee",
      "Misc",
      "All"
    ]
  },
  "ReserveData": {
    "id": "ReserveIdentifier",
    "amount": "Balance"
  },
  "ReserveIdentifier": "[u8; 8]",
  "VestingSchedule": {
    "offset": "Balance",
    "perBlock": "Balance",
    "startingBlock": "BlockNumber"
  },
  "WithdrawReasons": {
    "_set": {
      "TransactionPayment": 1,
      "Transfer": 2,
      "Reserve": 4,
      "Fee": 8,
      "Tip": 16
    }
  },
  "BeefyCommitment": {
    "payload": "BeefyPayload",
    "blockNumber": "BlockNumber",
    "validatorSetId": "ValidatorSetId"
  },
  "BeefyId": "[u8; 33]",
  "BeefySignedCommitment": {
    "commitment": "BeefyCommitment",
    "signatures": "Vec<Option<Signature>>"
  },
  "BeefyNextAuthoritySet": {
    "id": "u64",
    "len": "u32",
    "root": "H256"
  },
  "BeefyPayload": "MmrRootHash",
  "MmrRootHash": "H256",
  "ValidatorSetId": "u64",
  "BridgedBlockHash": "H256",
  "BridgedBlockNumber": "BlockNumber",
  "BridgedHeader": "Header",
  "BridgeMessageId": "(LaneId, MessageNonce)",
  "CallOrigin": {
    "_enum": {
      "SourceRoot": "Null",
      "TargetAccount": "(AccountId, MultiSigner, MultiSignature)",
      "SourceAccount": "AccountId"
    }
  },
  "ChainId": "[u8; 4]",
  "DeliveredMessages": {
    "begin": "MessageNonce",
    "end": "MessageNonce",
    "dispatchResults": "BitVec"
  },
  "DispatchFeePayment": {
    "_enum": [
      "AtSourceChain",
      "AtTargetChain"
    ]
  },
  "InboundLaneData": {
    "relayers": "Vec<UnrewardedRelayer>",
    "lastConfirmedNonce": "MessageNonce"
  },
  "InboundRelayer": "AccountId",
  "InitializationData": {
    "header": "Header",
    "authorityList": "AuthorityList",
    "setId": "SetId",
    "isHalted": "bool"
  },
  "LaneId": "[u8; 4]",
  "MessageData": {
    "payload": "Bytes",
    "fee": "Balance"
  },
  "MessagesDeliveryProofOf": {
    "bridgedHeaderHash": "BlockHash",
    "storageProof": "Vec<Bytes>",
    "lane": "LaneId"
  },
  "MessageKey": {
    "laneId": "LaneId",
    "nonce": "MessageNonce"
  },
  "MessageNonce": "u64",
  "MessagesProofOf": {
    "bridgedHeaderHash": "BridgedBlockHash",
    "storageProof": "Vec<Bytes>",
    "lane": "LaneId",
    "noncesStart": "MessageNonce",
    "noncesEnd": "MessageNonce"
  },
  "OperatingMode": {
    "_enum": [
      "Normal",
      "RejectingOutboundMessages",
      "Halted"
    ]
  },
  "OutboundLaneData": {
    "oldestUnprunedNonce": "MessageNonce",
    "latestReceivedNonce": "MessageNonce",
    "latestGeneratedNonce": "MessageNonce"
  },
  "OutboundMessageFee": "Balance",
  "OutboundPayload": {
    "specVersion": "u32",
    "weight": "Weight",
    "origin": "CallOrigin",
    "dispatchFeePayment": "DispatchFeePayment",
    "call": "Bytes"
  },
  "Parameter": "Null",
  "RelayerId": "AccountId",
  "UnrewardedRelayer": {
    "relayer": "RelayerId",
    "messages": "DeliveredMessages"
  },
  "UnrewardedRelayersState": {
    "unrewardedRelayer_Entries": "MessageNonce",
    "messagesInOldestEntry": "MessageNonce",
    "totalMessages": "MessageNonce"
  },
  "BlockHash": "Hash",
  "PrefixedStorageKey": "StorageKey",
  "EthereumAddress": "H160",
  "StatementKind": {
    "_enum": [
      "Regular",
      "Saft"
    ]
  },
  "CollectiveOrigin": {
    "_enum": {
      "Members": "(MemberCount, MemberCount)",
      "Member": "AccountId"
    }
  },
  "MemberCount": "u32",
  "ProposalIndex": "u32",
  "VotesTo230": {
    "index": "ProposalIndex",
    "threshold": "MemberCount",
    "ayes": "Vec<AccountId>",
    "nays": "Vec<AccountId>"
  },
  "Votes": {
    "index": "ProposalIndex",
    "threshold": "MemberCount",
    "ayes": "Vec<AccountId>",
    "nays": "Vec<AccountId>",
    "end": "BlockNumber"
  },
  "AuthorityId": "AccountId",
  "RawVRFOutput": "[u8; 32]",
  "AliveContractInfo": {
    "trieId": "TrieId",
    "storageSize": "u32",
    "pairCount": "u32",
    "codeHash": "CodeHash",
    "rentAllowance": "Balance",
    "rentPaid": "Balance",
    "deductBlock": "BlockNumber",
    "lastWrite": "Option<BlockNumber>",
    "_reserved": "Option<Null>"
  },
  "CodeHash": "Hash",
  "ContractCallRequest": {
    "origin": "AccountId",
    "dest": "AccountId",
    "value": "Balance",
    "gasLimit": "u64",
    "inputData": "Bytes"
  },
  "ContractExecResultSuccessTo255": {
    "status": "u8",
    "data": "Raw"
  },
  "ContractExecResultTo255": {
    "_enum": {
      "Success": "ContractExecResultSuccessTo255",
      "Error": "Null"
    }
  },
  "ContractExecResultSuccessTo260": {
    "flags": "u32",
    "data": "Bytes",
    "gasConsumed": "u64"
  },
  "ContractExecResultTo260": {
    "_enum": {
      "Success": "ContractExecResultSuccessTo260",
      "Error": "Null"
    }
  },
  "ContractExecResultErrModule": {
    "index": "u8",
    "error": "u8",
    "message": "Option<Text>"
  },
  "ContractExecResultErr": {
    "_enum": {
      "Other": "Text",
      "CannotLookup": "Null",
      "BadOrigin": "Null",
      "Module": "ContractExecResultErrModule"
    }
  },
  "ContractExecResultOk": {
    "flags": "u32",
    "data": "Bytes"
  },
  "ContractExecResultResult": {
    "_enum": {
      "Ok": "ContractExecResultOk",
      "Err": "ContractExecResultErr"
    }
  },
  "ContractExecResultTo267": {
    "gasConsumed": "u64",
    "debugMessage": "Text",
    "result": "ContractExecResultResult"
  },
  "ContractExecResult": {
    "gasConsumed": "u64",
    "gasRequired": "u64",
    "debugMessage": "Text",
    "result": "ContractExecResultResult"
  },
  "ContractInfo": {
    "_enum": {
      "Alive": "AliveContractInfo",
      "Tombstone": "TombstoneContractInfo"
    }
  },
  "ContractStorageKey": "[u8; 32]",
  "DeletedContract": {
    "pairCount": "u32",
    "trieId": "TrieId"
  },
  "ExecReturnValue": {
    "flags": "u32",
    "data": "Bytes"
  },
  "Gas": "u64",
  "HostFnWeightsTo264": {
    "caller": "Weight",
    "address": "Weight",
    "gasLeft": "Weight",
    "balance": "Weight",
    "valueTransferred": "Weight",
    "minimumBalance": "Weight",
    "tombstoneDeposit": "Weight",
    "rentAllowance": "Weight",
    "blockNumber": "Weight",
    "now": "Weight",
    "weightToFee": "Weight",
    "gas": "Weight",
    "input": "Weight",
    "inputPerByte": "Weight",
    "return": "Weight",
    "returnPerByte": "Weight",
    "terminate": "Weight",
    "restoreTo": "Weight",
    "restoreToPerDelta": "Weight",
    "random": "Weight",
    "depositEvent": "Weight",
    "depositEventPerTopic": "Weight",
    "depositEventPerByte": "Weight",
    "setRentAllowance": "Weight",
    "setStorage": "Weight",
    "setStoragePerByte": "Weight",
    "clearStorage": "Weight",
    "getStorage": "Weight",
    "getStoragePerByte": "Weight",
    "transfer": "Weight",
    "call": "Weight",
    "callTransferSurcharge": "Weight",
    "callPerInputByte": "Weight",
    "callPerOutputByte": "Weight",
    "instantiate": "Weight",
    "instantiatePerInputByte": "Weight",
    "instantiatePerOutputByte": "Weight",
    "hashSha2256": "Weight",
    "hashSha2256PerByte": "Weight",
    "hashKeccak256": "Weight",
    "hashKeccak256PerByte": "Weight",
    "hashBlake2256": "Weight",
    "hashBlake2256PerByte": "Weight",
    "hashBlake2128": "Weight",
    "hashBlake2128PerByte": "Weight"
  },
  "HostFnWeights": {
    "caller": "Weight",
    "address": "Weight",
    "gasLeft": "Weight",
    "balance": "Weight",
    "valueTransferred": "Weight",
    "minimumBalance": "Weight",
    "tombstoneDeposit": "Weight",
    "rentAllowance": "Weight",
    "blockNumber": "Weight",
    "now": "Weight",
    "weightToFee": "Weight",
    "gas": "Weight",
    "input": "Weight",
    "inputPerByte": "Weight",
    "return": "Weight",
    "returnPerByte": "Weight",
    "terminate": "Weight",
    "terminatePerCodeByte": "Weight",
    "restoreTo": "Weight",
    "restoreToPerCallerCodeByte": "Weight",
    "restoreToPerTombstoneCodeByte": "Weight",
    "restoreToPerDelta": "Weight",
    "random": "Weight",
    "depositEvent": "Weight",
    "depositEventPerTopic": "Weight",
    "depositEventPerByte": "Weight",
    "setRentAllowance": "Weight",
    "setStorage": "Weight",
    "setStoragePerByte": "Weight",
    "clearStorage": "Weight",
    "getStorage": "Weight",
    "getStoragePerByte": "Weight",
    "transfer": "Weight",
    "call": "Weight",
    "callPerCodeByte": "Weight",
    "callTransferSurcharge": "Weight",
    "callPerInputByte": "Weight",
    "callPerOutputByte": "Weight",
    "instantiate": "Weight",
    "instantiatePerCodeByte": "Weight",
    "instantiatePerInputByte": "Weight",
    "instantiatePerOutputByte": "Weight",
    "instantiatePerSaltByte": "Weight",
    "hashSha2256": "Weight",
    "hashSha2256PerByte": "Weight",
    "hashKeccak256": "Weight",
    "hashKeccak256PerByte": "Weight",
    "hashBlake2256": "Weight",
    "hashBlake2256PerByte": "Weight",
    "hashBlake2128": "Weight",
    "hashBlake2128PerByte": "Weight",
    "rentParams": "Weight"
  },
  "InstantiateRequest": {
    "origin": "AccountId",
    "endowment": "Balance",
    "gasLimit": "Gas",
    "code": "Bytes",
    "data": "Bytes",
    "salt": "Bytes"
  },
  "ContractInstantiateResultTo267": {
    "_enum": {
      "Ok": "InstantiateReturnValueTo267",
      "Err": "Null"
    }
  },
  "ContractInstantiateResult": {
    "_enum": {
      "Ok": "InstantiateReturnValue",
      "Err": "Null"
    }
  },
  "InstantiateReturnValueTo267": {
    "result": "ExecReturnValue",
    "accountId": "AccountId",
    "rentProjection": "Option<RentProjection>"
  },
  "InstantiateReturnValue": {
    "result": "ExecReturnValue",
    "accountId": "AccountId"
  },
  "InstructionWeights": {
    "i64const": "u32",
    "i64load": "u32",
    "i64store": "u32",
    "select": "u32",
    "rIf": "u32",
    "br": "u32",
    "brIf": "u32",
    "brIable": "u32",
    "brIablePerEntry": "u32",
    "call": "u32",
    "callIndirect": "u32",
    "callIndirectPerParam": "u32",
    "localGet": "u32",
    "localSet": "u32",
    "local_tee": "u32",
    "globalGet": "u32",
    "globalSet": "u32",
    "memoryCurrent": "u32",
    "memoryGrow": "u32",
    "i64clz": "u32",
    "i64ctz": "u32",
    "i64popcnt": "u32",
    "i64eqz": "u32",
    "i64extendsi32": "u32",
    "i64extendui32": "u32",
    "i32wrapi64": "u32",
    "i64eq": "u32",
    "i64ne": "u32",
    "i64lts": "u32",
    "i64ltu": "u32",
    "i64gts": "u32",
    "i64gtu": "u32",
    "i64les": "u32",
    "i64leu": "u32",
    "i64ges": "u32",
    "i64geu": "u32",
    "i64add": "u32",
    "i64sub": "u32",
    "i64mul": "u32",
    "i64divs": "u32",
    "i64divu": "u32",
    "i64rems": "u32",
    "i64remu": "u32",
    "i64and": "u32",
    "i64or": "u32",
    "i64xor": "u32",
    "i64shl": "u32",
    "i64shrs": "u32",
    "i64shru": "u32",
    "i64rotl": "u32",
    "i64rotr": "u32"
  },
  "LimitsTo264": {
    "eventTopics": "u32",
    "stackHeight": "u32",
    "globals": "u32",
    "parameters": "u32",
    "memoryPages": "u32",
    "tableSize": "u32",
    "brTableSize": "u32",
    "subjectLen": "u32",
    "codeSize": "u32"
  },
  "Limits": {
    "eventTopics": "u32",
    "stackHeight": "u32",
    "globals": "u32",
    "parameters": "u32",
    "memoryPages": "u32",
    "tableSize": "u32",
    "brTableSize": "u32",
    "subjectLen": "u32"
  },
  "PrefabWasmModule": {
    "scheduleVersion": "Compact<u32>",
    "initial": "Compact<u32>",
    "maximum": "Compact<u32>",
    "refcount": "Compact<u64>",
    "_reserved": "Option<Null>",
    "code": "Bytes",
    "originalCodeLen": "u32"
  },
  "RentProjection": {
    "_enum": {
      "EvictionAt": "BlockNumber",
      "NoEviction": "Null"
    }
  },
  "ScheduleTo212": {
    "version": "u32",
    "putCodePerByteCost": "Gas",
    "growMemCost": "Gas",
    "regularOpCost": "Gas",
    "returnDataPerByteCost": "Gas",
    "eventDataPerByteCost": "Gas",
    "eventPerTopicCost": "Gas",
    "eventBaseCost": "Gas",
    "sandboxDataReadCost": "Gas",
    "sandboxDataWriteCost": "Gas",
    "maxEventTopics": "u32",
    "maxStackHeight": "u32",
    "maxMemoryPages": "u32",
    "enablePrintln": "bool",
    "maxSubjectLen": "u32"
  },
  "ScheduleTo258": {
    "version": "u32",
    "putCodePerByteCost": "Gas",
    "growMemCost": "Gas",
    "regularOpCost": "Gas",
    "returnDataPerByteCost": "Gas",
    "eventDataPerByteCost": "Gas",
    "eventPerTopicCost": "Gas",
    "eventBaseCost": "Gas",
    "sandboxDataReadCost": "Gas",
    "sandboxDataWriteCost": "Gas",
    "transferCost": "Gas",
    "maxEventTopics": "u32",
    "maxStackHeight": "u32",
    "maxMemoryPages": "u32",
    "enablePrintln": "bool",
    "maxSubjectLen": "u32"
  },
  "ScheduleTo264": {
    "version": "u32",
    "enablePrintln": "bool",
    "limits": "LimitsTo264",
    "instructionWeights": "InstructionWeights",
    "hostFnWeights": "HostFnWeightsTo264"
  },
  "Schedule": {
    "version": "u32",
    "enablePrintln": "bool",
    "limits": "Limits",
    "instructionWeights": "InstructionWeights",
    "hostFnWeights": "HostFnWeights"
  },
  "SeedOf": "Hash",
  "TombstoneContractInfo": "Hash",
  "TrieId": "Bytes",
  "ContractCryptoHasher": {
    "_enum": [
      "Blake2x256",
      "Sha2x256",
      "Keccak256"
    ]
  },
  "ContractDiscriminant": "u32",
  "ContractLayoutArray": {
    "offset": "ContractLayoutKey",
    "len": "u32",
    "cellsPerElem": "u64",
    "layout": "ContractStorageLayout"
  },
  "ContractLayoutCell": {
    "key": "ContractLayoutKey",
    "ty": "SiLookupTypeId"
  },
  "ContractLayoutEnum": {
    "dispatchKey": "ContractLayoutKey",
    "variants": "BTreeMap<ContractDiscriminant, ContractLayoutStruct>"
  },
  "ContractLayoutHash": {
    "offset": "ContractLayoutKey",
    "strategy": "ContractLayoutHashingStrategy",
    "layout": "ContractStorageLayout"
  },
  "ContractLayoutHashingStrategy": {
    "hasher": "ContractCryptoHasher",
    "postfix": "Vec<u8>",
    "prefix": "Vec<u8>"
  },
  "ContractLayoutKey": "[u8; 32]",
  "ContractLayoutStruct": {
    "fields": "Vec<ContractLayoutStructField>"
  },
  "ContractLayoutStructField": {
    "layout": "ContractStorageLayout",
    "name": "Text"
  },
  "ContractStorageLayout": {
    "_enum": {
      "Cell": "ContractLayoutCell",
      "Hash": "ContractLayoutHash",
      "Array": "ContractLayoutArray",
      "Struct": "ContractLayoutStruct",
      "Enum": "ContractLayoutEnum"
    }
  },
  "ContractConstructorSpec": {
    "name": "Text",
    "selector": "ContractSelector",
    "args": "Vec<ContractMessageParamSpec>",
    "docs": "Vec<Text>"
  },
  "ContractContractSpec": {
    "constructors": "Vec<ContractConstructorSpec>",
    "messages": "Vec<ContractMessageSpec>",
    "events": "Vec<ContractEventSpec>",
    "docs": "Vec<Text>"
  },
  "ContractDisplayName": "SiPath",
  "ContractEventParamSpec": {
    "name": "Text",
    "indexed": "bool",
    "type": "ContractTypeSpec",
    "docs": "Vec<Text>"
  },
  "ContractEventSpec": {
    "name": "Text",
    "args": "Vec<ContractEventParamSpec>",
    "docs": "Vec<Text>"
  },
  "ContractMessageParamSpec": {
    "name": "Text",
    "type": "ContractTypeSpec"
  },
  "ContractMessageSpec": {
    "name": "Text",
    "selector": "ContractSelector",
    "mutates": "bool",
    "payable": "bool",
    "args": "Vec<ContractMessageParamSpec>",
    "returnType": "Option<ContractTypeSpec>",
    "docs": "Vec<Text>"
  },
  "ContractSelector": "[u8; 4]",
  "ContractTypeSpec": {
    "type": "SiLookupTypeId",
    "displayName": "ContractDisplayName"
  },
  "ContractProjectInfo": {
    "source": "ContractProjectSource",
    "contract": "ContractProjectContract"
  },
  "ContractMetadataV0": {
    "types": "Vec<Si0Type>",
    "spec": "ContractContractSpec"
  },
  "ContractMetadataV1": {
    "types": "Vec<PortableType>",
    "spec": "ContractContractSpec"
  },
  "ContractMetadata": {
    "_enum": {
      "V0": "ContractMetadataV0",
      "V1": "ContractMetadataV1"
    }
  },
  "ContractMetadataLatest": "ContractMetadataV1",
  "ContractProjectV0": {
    "metadataVersion": "Text",
    "source": "ContractProjectSource",
    "contract": "ContractProjectContract",
    "types": "Vec<Si0Type>",
    "spec": "ContractContractSpec"
  },
  "ContractProject": "(ContractProjectInfo, ContractMetadata)",
  "ContractProjectContract": {
    "name": "Text",
    "version": "Text",
    "authors": "Vec<Text>",
    "description": "Option<Text>",
    "docs": "Option<Text>",
    "repository": "Option<Text>",
    "homepage": "Option<Text>",
    "license": "Option<Text>"
  },
  "ContractProjectSource": {
    "wasmHash": "[u8; 32]",
    "language": "Text",
    "compiler": "Text",
    "wasm": "Raw"
  },
  "FundIndex": "u32",
  "LastContribution": {
    "_enum": {
      "Never": "Null",
      "PreEnding": "u32",
      "Ending": "BlockNumber"
    }
  },
  "FundInfo": {
    "depositor": "AccountId",
    "verifier": "Option<MultiSigner>",
    "deposit": "Balance",
    "raised": "Balance",
    "end": "BlockNumber",
    "cap": "Balance",
    "lastContribution": "LastContribution",
    "firstPeriod": "LeasePeriod",
    "lastPeriod": "LeasePeriod",
    "trieIndex": "TrieIndex"
  },
  "TrieIndex": "u32",
  "ConfigData": {
    "maxIndividual": "Weight"
  },
  "MessageId": "[u8; 32]",
  "OverweightIndex": "u64",
  "PageCounter": "u32",
  "PageIndexData": {
    "beginUsed": "PageCounter",
    "endUsed": "PageCounter",
    "overweightCount": "OverweightIndex"
  },
  "AccountVote": {
    "_enum": {
      "Standard": "AccountVoteStandard",
      "Split": "AccountVoteSplit"
    }
  },
  "AccountVoteSplit": {
    "aye": "Balance",
    "nay": "Balance"
  },
  "AccountVoteStandard": {
    "vote": "Vote",
    "balance": "Balance"
  },
  "Conviction": {
    "_enum": [
      "None",
      "Locked1x",
      "Locked2x",
      "Locked3x",
      "Locked4x",
      "Locked5x",
      "Locked6x"
    ]
  },
  "Delegations": {
    "votes": "Balance",
    "capital": "Balance"
  },
  "PreimageStatus": {
    "_enum": {
      "Missing": "BlockNumber",
      "Available": "PreimageStatusAvailable"
    }
  },
  "PreimageStatusAvailable": {
    "data": "Bytes",
    "provider": "AccountId",
    "deposit": "Balance",
    "since": "BlockNumber",
    "expiry": "Option<BlockNumber>"
  },
  "PriorLock": "(BlockNumber, Balance)",
  "PropIndex": "u32",
  "Proposal": "Call",
  "ProxyState": {
    "_enum": {
      "Open": "AccountId",
      "Active": "AccountId"
    }
  },
  "ReferendumIndex": "u32",
  "ReferendumInfoTo239": {
    "end": "BlockNumber",
    "proposalHash": "Hash",
    "threshold": "VoteThreshold",
    "delay": "BlockNumber"
  },
  "ReferendumInfo": {
    "_enum": {
      "Ongoing": "ReferendumStatus",
      "Finished": "ReferendumInfoFinished"
    }
  },
  "ReferendumInfoFinished": {
    "approved": "bool",
    "end": "BlockNumber"
  },
  "ReferendumStatus": {
    "end": "BlockNumber",
    "proposalHash": "Hash",
    "threshold": "VoteThreshold",
    "delay": "BlockNumber",
    "tally": "Tally"
  },
  "Tally": {
    "ayes": "Balance",
    "nays": "Balance",
    "turnout": "Balance"
  },
  "Voting": {
    "_enum": {
      "Direct": "VotingDirect",
      "Delegating": "VotingDelegating"
    }
  },
  "VotingDirect": {
    "votes": "Vec<VotingDirectVote>",
    "delegations": "Delegations",
    "prior": "PriorLock"
  },
  "VotingDirectVote": "(ReferendumIndex, AccountVote)",
  "VotingDelegating": {
    "balance": "Balance",
    "target": "AccountId",
    "conviction": "Conviction",
    "delegations": "Delegations",
    "prior": "PriorLock"
  },
  "ApprovalFlag": "u32",
  "DefunctVoter": {
    "who": "AccountId",
    "voteCount": "Compact<u32>",
    "candidateCount": "Compact<u32>"
  },
  "Renouncing": {
    "_enum": {
      "Member": "Null",
      "RunnerUp": "Null",
      "Candidate": "Compact<u32>"
    }
  },
  "SetIndex": "u32",
  "Vote": "GenericVote",
  "VoteIndex": "u32",
  "VoterInfo": {
    "lastActive": "VoteIndex",
    "lastWin": "VoteIndex",
    "pot": "Balance",
    "stake": "Balance"
  },
  "VoteThreshold": {
    "_enum": [
      "SuperMajorityApprove",
      "SuperMajorityAgainst",
      "SimpleMajority"
    ]
  },
  "CreatedBlock": {
    "hash": "BlockHash",
    "aux": "ImportedAux"
  },
  "ImportedAux": {
    "headerOnly": "bool",
    "clearJustificationRequests": "bool",
    "needsJustification": "bool",
    "badJustification": "bool",
    "needsFinalityProof": "bool",
    "isNewBest": "bool"
  },
  "BlockV0": {
    "header": "EthHeader",
    "transactions": "Vec<TransactionV0>",
    "ommers": "Vec<EthHeader>"
  },
  "LegacyTransaction": {
    "nonce": "U256",
    "gasPrice": "U256",
    "gasLimit": "U256",
    "action": "EthTransactionAction",
    "value": "U256",
    "input": "Bytes",
    "signature": "EthTransactionSignature"
  },
  "TransactionV0": "LegacyTransaction",
  "BlockV1": {
    "header": "EthHeader",
    "transactions": "Vec<TransactionV1>",
    "ommers": "Vec<EthHeader>"
  },
  "EIP2930Transaction": {
    "chainId": "u64",
    "nonce": "U256",
    "gasPrice": "U256",
    "gasLimit": "U256",
    "action": "EthTransactionAction",
    "value": "U256",
    "input": "Bytes",
    "accessList": "EthAccessList",
    "oddYParity": "bool",
    "r": "H256",
    "s": "H256"
  },
  "TransactionV1": {
    "_enum": {
      "Legacy": "LegacyTransaction",
      "EIP2930": "EIP2930Transaction"
    }
  },
  "BlockV2": {
    "header": "EthHeader",
    "transactions": "Vec<TransactionV2>",
    "ommers": "Vec<EthHeader>"
  },
  "EIP1559Transaction": {
    "chainId": "u64",
    "nonce": "U256",
    "maxPriorityFeePerGas": "U256",
    "maxFeePerGas": "U256",
    "gasLimit": "U256",
    "action": "EthTransactionAction",
    "value": "U256",
    "input": "Bytes",
    "accessList": "EthAccessList",
    "oddYParity": "bool",
    "r": "H256",
    "s": "H256"
  },
  "TransactionV2": {
    "_enum": {
      "Legacy": "LegacyTransaction",
      "EIP2930": "EIP2930Transaction",
      "EIP1559": "EIP1559Transaction"
    }
  },
  "EthereumAccountId": "GenericEthereumAccountId",
  "EthereumLookupSource": "GenericEthereumLookupSource",
  "EthereumSignature": "[u8; 65]",
  "EthAccessListItem": {
    "address": "EthAddress",
    "slots": "Vec<H256>"
  },
  "EthAccessList": "Vec<EthAccessListItem>",
  "EthAccount": {
    "address": "EthAddress",
    "balance": "U256",
    "nonce": "U256",
    "codeHash": "H256",
    "storageHash": "H256",
    "accountProof": "Vec<Bytes>",
    "storageProof": "Vec<EthStorageProof>"
  },
  "EthAddress": "H160",
  "EthBlock": {
    "header": "EthHeader",
    "transactions": "Vec<EthTransaction>",
    "ommers": "Vec<EthHeader>"
  },
  "EthHeader": {
    "parentHash": "H256",
    "ommersHash": "H256",
    "beneficiary": "EthAddress",
    "stateRoot": "H256",
    "transactionsRoot": "H256",
    "receiptsRoot": "H256",
    "logsBloom": "EthBloom",
    "difficulty": "U256",
    "number": "U256",
    "gasLimit": "U256",
    "gasUsed": "U256",
    "timestamp": "u64",
    "extraData": "Bytes",
    "mixMash": "H256",
    "nonce": "H64"
  },
  "EthRichBlock": {
    "blockHash": "Option<H256>",
    "parentHash": "H256",
    "sha3Uncles": "H256",
    "author": "EthAddress",
    "miner": "EthAddress",
    "stateRoot": "H256",
    "transactionsRoot": "H256",
    "receiptsRoot": "H256",
    "number": "Option<U256>",
    "gasUsed": "U256",
    "gasLimit": "U256",
    "extraData": "Bytes",
    "logsBloom": "EthBloom",
    "timestamp": "U256",
    "difficulty": "U256",
    "totalDifficulty": "Option<U256>",
    "sealFields": "Vec<Bytes>",
    "uncles": "Vec<H256>",
    "transactions": "Vec<EthTransaction>",
    "blockSize": "Option<U256>"
  },
  "EthBloom": "H2048",
  "EthCallRequest": {
    "from": "Option<EthAddress>",
    "to": "Option<EthAddress>",
    "gasPrice": "Option<U256>",
    "gas": "Option<U256>",
    "value": "Option<U256>",
    "data": "Option<Bytes>",
    "nonce": "Option<U256>"
  },
  "EthFilter": {
    "fromBlock": "Option<BlockNumber>",
    "toBlock": "Option<BlockNumber>",
    "blockHash": "Option<H256>",
    "address": "Option<EthFilterAddress>",
    "topics": "Option<EthFilterTopic>"
  },
  "EthFilterAddress": {
    "_enum": {
      "Single": "EthAddress",
      "Multiple": "Vec<EthAddress>",
      "Null": "Null"
    }
  },
  "EthFilterChanges": {
    "_enum": {
      "Logs": "Vec<EthLog>",
      "Hashes": "Vec<H256>",
      "Empty": "Null"
    }
  },
  "EthFilterTopic": {
    "_enum": {
      "Single": "EthFilterTopicInner",
      "Multiple": "Vec<EthFilterTopicInner>",
      "Null": "Null"
    }
  },
  "EthFilterTopicEntry": "Option<H256>",
  "EthFilterTopicInner": {
    "_enum": {
      "Single": "EthFilterTopicEntry",
      "Multiple": "Vec<EthFilterTopicEntry>",
      "Null": "Null"
    }
  },
  "EthRichHeader": {
    "blockHash": "Option<H256>",
    "parentHash": "H256",
    "sha3Uncles": "H256",
    "author": "EthAddress",
    "miner": "EthAddress",
    "stateRoot": "H256",
    "transactionsRoot": "H256",
    "receiptsRoot": "H256",
    "number": "Option<U256>",
    "gasUsed": "U256",
    "gasLimit": "U256",
    "extraData": "Bytes",
    "logsBloom": "EthBloom",
    "timestamp": "U256",
    "difficulty": "U256",
    "sealFields": "Vec<Bytes>",
    "blockSize": "Option<U256>"
  },
  "EthLog": {
    "address": "EthAddress",
    "topics": "Vec<H256>",
    "data": "Bytes",
    "blockHash": "Option<H256>",
    "blockNumber": "Option<U256>",
    "transactionHash": "Option<H256>",
    "transactionIndex": "Option<U256>",
    "logIndex": "Option<U256>",
    "transactionLogIndex": "Option<U256>",
    "removed": "bool"
  },
  "EthReceipt": {
    "transactionHash": "Option<H256>",
    "transactionIndex": "Option<U256>",
    "blockHash": "Option<H256>",
    "from": "Option<EthAddress>",
    "to": "Option<EthAddress>",
    "blockNumber": "Option<U256>",
    "cumulativeGasUsed": "U256",
    "gasUsed": "Option<U256>",
    "contractAddress": "Option<EthAddress>",
    "logs": "Vec<EthLog>",
    "root": "Option<H256>",
    "logsBloom": "EthBloom",
    "statusCode": "Option<U64>"
  },
  "EthStorageProof": {
    "key": "U256",
    "value": "U256",
    "proof": "Vec<Bytes>"
  },
  "EthSubKind": {
    "_enum": [
      "newHeads",
      "logs",
      "newPendingTransactions",
      "syncing"
    ]
  },
  "EthSubParams": {
    "_enum": {
      "None": "Null",
      "Logs": "EthFilter"
    }
  },
  "EthSubResult": {
    "_enum": {
      "Header": "EthRichHeader",
      "Log": "EthLog",
      "TransactionHash": "H256",
      "SyncState": "EthSyncStatus"
    }
  },
  "EthSyncInfo": {
    "startingBlock": "U256",
    "currentBlock": "U256",
    "highestBlock": "U256",
    "warpChunksAmount": "Option<U256>",
    "warpChunksProcessed": "Option<U256>"
  },
  "EthSyncStatus": {
    "_enum": {
      "Info": "EthSyncInfo",
      "None": "Null"
    }
  },
  "EthTransaction": "LegacyTransaction",
  "EthTransactionSignature": {
    "v": "u64",
    "r": "H256",
    "s": "H256"
  },
  "EthTransactionAction": {
    "_enum": {
      "Call": "H160",
      "Create": "Null"
    }
  },
  "EthTransactionCondition": {
    "_enum": {
      "block": "u64",
      "time": "u64"
    }
  },
  "EthTransactionRequest": {
    "from": "Option<EthAddress>",
    "to": "Option<EthAddress>",
    "gasPrice": "Option<U256>",
    "gas": "Option<U256>",
    "value": "Option<U256>",
    "data": "Option<Bytes>",
    "nonce": "Option<U256>"
  },
  "EthTransactionStatus": {
    "transactionHash": "H256",
    "transactionIndex": "u32",
    "from": "EthAddress",
    "to": "Option<EthAddress>",
    "contractAddress": "Option<EthAddress>",
    "logs": "Vec<EthLog>",
    "logsBloom": "EthBloom"
  },
  "EthWork": {
    "powHash": "H256",
    "seedHash": "H256",
    "target": "H256",
    "number": "Option<u64>"
  },
  "EvmAccount": {
    "nonce": "u256",
    "balance": "u256"
  },
  "EvmLog": {
    "address": "H160",
    "topics": "Vec<H256>",
    "data": "Bytes"
  },
  "EvmVicinity": {
    "gasPrice": "u256",
    "origin": "H160"
  },
  "ExitError": {
    "_enum": {
      "StackUnderflow": "Null",
      "StackOverflow": "Null",
      "InvalidJump": "Null",
      "InvalidRange": "Null",
      "DesignatedInvalid": "Null",
      "CallTooDeep": "Null",
      "CreateCollision": "Null",
      "CreateContractLimit": "Null",
      "OutOfOffset": "Null",
      "OutOfGas": "Null",
      "OutOfFund": "Null",
      "PCUnderflow": "Null",
      "CreateEmpty": "Null",
      "Other": "Text"
    }
  },
  "ExitFatal": {
    "_enum": {
      "NotSupported": "Null",
      "UnhandledInterrupt": "Null",
      "CallErrorAsFatal": "ExitError",
      "Other": "Text"
    }
  },
  "ExitReason": {
    "_enum": {
      "Succeed": "ExitSucceed",
      "Error": "ExitError",
      "Revert": "ExitRevert",
      "Fatal": "ExitFatal"
    }
  },
  "ExitRevert": {
    "_enum": [
      "Reverted"
    ]
  },
  "ExitSucceed": {
    "_enum": [
      "Stopped",
      "Returned",
      "Suicided"
    ]
  },
  "Extrinsic": "GenericExtrinsic",
  "ExtrinsicEra": "GenericExtrinsicEra",
  "ExtrinsicPayload": "GenericExtrinsicPayload",
  "ExtrinsicSignature": "MultiSignature",
  "ExtrinsicV4": "GenericExtrinsicV4",
  "ExtrinsicPayloadV4": "GenericExtrinsicPayloadV4",
  "ExtrinsicSignatureV4": "GenericExtrinsicSignatureV4",
  "ExtrinsicUnknown": "GenericExtrinsicUnknown",
  "ExtrinsicPayloadUnknown": "GenericExtrinsicPayloadUnknown",
  "Era": "ExtrinsicEra",
  "ImmortalEra": "GenericImmortalEra",
  "MortalEra": "GenericMortalEra",
  "AnySignature": "H512",
  "MultiSignature": {
    "_enum": {
      "Ed25519": "Ed25519Signature",
      "Sr25519": "Sr25519Signature",
      "Ecdsa": "EcdsaSignature"
    }
  },
  "Signature": "H512",
  "SignerPayload": "GenericSignerPayload",
  "EcdsaSignature": "[u8; 65]",
  "Ed25519Signature": "H512",
  "Sr25519Signature": "H512",
  "AssetOptions": {
    "initalIssuance": "Compact<Balance>",
    "permissions": "PermissionLatest"
  },
  "Owner": {
    "_enum": {
      "None": "Null",
      "Address": "AccountId"
    }
  },
  "PermissionsV1": {
    "update": "Owner",
    "mint": "Owner",
    "burn": "Owner"
  },
  "PermissionVersions": {
    "_enum": {
      "V1": "PermissionsV1"
    }
  },
  "PermissionLatest": "PermissionsV1",
  "ActiveGilt": {
    "proportion": "Perquintill",
    "amount": "Balance",
    "who": "AccountId",
    "expiry": "BlockNumber"
  },
  "ActiveGiltsTotal": {
    "frozen": "Balance",
    "proportion": "Perquintill",
    "index": "ActiveIndex",
    "target": "Perquintill"
  },
  "ActiveIndex": "u32",
  "GiltBid": {
    "amount": "Balance",
    "who": "AccountId"
  },
  "AuthorityIndex": "u64",
  "AuthorityList": "Vec<NextAuthority>",
  "AuthoritySet": {
    "currentAuthorities": "AuthorityList",
    "setId": "u64",
    "pendingStandardChanges": "ForkTreePendingChange",
    "pendingForcedChanges": "Vec<PendingChange>",
    "authoritySetChanges": "AuthoritySetChanges"
  },
  "ForkTreePendingChange": {
    "roots": "Vec<ForkTreePendingChangeNode>",
    "bestFinalizedNumber": "Option<BlockNumber>"
  },
  "ForkTreePendingChangeNode": {
    "hash": "BlockHash",
    "number": "BlockNumber",
    "data": "PendingChange",
    "children": "Vec<ForkTreePendingChangeNode>"
  },
  "AuthoritySetChange": "(U64, BlockNumber)",
  "AuthoritySetChanges": "Vec<AuthoritySetChange>",
  "AuthorityWeight": "u64",
  "DelayKind": {
    "_enum": {
      "Finalized": "Null",
      "Best": "DelayKindBest"
    }
  },
  "DelayKindBest": {
    "medianLastFinalized": "BlockNumber"
  },
  "EncodedFinalityProofs": "Bytes",
  "GrandpaEquivocation": {
    "_enum": {
      "Prevote": "GrandpaEquivocationValue",
      "Precommit": "GrandpaEquivocationValue"
    }
  },
  "GrandpaEquivocationProof": {
    "setId": "SetId",
    "equivocation": "GrandpaEquivocation"
  },
  "GrandpaEquivocationValue": {
    "roundNumber": "u64",
    "identity": "AuthorityId",
    "first": "(GrandpaPrevote, AuthoritySignature)",
    "second": "(GrandpaPrevote, AuthoritySignature)"
  },
  "GrandpaPrevote": {
    "targetHash": "Hash",
    "targetNumber": "BlockNumber"
  },
  "GrandpaCommit": {
    "targetHash": "BlockHash",
    "targetNumber": "BlockNumber",
    "precommits": "Vec<GrandpaSignedPrecommit>"
  },
  "GrandpaPrecommit": {
    "targetHash": "BlockHash",
    "targetNumber": "BlockNumber"
  },
  "GrandpaSignedPrecommit": {
    "precommit": "GrandpaPrecommit",
    "signature": "AuthoritySignature",
    "id": "AuthorityId"
  },
  "GrandpaJustification": {
    "round": "u64",
    "commit": "GrandpaCommit",
    "votesAncestries": "Vec<Header>"
  },
  "JustificationNotification": "Bytes",
  "KeyOwnerProof": "MembershipProof",
  "NextAuthority": "(AuthorityId, AuthorityWeight)",
  "PendingChange": {
    "nextAuthorities": "AuthorityList",
    "delay": "BlockNumber",
    "canonHeight": "BlockNumber",
    "canonHash": "BlockHash",
    "delayKind": "DelayKind"
  },
  "PendingPause": {
    "scheduledAt": "BlockNumber",
    "delay": "BlockNumber"
  },
  "PendingResume": {
    "scheduledAt": "BlockNumber",
    "delay": "BlockNumber"
  },
  "Precommits": {
    "currentWeight": "u32",
    "missing": "BTreeSet<AuthorityId>"
  },
  "Prevotes": {
    "currentWeight": "u32",
    "missing": "BTreeSet<AuthorityId>"
  },
  "ReportedRoundStates": {
    "setId": "u32",
    "best": "RoundState",
    "background": "Vec<RoundState>"
  },
  "RoundState": {
    "round": "u32",
    "totalWeight": "u32",
    "thresholdWeight": "u32",
    "prevotes": "Prevotes",
    "precommits": "Precommits"
  },
  "SetId": "u64",
  "StoredPendingChange": {
    "scheduledAt": "BlockNumber",
    "delay": "BlockNumber",
    "nextAuthorities": "AuthorityList"
  },
  "StoredState": {
    "_enum": {
      "Live": "Null",
      "PendingPause": "PendingPause",
      "Paused": "Null",
      "PendingResume": "PendingResume"
    }
  },
  "IdentityFields": {
    "_set": {
      "_bitLength": 64,
      "Display": 1,
      "Legal": 2,
      "Web": 4,
      "Riot": 8,
      "Email": 16,
      "PgpFingerprint": 32,
      "Image": 64,
      "Twitter": 128
    }
  },
  "IdentityInfoAdditional": "(Data, Data)",
  "IdentityInfoTo198": {
    "additional": "Vec<IdentityInfoAdditional>",
    "display": "Data",
    "legal": "Data",
    "web": "Data",
    "riot": "Data",
    "email": "Data",
    "pgpFingerprint": "Option<H160>",
    "image": "Data"
  },
  "IdentityInfo": {
    "additional": "Vec<IdentityInfoAdditional>",
    "display": "Data",
    "legal": "Data",
    "web": "Data",
    "riot": "Data",
    "email": "Data",
    "pgpFingerprint": "Option<H160>",
    "image": "Data",
    "twitter": "Data"
  },
  "IdentityJudgement": {
    "_enum": {
      "Unknown": "Null",
      "FeePaid": "Balance",
      "Reasonable": "Null",
      "KnownGood": "Null",
      "OutOfDate": "Null",
      "LowQuality": "Null",
      "Erroneous": "Null"
    }
  },
  "RegistrationJudgement": "(RegistrarIndex, IdentityJudgement)",
  "RegistrationTo198": {
    "judgements": "Vec<RegistrationJudgement>",
    "deposit": "Balance",
    "info": "IdentityInfoTo198"
  },
  "Registration": {
    "judgements": "Vec<RegistrationJudgement>",
    "deposit": "Balance",
    "info": "IdentityInfo"
  },
  "RegistrarIndex": "u32",
  "RegistrarInfo": {
    "account": "AccountId",
    "fee": "Balance",
    "fields": "IdentityFields"
  },
  "AuthIndex": "u32",
  "AuthoritySignature": "Signature",
  "Heartbeat": {
    "blockNumber": "BlockNumber",
    "networkState": "OpaqueNetworkState",
    "sessionIndex": "SessionIndex",
    "authorityIndex": "AuthIndex",
    "validatorsLen": "u32"
  },
  "HeartbeatTo244": {
    "blockNumber": "BlockNumber",
    "networkState": "OpaqueNetworkState",
    "sessionIndex": "SessionIndex",
    "authorityIndex": "AuthIndex"
  },
  "OpaqueMultiaddr": "Bytes",
  "OpaquePeerId": "Bytes",
  "OpaqueNetworkState": {
    "peerId": "OpaquePeerId",
    "externalAddresses": "Vec<OpaqueMultiaddr>"
  },
  "CallIndex": "(u8, u8)",
  "LotteryConfig": {
    "price": "Balance",
    "start": "BlockNumber",
    "length": "BlockNumber",
    "delay": "BlockNumber",
    "repeat": "bool"
  },
  "MmrLeafProof": {
    "blockHash": "BlockHash",
    "leaf": "Bytes",
    "proof": "Bytes"
  },
  "StorageKind": {
    "_enum": {
      "PERSISTENT": 1,
      "LOCAL": 2
    }
  },
  "DeferredOffenceOf": "(Vec<OffenceDetails>, Vec<Perbill>, SessionIndex)",
  "Kind": "[u8; 16]",
  "OffenceDetails": {
    "offender": "Offender",
    "reporters": "Vec<Reporter>"
  },
  "Offender": "IdentificationTuple",
  "OpaqueTimeSlot": "Bytes",
  "ReportIdOf": "Hash",
  "Reporter": "AccountId",
  "ServiceQuality": {
    "_enum": [
      "Ordered",
      "Fast"
    ]
  },
  "DisputeLocation": {
    "_enum": [
      "Local",
      "Remote"
    ]
  },
  "DisputeResult": {
    "_enum": [
      "Valid",
      "Invalid"
    ]
  },
  "DisputeState": {
    "validatorsFor": "BitVec",
    "validatorsAgainst": "BitVec",
    "start": "BlockNumber",
    "concludedAt": "Option<BlockNumber>"
  },
  "DisputeStatement": {
    "_enum": {
      "Valid": "ValidDisputeStatementKind",
      "Invalid": "InvalidDisputeStatementKind"
    }
  },
  "DisputeStatementSet": {
    "candidateHash": "CandidateHash",
    "session": "SessionIndex",
    "statements": "Vec<(DisputeStatement, ParaValidatorIndex, ValidatorSignature)>"
  },
  "ExplicitDisputeStatement": {
    "valid": "bool",
    "candidateHash": "CandidateHash",
    "session": "SessionIndex"
  },
  "InvalidDisputeStatementKind": {
    "_enum": [
      "Explicit"
    ]
  },
  "MultiDisputeStatementSet": "Vec<DisputeStatementSet>",
  "ValidDisputeStatementKind": {
    "_enum": {
      "Explicit": "Null",
      "BackingSeconded": "Hash",
      "BackingValid": "Hash",
      "ApprovalChecking": "Null"
    }
  },
  "HrmpChannel": {
    "maxCapacity": "u32",
    "maxTotalSize": "u32",
    "maxMessageSize": "u32",
    "msgCount": "u32",
    "totalSize": "u32",
    "mqcHead": "Option<Hash>",
    "senderDeposit": "Balance",
    "recipientDeposit": "Balance"
  },
  "HrmpChannelId": {
    "sender": "u32",
    "receiver": "u32"
  },
  "HrmpOpenChannelRequest": {
    "confirmed": "bool",
    "age": "SessionIndex",
    "senderDeposit": "Balance",
    "maxMessageSize": "u32",
    "maxCapacity": "u32",
    "maxTotalSize": "u32"
  },
  "ParachainProposal": {
    "proposer": "AccountId",
    "genesisHead": "HeadData",
    "validators": "Vec<ValidatorId>",
    "name": "Bytes",
    "balance": "Balance"
  },
  "RegisteredParachainInfo": {
    "validators": "Vec<ValidatorId>",
    "proposer": "AccountId"
  },
  "Bidder": {
    "_enum": {
      "New": "NewBidder",
      "Existing": "ParaId"
    }
  },
  "IncomingParachain": {
    "_enum": {
      "Unset": "NewBidder",
      "Fixed": "IncomingParachainFixed",
      "Deploy": "IncomingParachainDeploy"
    }
  },
  "IncomingParachainDeploy": {
    "code": "ValidationCode",
    "initialHeadData": "HeadData"
  },
  "IncomingParachainFixed": {
    "codeHash": "Hash",
    "codeSize": "u32",
    "initialHeadData": "HeadData"
  },
  "NewBidder": {
    "who": "AccountId",
    "sub": "SubId"
  },
  "SubId": "u32",
  "AuctionIndex": "u32",
  "LeasePeriod": "BlockNumber",
  "LeasePeriodOf": "BlockNumber",
  "SlotRange": {
    "_enum": [
      "ZeroZero",
      "ZeroOne",
      "ZeroTwo",
      "ZeroThree",
      "OneOne",
      "OneTwo",
      "OneThree",
      "TwoTwo",
      "TwoThree",
      "ThreeThree"
    ]
  },
  "WinningData": "[WinningDataEntry; 10]",
  "WinningDataEntry": "Option<(AccountId, ParaId, BalanceOf)>",
  "WinnersData": "Vec<WinnersDataTuple>",
  "WinnersDataTuple": "(AccountId, ParaId, BalanceOf, SlotRange)",
  "AbridgedCandidateReceipt": {
    "parachainIndex": "ParaId",
    "relayParent": "Hash",
    "headData": "HeadData",
    "collator": "CollatorId",
    "signature": "CollatorSignature",
    "povBlockHash": "Hash",
    "commitments": "CandidateCommitments"
  },
  "AbridgedHostConfiguration": {
    "maxCodeSize": "u32",
    "maxHeadDataSize": "u32",
    "maxUpwardQueueCount": "u32",
    "maxUpwardQueueSize": "u32",
    "maxUpwardMessageSize": "u32",
    "maxUpwardMessageNumPerCandidate": "u32",
    "hrmpMaxMessageNumPerCandidate": "u32",
    "validationUpgradeFrequency": "BlockNumber",
    "validationUpgradeDelay": "BlockNumber"
  },
  "AbridgedHrmpChannel": {
    "maxCapacity": "u32",
    "maxTotalSize": "u32",
    "maxMessageSize": "u32",
    "msgCount": "u32",
    "totalSize": "u32",
    "mqcHead": "Option<Hash>"
  },
  "AssignmentId": "AccountId",
  "AssignmentKind": {
    "_enum": {
      "Parachain": "Null",
      "Parathread": "(CollatorId, u32)"
    }
  },
  "AttestedCandidate": {
    "candidate": "AbridgedCandidateReceipt",
    "validityVotes": "Vec<ValidityAttestation>",
    "validatorIndices": "BitVec"
  },
  "AuthorityDiscoveryId": "AccountId",
  "AvailabilityBitfield": "BitVec",
  "AvailabilityBitfieldRecord": {
    "bitfield": "AvailabilityBitfield",
    "submittedTt": "BlockNumber"
  },
  "BackedCandidate": {
    "candidate": "CommittedCandidateReceipt",
    "validityVotes": "Vec<ValidityAttestation>",
    "validatorIndices": "BitVec"
  },
  "BufferedSessionChange": {
    "applyAt": "BlockNumber",
    "validators": "Vec<ValidatorId>",
    "queued": "Vec<ValidatorId>",
    "sessionIndex": "SessionIndex"
  },
  "CandidateCommitments": {
    "upwardMessages": "Vec<UpwardMessage>",
    "horizontalMessages": "Vec<OutboundHrmpMessage>",
    "newValidationCode": "Option<ValidationCode>",
    "headData": "HeadData",
    "processedDownwardMessages": "u32",
    "hrmpWatermark": "BlockNumber"
  },
  "CandidateDescriptor": {
    "paraId": "ParaId",
    "relayParent": "RelayChainHash",
    "collatorId": "CollatorId",
    "persistedValidationDataHash": "Hash",
    "povHash": "Hash",
    "erasureRoot": "Hash",
    "signature": "CollatorSignature",
    "paraHead": "Hash",
    "validationCodeHash": "ValidationCodeHash"
  },
  "CandidateHash": "Hash",
  "CandidateInfo": {
    "who": "AccountId",
    "deposit": "Balance"
  },
  "CandidatePendingAvailability": {
    "core": "CoreIndex",
    "hash": "CandidateHash",
    "descriptor": "CandidateDescriptor",
    "availabilityVotes": "BitVec",
    "backers": "BitVec",
    "relayParentNumber": "BlockNumber",
    "backedInNumber": "BlockNumber",
    "backingGroup": "GroupIndex"
  },
  "CandidateReceipt": {
    "descriptor": "CandidateDescriptor",
    "commitmentsHash": "Hash"
  },
  "GlobalValidationData": {
    "maxCodeSize": "u32",
    "maxHeadDataSize": "u32",
    "blockNumber": "BlockNumber"
  },
  "CollatorId": "H256",
  "CollatorSignature": "Signature",
  "CommittedCandidateReceipt": {
    "descriptor": "CandidateDescriptor",
    "commitments": "CandidateCommitments"
  },
  "CoreAssignment": {
    "core": "CoreIndex",
    "paraId": "ParaId",
    "kind": "AssignmentKind",
    "groupIdx": "GroupIndex"
  },
  "CoreIndex": "u32",
  "CoreOccupied": {
    "_enum": {
      "Parathread": "ParathreadEntry",
      "Parachain": "Null"
    }
  },
  "DoubleVoteReport": {
    "identity": "ValidatorId",
    "first": "(Statement, ValidatorSignature)",
    "second": "(Statement, ValidatorSignature)",
    "proof": "MembershipProof",
    "signingContext": "SigningContext"
  },
  "DownwardMessage": "Bytes",
  "GroupIndex": "u32",
  "GlobalValidationSchedule": {
    "maxCodeSize": "u32",
    "maxHeadDataSize": "u32",
    "blockNumber": "BlockNumber"
  },
  "HeadData": "Bytes",
  "HostConfiguration": {
    "maxCodeSize": "u32",
    "maxHeadDataSize": "u32",
    "maxUpwardQueueCount": "u32",
    "maxUpwardQueueSize": "u32",
    "maxUpwardMessageSize": "u32",
    "maxUpwardMessageNumPerCandidate": "u32",
    "hrmpMaxMessageNumPerCandidate": "u32",
    "validationUpgradeFrequency": "BlockNumber",
    "validationUpgradeDelay": "BlockNumber",
    "maxPovSize": "u32",
    "maxDownwardMessageSize": "u32",
    "preferredDispatchableUpwardMessagesStepWeight": "Weight",
    "hrmpMaxParachainOutboundChannels": "u32",
    "hrmpMaxParathreadOutboundChannels": "u32",
    "hrmpOpenRequestTtl": "u32",
    "hrmpSenderDeposit": "Balance",
    "hrmpRecipientDeposit": "Balance",
    "hrmpChannelMaxCapacity": "u32",
    "hrmpChannelMaxTotalSize": "u32",
    "hrmpMaxParachainInboundChannels": "u32",
    "hrmpMaxParathreadInboundChannels": "u32",
    "hrmpChannelMaxMessageSize": "u32",
    "codeRetentionPeriod": "BlockNumber",
    "parathreadCores": "u32",
    "parathreadRetries": "u32",
    "groupRotationFrequency": "BlockNumber",
    "chainAvailabilityPeriod": "BlockNumber",
    "threadAvailabilityPeriod": "BlockNumber",
    "schedulingLookahead": "u32",
    "maxValidatorsPerCore": "Option<u32>",
    "maxValidators": "Option<u32>",
    "disputePeriod": "SessionIndex",
    "disputePostConclusionAcceptancePeriod": "BlockNumber",
    "disputeMaxSpamSlots": "u32",
    "disputeConclusionByTimeOutPeriod": "BlockNumber",
    "noShowSlots": "u32",
    "nDelayTranches": "u32",
    "zerothDelayTrancheWidth": "u32",
    "neededApprovals": "u32",
    "relayVrfModuloSamples": "u32"
  },
  "InboundDownwardMessage": {
    "pubSentAt": "BlockNumber",
    "pubMsg": "DownwardMessage"
  },
  "InboundHrmpMessage": {
    "sentAt": "BlockNumber",
    "data": "Bytes"
  },
  "InboundHrmpMessages": "Vec<InboundHrmpMessage>",
  "LocalValidationData": {
    "parentHead": "HeadData",
    "balance": "Balance",
    "codeUpgradeAllowed": "Option<BlockNumber>"
  },
  "MessageIngestionType": {
    "downwardMessages": "Vec<InboundDownwardMessage>",
    "horizontalMessages": "BTreeMap<ParaId, InboundHrmpMessages>"
  },
  "MessageQueueChain": "RelayChainHash",
  "OutboundHrmpMessage": {
    "recipient": "u32",
    "data": "Bytes"
  },
  "ParachainDispatchOrigin": {
    "_enum": [
      "Signed",
      "Parachain",
      "Root"
    ]
  },
  "ParachainInherentData": {
    "validationData": "PersistedValidationData",
    "relayChainState": "StorageProof",
    "downwardMessages": "Vec<InboundDownwardMessage>",
    "horizontalMessages": "BTreeMap<ParaId, VecInboundHrmpMessage>"
  },
  "ParachainsInherentData": {
    "bitfields": "SignedAvailabilityBitfields",
    "backedCandidates": "Vec<BackedCandidate>",
    "disputes": "MultiDisputeStatementSet",
    "parentHeader": "Header"
  },
  "ParaGenesisArgs": {
    "genesisHead": "Bytes",
    "validationCode": "Bytes",
    "parachain": "bool"
  },
  "ParaId": "u32",
  "ParaInfo": {
    "manager": "AccountId",
    "deposit": "Balance",
    "locked": "bool"
  },
  "ParaLifecycle": {
    "_enum": [
      "Onboarding",
      "Parathread",
      "Parachain",
      "UpgradingToParachain",
      "DowngradingToParathread",
      "OutgoingParathread",
      "OutgoingParachain"
    ]
  },
  "ParaPastCodeMeta": {
    "upgradeTimes": "Vec<ReplacementTimes>",
    "lastPruned": "Option<BlockNumber>"
  },
  "ParaScheduling": {
    "_enum": [
      "Always",
      "Dynamic"
    ]
  },
  "ParathreadClaim": "(ParaId, CollatorId)",
  "ParathreadClaimQueue": {
    "queue": "Vec<QueuedParathread>",
    "nextCoreOffset": "u32"
  },
  "ParathreadEntry": {
    "claim": "ParathreadClaim",
    "retries": "u32"
  },
  "ParaValidatorIndex": "u32",
  "PersistedValidationData": {
    "parentHead": "HeadData",
    "relayParentNumber": "RelayChainBlockNumber",
    "relayParentStorageRoot": "Hash",
    "maxPovSize": "u32"
  },
  "QueuedParathread": {
    "claim": "ParathreadEntry",
    "coreOffset": "u32"
  },
  "RelayBlockNumber": "u32",
  "RelayChainBlockNumber": "RelayBlockNumber",
  "RelayHash": "Hash",
  "RelayChainHash": "RelayHash",
  "Remark": "[u8; 32]",
  "ReplacementTimes": {
    "expectedAt": "BlockNumber",
    "activatedAt": "BlockNumber"
  },
  "Retriable": {
    "_enum": {
      "Never": "Null",
      "WithRetries": "u32"
    }
  },
  "Scheduling": {
    "_enum": [
      "Always",
      "Dynamic"
    ]
  },
  "SessionInfo": {
    "validators": "Vec<ValidatorId>",
    "discoveryKeys": "Vec<AuthorityDiscoveryId>",
    "assignmentKeys": "Vec<AssignmentId>",
    "validatorGroups": "Vec<SessionInfoValidatorGroup>",
    "nCores": "u32",
    "zerothDelayTrancheWidth": "u32",
    "relayVrfModuloSamples": "u32",
    "nDelayTranches": "u32",
    "noShowSlots": "u32",
    "neededApprovals": "u32"
  },
  "SessionInfoValidatorGroup": "Vec<ParaValidatorIndex>",
  "SignedAvailabilityBitfield": {
    "payload": "BitVec",
    "validatorIndex": "ParaValidatorIndex",
    "signature": "ValidatorSignature"
  },
  "SignedAvailabilityBitfields": "Vec<SignedAvailabilityBitfield>",
  "SigningContext": {
    "sessionIndex": "SessionIndex",
    "parentHash": "Hash"
  },
  "Statement": {
    "_enum": {
      "Never": "Null",
      "Candidate": "Hash",
      "Valid": "Hash",
      "Invalid": "Hash"
    }
  },
  "TransientValidationData": {
    "maxCodeSize": "u32",
    "maxHeadDataSize": "u32",
    "balance": "Balance",
    "codeUpgradeAllowed": "Option<BlockNumber>",
    "dmqLength": "u32"
  },
  "UpgradeGoAhead": {
    "_enum": [
      "Abort",
      "GoAhead"
    ]
  },
  "UpgradeRestriction": {
    "_enum": [
      "Present"
    ]
  },
  "UpwardMessage": "Bytes",
  "ValidationFunctionParams": {
    "maxCodeSize": "u32",
    "relayChainHeight": "RelayChainBlockNumber",
    "codeUpgradeAllowed": "Option<RelayChainBlockNumber>"
  },
  "ValidationCode": "Bytes",
  "ValidationCodeHash": "Hash",
  "ValidationData": {
    "persisted": "PersistedValidationData",
    "transient": "TransientValidationData"
  },
  "ValidationDataType": {
    "validationData": "ValidationData",
    "relayChainState": "Vec<Bytes>"
  },
  "ValidatorSignature": "Signature",
  "ValidityAttestation": {
    "_enum": {
      "Never": "Null",
      "Implicit": "ValidatorSignature",
      "Explicit": "ValidatorSignature"
    }
  },
  "MessagingStateSnapshot": {
    "relayDispatchQueueSize": "(u32, u32)",
    "egressChannels": "Vec<MessagingStateSnapshotEgressEntry>"
  },
  "MessagingStateSnapshotEgressEntry": "(ParaId, AbridgedHrmpChannel)",
  "SystemInherentData": "ParachainInherentData",
  "VecInboundHrmpMessage": "Vec<InboundHrmpMessage>",
  "FeeDetails": {
    "inclusionFee": "Option<InclusionFee>"
  },
  "InclusionFee": {
    "baseFee": "Balance",
    "lenFee": "Balance",
    "adjustedWeightFee": "Balance"
  },
  "RuntimeDispatchInfo": {
    "weight": "Weight",
    "class": "DispatchClass",
    "partialFee": "Balance"
  },
  "Approvals": "[bool; 4]",
  "ProxyDefinition": {
    "delegate": "AccountId",
    "proxyType": "ProxyType",
    "delay": "BlockNumber"
  },
  "ProxyType": {
    "_enum": [
      "Any",
      "NonTransfer",
      "Governance",
      "Staking"
    ]
  },
  "ProxyAnnouncement": {
    "real": "AccountId",
    "callHash": "Hash",
    "height": "BlockNumber"
  },
  "AccountStatus": {
    "validity": "AccountValidity",
    "freeBalance": "Balance",
    "lockedBalance": "Balance",
    "signature": "Vec<u8>",
    "vat": "Permill"
  },
  "AccountValidity": {
    "_enum": [
      "Invalid",
      "Initiated",
      "Pending",
      "ValidLow",
      "ValidHigh",
      "Completed"
    ]
  },
  "ActiveRecovery": {
    "created": "BlockNumber",
    "deposit": "Balance",
    "friends": "Vec<AccountId>"
  },
  "RecoveryConfig": {
    "delayPeriod": "BlockNumber",
    "deposit": "Balance",
    "friends": "Vec<AccountId>",
    "threshold": "u16"
  },
  "RpcMethods": {
    "version": "u32",
    "methods": "Vec<Text>"
  },
  "Fixed64": "Int<64, Fixed64>",
  "FixedI64": "Int<64, FixedI64>",
  "FixedU64": "UInt<64, FixedU64>",
  "Fixed128": "Int<128, Fixed128>",
  "FixedI128": "Int<128, FixedI128>",
  "FixedU128": "UInt<128, FixedU128>",
  "I32F32": "Int<64, I32F32>",
  "U32F32": "UInt<64, U32F32>",
  "PerU16": "UInt<16, PerU16>",
  "Perbill": "UInt<32, Perbill>",
  "Percent": "UInt<8, Percent>",
  "Permill": "UInt<32, Permill>",
  "Perquintill": "UInt<64, Perquintill>",
  "AccountId": "AccountId32",
  "AccountId20": "GenericEthereumAccountId",
  "AccountId32": "GenericAccountId",
  "AccountIdOf": "AccountId",
  "AccountIndex": "GenericAccountIndex",
  "Address": "MultiAddress",
  "AssetId": "u32",
  "Balance": "UInt<128, Balance>",
  "BalanceOf": "Balance",
  "Block": "GenericBlock",
  "BlockNumber": "u32",
  "BlockNumberFor": "BlockNumber",
  "BlockNumberOf": "BlockNumber",
  "Call": "GenericCall",
  "CallHash": "Hash",
  "CallHashOf": "CallHash",
  "ChangesTrieConfiguration": {
    "digestInterval": "u32",
    "digestLevels": "u32"
  },
  "ChangesTrieSignal": {
    "_enum": {
      "NewConfiguration": "Option<ChangesTrieConfiguration>"
    }
  },
  "ConsensusEngineId": "GenericConsensusEngineId",
  "CodecHash": "Hash",
  "CrateVersion": {
    "major": "u16",
    "minor": "u8",
    "patch": "u8"
  },
  "Digest": {
    "logs": "Vec<DigestItem>"
  },
  "DigestItem": {
    "_enum": {
      "Other": "Bytes",
      "AuthoritiesChange": "Vec<AuthorityId>",
      "ChangesTrieRoot": "Hash",
      "SealV0": "SealV0",
      "Consensus": "Consensus",
      "Seal": "Seal",
      "PreRuntime": "PreRuntime",
      "ChangesTrieSignal": "ChangesTrieSignal",
      "RuntimeEnvironmentUpdated": "Null"
    }
  },
  "ExtrinsicsWeight": {
    "normal": "Weight",
    "operational": "Weight"
  },
  "H32": "[u8; 4; H32]",
  "H64": "[u8; 8; H64]",
  "H128": "[u8; 16; H128]",
  "H160": "[u8; 20; H160]",
  "H256": "[u8; 32; H256]",
  "H512": "[u8; 64; H512]",
  "H1024": "[u8; 128; H1024]",
  "H2048": "[u8; 256; H2048]",
  "Hash": "H256",
  "Header": {
    "parentHash": "Hash",
    "number": "Compact<BlockNumber>",
    "stateRoot": "Hash",
    "extrinsicsRoot": "Hash",
    "digest": "Digest"
  },
  "HeaderPartial": {
    "parentHash": "Hash",
    "number": "BlockNumber"
  },
  "IndicesLookupSource": "GenericLookupSource",
  "Index": "u32",
  "Justification": "(ConsensusEngineId, EncodedJustification)",
  "EncodedJustification": "Bytes",
  "Justifications": "Vec<Justification>",
  "KeyValue": "(StorageKey, StorageData)",
  "KeyTypeId": "u32",
  "LockIdentifier": "[u8; 8]",
  "LookupSource": "MultiAddress",
  "LookupTarget": "AccountId",
  "ModuleId": "LockIdentifier",
  "MultiAddress": "GenericMultiAddress",
  "MultiSigner": {
    "_enum": {
      "Ed25519": "[u8; 32]",
      "Sr25519": "[u8; 32]",
      "Ecdsa": "[u8; 33]"
    }
  },
  "Moment": "UInt<64, Moment>",
  "OpaqueCall": "Bytes",
  "Origin": "DoNotConstruct<Origin>",
  "PalletId": "LockIdentifier",
  "PalletsOrigin": "OriginCaller",
  "PalletVersion": {
    "major": "u16",
    "minor": "u8",
    "patch": "u8"
  },
  "Pays": {
    "_enum": [
      "Yes",
      "No"
    ]
  },
  "Phantom": "Null",
  "PhantomData": "Null",
  "Releases": {
    "_enum": [
      "V1",
      "V2",
      "V3",
      "V4",
      "V5",
      "V6",
      "V7",
      "V8",
      "V9",
      "V10"
    ]
  },
  "RuntimeDbWeight": {
    "read": "Weight",
    "write": "Weight"
  },
  "SignedBlock": "SignedBlockWithJustifications",
  "SignedBlockWithJustification": {
    "block": "Block",
    "justification": "Option<EncodedJustification>"
  },
  "SignedBlockWithJustifications": {
    "block": "Block",
    "justifications": "Option<Justifications>"
  },
  "Slot": "u64",
  "StorageData": "Bytes",
  "StorageProof": {
    "trieNodes": "Vec<Bytes>"
  },
  "TransactionPriority": "u64",
  "TransactionInfo": {
    "chunkRoot": "H256",
    "contentHash": "H256",
    "dataSize": "u32",
    "blockChunks": "u32"
  },
  "TransactionStorageProof": {
    "chunk": "Vec<u8>",
    "proof": "Vec<Vec<u8>>"
  },
  "ValidatorId": "AccountId",
  "ValidatorIdOf": "ValidatorId",
  "Weight": "u64",
  "WeightMultiplier": "Fixed64",
  "PreRuntime": "(ConsensusEngineId, Bytes)",
  "SealV0": "(u64, Signature)",
  "Seal": "(ConsensusEngineId, Bytes)",
  "Consensus": "(ConsensusEngineId, Bytes)",
  "Si0Field": {
    "name": "Option<Text>",
    "type": "Si0LookupTypeId",
    "typeName": "Option<Text>",
    "docs": "Vec<Text>"
  },
  "Si0LookupTypeId": "u32",
  "Si0Path": "Vec<Text>",
  "Si0Type": {
    "path": "Si0Path",
    "params": "Vec<Si0LookupTypeId>",
    "def": "Si0TypeDef"
  },
  "Si0TypeDef": {
    "_enum": {
      "Composite": "Si0TypeDefComposite",
      "Variant": "Si0TypeDefVariant",
      "Sequence": "Si0TypeDefSequence",
      "Array": "Si0TypeDefArray",
      "Tuple": "Si0TypeDefTuple",
      "Primitive": "Si0TypeDefPrimitive",
      "Compact": "Si0TypeDefCompact",
      "Phantom": "Si0TypeDefPhantom",
      "BitSequence": "Si0TypeDefBitSequence"
    }
  },
  "Si0TypeDefArray": {
    "len": "u32",
    "type": "Si0LookupTypeId"
  },
  "Si0TypeDefBitSequence": {
    "bitStoreType": "Si0LookupTypeId",
    "bitOrderType": "Si0LookupTypeId"
  },
  "Si0TypeDefCompact": {
    "type": "Si0LookupTypeId"
  },
  "Si0TypeDefComposite": {
    "fields": "Vec<Si0Field>"
  },
  "Si0TypeDefPhantom": "Null",
  "Si0TypeDefVariant": {
    "variants": "Vec<Si0Variant>"
  },
  "Si0TypeDefPrimitive": {
    "_enum": [
      "Bool",
      "Char",
      "Str",
      "U8",
      "U16",
      "U32",
      "U64",
      "U128",
      "U256",
      "I8",
      "I16",
      "I32",
      "I64",
      "I128",
      "I256"
    ]
  },
  "Si0TypeDefSequence": {
    "type": "Si0LookupTypeId"
  },
  "Si0TypeDefTuple": "Vec<Si0LookupTypeId>",
  "Si0TypeParameter": {
    "name": "Text",
    "type": "Option<Si0LookupTypeId>"
  },
  "Si0Variant": {
    "name": "Text",
    "fields": "Vec<Si0Field>",
    "index": "Option<u8>",
    "discriminant": "Option<u64>",
    "docs": "Vec<Text>"
  },
  "Si1Field": {
    "name": "Option<Text>",
    "type": "Si1LookupTypeId",
    "typeName": "Option<Text>",
    "docs": "Vec<Text>"
  },
  "Si1LookupTypeId": "Compact<u32>",
  "Si1Path": "Si0Path",
  "Si1Type": {
    "path": "Si1Path",
    "params": "Vec<Si1TypeParameter>",
    "def": "Si1TypeDef",
    "docs": "Vec<Text>"
  },
  "Si1TypeDef": {
    "_enum": {
      "Composite": "Si1TypeDefComposite",
      "Variant": "Si1TypeDefVariant",
      "Sequence": "Si1TypeDefSequence",
      "Array": "Si1TypeDefArray",
      "Tuple": "Si1TypeDefTuple",
      "Primitive": "Si1TypeDefPrimitive",
      "Compact": "Si1TypeDefCompact",
      "BitSequence": "Si1TypeDefBitSequence",
      "HistoricMetaCompat": "Type"
    }
  },
  "Si1TypeDefArray": {
    "len": "u32",
    "type": "Si1LookupTypeId"
  },
  "Si1TypeDefBitSequence": {
    "bitStoreType": "Si1LookupTypeId",
    "bitOrderType": "Si1LookupTypeId"
  },
  "Si1TypeDefCompact": {
    "type": "Si1LookupTypeId"
  },
  "Si1TypeDefComposite": {
    "fields": "Vec<Si1Field>"
  },
  "Si1TypeDefPrimitive": "Si0TypeDefPrimitive",
  "Si1TypeDefSequence": {
    "type": "Si1LookupTypeId"
  },
  "Si1TypeDefTuple": "Vec<Si1LookupTypeId>",
  "Si1TypeParameter": {
    "name": "Text",
    "type": "Option<Si1LookupTypeId>"
  },
  "Si1TypeDefVariant": {
    "variants": "Vec<Si1Variant>"
  },
  "Si1Variant": {
    "name": "Text",
    "fields": "Vec<Si1Field>",
    "index": "u8",
    "docs": "Vec<Text>"
  },
  "SiField": "Si1Field",
  "SiLookupTypeId": "Si1LookupTypeId",
  "SiPath": "Si1Path",
  "SiType": "Si1Type",
  "SiTypeDef": "Si1TypeDef",
  "SiTypeDefArray": "Si1TypeDefArray",
  "SiTypeDefBitSequence": "Si1TypeDefBitSequence",
  "SiTypeDefCompact": "Si1TypeDefCompact",
  "SiTypeDefComposite": "Si1TypeDefComposite",
  "SiTypeDefPrimitive": "Si1TypeDefPrimitive",
  "SiTypeDefSequence": "Si1TypeDefSequence",
  "SiTypeDefTuple": "Si1TypeDefTuple",
  "SiTypeParameter": "Si1TypeParameter",
  "SiTypeDefVariant": "Si1TypeDefVariant",
  "SiVariant": "Si1Variant",
  "Period": "(BlockNumber, u32)",
  "Priority": "u8",
  "SchedulePeriod": "Period",
  "SchedulePriority": "Priority",
  "Scheduled": {
    "maybeId": "Option<Bytes>",
    "priority": "SchedulePriority",
    "call": "Call",
    "maybePeriodic": "Option<SchedulePeriod>",
    "origin": "PalletsOrigin"
  },
  "ScheduledTo254": {
    "maybeId": "Option<Bytes>",
    "priority": "SchedulePriority",
    "call": "Call",
    "maybePeriodic": "Option<SchedulePeriod>"
  },
  "TaskAddress": "(BlockNumber, u32)",
  "BeefyKey": "[u8; 33]",
  "Keys": "SessionKeys4",
  "SessionKeys1": "(AccountId)",
  "SessionKeys2": "(AccountId, AccountId)",
  "SessionKeys3": "(AccountId, AccountId, AccountId)",
  "SessionKeys4": "(AccountId, AccountId, AccountId, AccountId)",
  "SessionKeys5": "(AccountId, AccountId, AccountId, AccountId, AccountId)",
  "SessionKeys6": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId)",
  "SessionKeys6B": "(AccountId, AccountId, AccountId, AccountId, AccountId, BeefyKey)",
  "SessionKeys7": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId)",
  "SessionKeys7B": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, BeefyKey)",
  "SessionKeys8": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId)",
  "SessionKeys8B": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, BeefyKey)",
  "SessionKeys9": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId)",
  "SessionKeys9B": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, BeefyKey)",
  "SessionKeys10": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId)",
  "SessionKeys10B": "(AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, AccountId, BeefyKey)",
  "FullIdentification": "Exposure",
  "IdentificationTuple": "(ValidatorId, FullIdentification)",
  "MembershipProof": {
    "session": "SessionIndex",
    "trieNodes": "Vec<Vec<u8>>",
    "validatorCount": "ValidatorCount"
  },
  "SessionIndex": "u32",
  "ValidatorCount": "u32",
  "Bid": {
    "who": "AccountId",
    "kind": "BidKind",
    "value": "Balance"
  },
  "BidKind": {
    "_enum": {
      "Deposit": "Balance",
      "Vouch": "(AccountId, Balance)"
    }
  },
  "SocietyJudgement": {
    "_enum": [
      "Rebid",
      "Reject",
      "Approve"
    ]
  },
  "SocietyVote": {
    "_enum": [
      "Skeptic",
      "Reject",
      "Approve"
    ]
  },
  "StrikeCount": "u32",
  "VouchingStatus": {
    "_enum": [
      "Vouching",
      "Banned"
    ]
  },
  "Points": "u32",
  "EraPoints": {
    "total": "Points",
    "individual": "Vec<Points>"
  },
  "CompactAssignments": "CompactAssignmentsWith16",
  "CompactAssignmentsWith16": {
    "votes1": "Vec<(NominatorIndexCompact, ValidatorIndexCompact)>",
    "votes2": "Vec<(NominatorIndexCompact, CompactScoreCompact, ValidatorIndexCompact)>",
    "votes3": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 2], ValidatorIndexCompact)>",
    "votes4": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 3], ValidatorIndexCompact)>",
    "votes5": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 4], ValidatorIndexCompact)>",
    "votes6": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 5], ValidatorIndexCompact)>",
    "votes7": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 6], ValidatorIndexCompact)>",
    "votes8": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 7], ValidatorIndexCompact)>",
    "votes9": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 8], ValidatorIndexCompact)>",
    "votes10": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 9], ValidatorIndexCompact)>",
    "votes11": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 10], ValidatorIndexCompact)>",
    "votes12": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 11], ValidatorIndexCompact)>",
    "votes13": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 12], ValidatorIndexCompact)>",
    "votes14": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 13], ValidatorIndexCompact)>",
    "votes15": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 14], ValidatorIndexCompact)>",
    "votes16": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 15], ValidatorIndexCompact)>"
  },
  "CompactAssignmentsWith24": {
    "votes1": "Vec<(NominatorIndexCompact, ValidatorIndexCompact)>",
    "votes2": "Vec<(NominatorIndexCompact, CompactScoreCompact, ValidatorIndexCompact)>",
    "votes3": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 2], ValidatorIndexCompact)>",
    "votes4": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 3], ValidatorIndexCompact)>",
    "votes5": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 4], ValidatorIndexCompact)>",
    "votes6": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 5], ValidatorIndexCompact)>",
    "votes7": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 6], ValidatorIndexCompact)>",
    "votes8": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 7], ValidatorIndexCompact)>",
    "votes9": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 8], ValidatorIndexCompact)>",
    "votes10": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 9], ValidatorIndexCompact)>",
    "votes11": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 10], ValidatorIndexCompact)>",
    "votes12": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 11], ValidatorIndexCompact)>",
    "votes13": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 12], ValidatorIndexCompact)>",
    "votes14": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 13], ValidatorIndexCompact)>",
    "votes15": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 14], ValidatorIndexCompact)>",
    "votes16": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 15], ValidatorIndexCompact)>",
    "votes17": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 16], ValidatorIndexCompact)>",
    "votes18": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 17], ValidatorIndexCompact)>",
    "votes19": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 18], ValidatorIndexCompact)>",
    "votes20": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 19], ValidatorIndexCompact)>",
    "votes21": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 20], ValidatorIndexCompact)>",
    "votes22": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 21], ValidatorIndexCompact)>",
    "votes23": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 22], ValidatorIndexCompact)>",
    "votes24": "Vec<(NominatorIndexCompact, [CompactScoreCompact; 23], ValidatorIndexCompact)>"
  },
  "CompactAssignmentsTo265": "CompactAssignmentsWith16",
  "CompactAssignmentsTo257": {
    "votes1": "Vec<(NominatorIndex, [CompactScore; 0], ValidatorIndex)>",
    "votes2": "Vec<(NominatorIndex, [CompactScore; 1], ValidatorIndex)>",
    "votes3": "Vec<(NominatorIndex, [CompactScore; 2], ValidatorIndex)>",
    "votes4": "Vec<(NominatorIndex, [CompactScore; 3], ValidatorIndex)>",
    "votes5": "Vec<(NominatorIndex, [CompactScore; 4], ValidatorIndex)>",
    "votes6": "Vec<(NominatorIndex, [CompactScore; 5], ValidatorIndex)>",
    "votes7": "Vec<(NominatorIndex, [CompactScore; 6], ValidatorIndex)>",
    "votes8": "Vec<(NominatorIndex, [CompactScore; 7], ValidatorIndex)>",
    "votes9": "Vec<(NominatorIndex, [CompactScore; 8], ValidatorIndex)>",
    "votes10": "Vec<(NominatorIndex, [CompactScore; 9], ValidatorIndex)>",
    "votes11": "Vec<(NominatorIndex, [CompactScore; 10], ValidatorIndex)>",
    "votes12": "Vec<(NominatorIndex, [CompactScore; 11], ValidatorIndex)>",
    "votes13": "Vec<(NominatorIndex, [CompactScore; 12], ValidatorIndex)>",
    "votes14": "Vec<(NominatorIndex, [CompactScore; 13], ValidatorIndex)>",
    "votes15": "Vec<(NominatorIndex, [CompactScore; 14], ValidatorIndex)>",
    "votes16": "Vec<(NominatorIndex, [CompactScore; 15], ValidatorIndex)>"
  },
  "CompactScore": "(ValidatorIndex, OffchainAccuracy)",
  "CompactScoreCompact": "(ValidatorIndexCompact, OffchainAccuracyCompact)",
  "ElectionCompute": {
    "_enum": [
      "OnChain",
      "Signed",
      "Unsigned"
    ]
  },
  "ElectionPhase": {
    "_enum": {
      "Off": null,
      "Signed": null,
      "Unsigned": "(bool, BlockNumber)",
      "Emergency": null
    }
  },
  "ElectionResult": {
    "compute": "ElectionCompute",
    "slotStake": "Balance",
    "electedStashes": "Vec<AccountId>",
    "exposures": "Vec<(AccountId, Exposure)>"
  },
  "ElectionScore": "[u128; 3]",
  "ElectionSize": {
    "validators": "Compact<ValidatorIndex>",
    "nominators": "Compact<NominatorIndex>"
  },
  "ElectionStatus": {
    "_enum": {
      "Close": "Null",
      "Open": "BlockNumber"
    }
  },
  "ExtendedBalance": "u128",
  "RawSolution": "RawSolutionWith16",
  "RawSolutionWith16": {
    "compact": "CompactAssignmentsWith16",
    "score": "ElectionScore",
    "round": "u32"
  },
  "RawSolutionWith24": {
    "compact": "CompactAssignmentsWith24",
    "score": "ElectionScore",
    "round": "u32"
  },
  "RawSolutionTo265": "RawSolutionWith16",
  "ReadySolution": {
    "supports": "SolutionSupports",
    "score": "ElectionScore",
    "compute": "ElectionCompute"
  },
  "RoundSnapshot": {
    "voters": "Vec<(AccountId, VoteWeight, Vec<AccountId>)>",
    "targets": "Vec<AccountId>"
  },
  "SeatHolder": {
    "who": "AccountId",
    "stake": "Balance",
    "deposit": "Balance"
  },
  "SignedSubmission": {
    "who": "AccountId",
    "deposit": "Balance",
    "solution": "RawSolution",
    "reward": "Balance"
  },
  "SignedSubmissionTo276": {
    "who": "AccountId",
    "deposit": "Balance",
    "solution": "RawSolution"
  },
  "SignedSubmissionOf": "SignedSubmission",
  "SolutionOrSnapshotSize": {
    "voters": "Compact<u32>",
    "targets": "Compact<u32>"
  },
  "SolutionSupport": {
    "total": "ExtendedBalance",
    "voters": "Vec<(AccountId, ExtendedBalance)>"
  },
  "SolutionSupports": "Vec<(AccountId, SolutionSupport)>",
  "Supports": "SolutionSupports",
  "SubmissionIndicesOf": "BTreeMap<ElectionScore, u32>",
  "Voter": {
    "votes": "Vec<AccountId>",
    "stake": "Balance",
    "deposit": "Balance"
  },
  "VoteWeight": "u64",
  "ActiveEraInfo": {
    "index": "EraIndex",
    "start": "Option<Moment>"
  },
  "EraIndex": "u32",
  "EraRewardPoints": {
    "total": "RewardPoint",
    "individual": "BTreeMap<AccountId, RewardPoint>"
  },
  "EraRewards": {
    "total": "u32",
    "rewards": "Vec<u32>"
  },
  "Exposure": {
    "total": "Compact<Balance>",
    "own": "Compact<Balance>",
    "others": "Vec<IndividualExposure>"
  },
  "Forcing": {
    "_enum": [
      "NotForcing",
      "ForceNew",
      "ForceNone",
      "ForceAlways"
    ]
  },
  "IndividualExposure": {
    "who": "AccountId",
    "value": "Compact<Balance>"
  },
  "KeyType": "AccountId",
  "MomentOf": "Moment",
  "Nominations": {
    "targets": "Vec<AccountId>",
    "submittedIn": "EraIndex",
    "suppressed": "bool"
  },
  "NominatorIndex": "u32",
  "NominatorIndexCompact": "Compact<NominatorIndex>",
  "OffchainAccuracy": "PerU16",
  "OffchainAccuracyCompact": "Compact<OffchainAccuracy>",
  "PhragmenScore": "[u128; 3]",
  "RewardDestination": {
    "_enum": {
      "Staked": "Null",
      "Stash": "Null",
      "Controller": "Null",
      "Account": "AccountId",
      "None": "Null"
    }
  },
  "RewardPoint": "u32",
  "SlashJournalEntry": {
    "who": "AccountId",
    "amount": "Balance",
    "ownSlash": "Balance"
  },
  "SlashingSpansTo204": {
    "spanIndex": "SpanIndex",
    "lastStart": "EraIndex",
    "prior": "Vec<EraIndex>"
  },
  "SlashingSpans": {
    "spanIndex": "SpanIndex",
    "lastStart": "EraIndex",
    "lastNonzeroSlash": "EraIndex",
    "prior": "Vec<EraIndex>"
  },
  "SpanIndex": "u32",
  "SpanRecord": {
    "slashed": "Balance",
    "paidOut": "Balance"
  },
  "StakingLedgerTo223": {
    "stash": "AccountId",
    "total": "Compact<Balance>",
    "active": "Compact<Balance>",
    "unlocking": "Vec<UnlockChunk>"
  },
  "StakingLedgerTo240": {
    "stash": "AccountId",
    "total": "Compact<Balance>",
    "active": "Compact<Balance>",
    "unlocking": "Vec<UnlockChunk>",
    "lastReward": "Option<EraIndex>"
  },
  "StakingLedger": {
    "stash": "AccountId",
    "total": "Compact<Balance>",
    "active": "Compact<Balance>",
    "unlocking": "Vec<UnlockChunk>",
    "claimedRewards": "Vec<EraIndex>"
  },
  "UnappliedSlashOther": "(AccountId, Balance)",
  "UnappliedSlash": {
    "validator": "AccountId",
    "own": "Balance",
    "others": "Vec<UnappliedSlashOther>",
    "reporters": "Vec<AccountId>",
    "payout": "Balance"
  },
  "UnlockChunk": {
    "value": "Compact<Balance>",
    "era": "Compact<BlockNumber>"
  },
  "ValidatorIndex": "u16",
  "ValidatorIndexCompact": "Compact<ValidatorIndex>",
  "ValidatorPrefs": "ValidatorPrefsWithBlocked",
  "ValidatorPrefsWithCommission": {
    "commission": "Compact<Perbill>"
  },
  "ValidatorPrefsWithBlocked": {
    "commission": "Compact<Perbill>",
    "blocked": "bool"
  },
  "ValidatorPrefsTo196": {
    "validatorPayment": "Compact<Balance>"
  },
  "ValidatorPrefsTo145": {
    "unstakeThreshold": "Compact<u32>",
    "validatorPayment": "Compact<Balance>"
  },
  "ApiId": "[u8; 8]",
  "BlockTrace": {
    "blockHash": "Text",
    "parentHash": "Text",
    "tracingTargets": "Text",
    "storageKeys": "Text",
    "spans": "Vec<BlockTraceSpan>",
    "events": "Vec<BlockTraceEvent>"
  },
  "BlockTraceEvent": {
    "target": "Text",
    "data": "BlockTraceEventData",
    "parentId": "Option<u64>"
  },
  "BlockTraceEventData": {
    "stringValues": "HashMap<Text, Text>"
  },
  "BlockTraceSpan": {
    "id": "u64",
    "parentId": "Option<u64>",
    "name": "Text",
    "target": "Text",
    "wasm": "bool"
  },
  "KeyValueOption": "(StorageKey, Option<StorageData>)",
  "ReadProof": {
    "at": "Hash",
    "proof": "Vec<Bytes>"
  },
  "RuntimeVersionApi": "(ApiId, u32)",
  "RuntimeVersion": {
    "specName": "Text",
    "implName": "Text",
    "authoringVersion": "u32",
    "specVersion": "u32",
    "implVersion": "u32",
    "apis": "Vec<RuntimeVersionApi>",
    "transactionVersion": "u32"
  },
  "RuntimeVersionPartial": {
    "specName": "Text",
    "specVersion": "u32"
  },
  "SpecVersion": "u32",
  "StorageChangeSet": {
    "block": "Hash",
    "changes": "Vec<KeyValueOption>"
  },
  "TraceBlockResponse": {
    "_enum": {
      "TraceError": "TraceError",
      "BlockTrace": "BlockTrace"
    }
  },
  "TraceError": {
    "error": "Text"
  },
  "WeightToFeeCoefficient": {
    "coeffInteger": "Balance",
    "coeffFrac": "Perbill",
    "negative": "bool",
    "degree": "u8"
  },
  "AccountInfo": "AccountInfoWithTripleRefCount",
  "AccountInfoWithRefCountU8": {
    "nonce": "Index",
    "refcount": "u8",
    "data": "AccountData"
  },
  "AccountInfoWithRefCount": {
    "nonce": "Index",
    "refcount": "RefCount",
    "data": "AccountData"
  },
  "AccountInfoWithDualRefCount": {
    "nonce": "Index",
    "consumers": "RefCount",
    "providers": "RefCount",
    "data": "AccountData"
  },
  "AccountInfoWithProviders": "AccountInfoWithDualRefCount",
  "AccountInfoWithTripleRefCount": {
    "nonce": "Index",
    "consumers": "RefCount",
    "providers": "RefCount",
    "sufficients": "RefCount",
    "data": "AccountData"
  },
  "ApplyExtrinsicResult": "Result<DispatchOutcome, TransactionValidityError>",
  "ArithmeticError": {
    "_enum": [
      "Underflow",
      "Overflow",
      "DivisionByZero"
    ]
  },
  "BlockLength": {
    "max": "PerDispatchClassU32"
  },
  "BlockWeights": {
    "baseBlock": "Weight",
    "maxBlock": "Weight",
    "perClass": "PerDispatchClassWeightsPerClass"
  },
  "ChainProperties": "GenericChainProperties",
  "ChainType": {
    "_enum": {
      "Development": "Null",
      "Local": "Null",
      "Live": "Null",
      "Custom": "Text"
    }
  },
  "ConsumedWeight": "PerDispatchClassWeight",
  "DigestOf": "Digest",
  "DispatchClass": {
    "_enum": [
      "Normal",
      "Operational",
      "Mandatory"
    ]
  },
  "DispatchError": {
    "_enum": {
      "Other": "Null",
      "CannotLookup": "Null",
      "BadOrigin": "Null",
      "Module": "DispatchErrorModule",
      "ConsumerRemaining": "Null",
      "NoProviders": "Null",
      "Token": "TokenError",
      "Arithmetic": "ArithmeticError"
    }
  },
  "DispatchErrorModule": {
    "index": "u8",
    "error": "u8"
  },
    DispatchErrorPre6: {
        _enum: {
            Other: 'Null',
            CannotLookup: 'Null',
            BadOrigin: 'Null',
            Module: 'DispatchErrorModule',
            ConsumerRemaining: 'Null',
            NoProviders: 'Null',
            TooManyConsumers: 'Null',
            Token: 'TokenError',
            Arithmetic: 'ArithmeticError',
            Transactional: 'TransactionalError'
        }
    },
    DispatchErrorPre6First: {
        _enum: {
            Other: 'Null',
            CannotLookup: 'Null',
            BadOrigin: 'Null',
            Module: 'DispatchErrorModule',
            ConsumerRemaining: 'Null',
            NoProviders: 'Null',
            Token: 'TokenError',
            Arithmetic: 'ArithmeticError',
            Transactional: 'TransactionalError'
        }
    },
    TransactionalError: {
        _enum: [
            'LimitReached',
            'NoLayer'
        ]
    },
  "DispatchErrorTo198": {
    "module": "Option<u8>",
    "error": "u8"
  },
  "DispatchInfo": {
    "weight": "Weight",
    "class": "DispatchClass",
    "paysFee": "Pays"
  },
  "DispatchInfoTo190": {
    "weight": "Weight",
    "class": "DispatchClass"
  },
  "DispatchInfoTo244": {
    "weight": "Weight",
    "class": "DispatchClass",
    "paysFee": "bool"
  },
  "DispatchOutcome": "Result<(), DispatchError>",
  "DispatchResult": "Result<(), DispatchError>",
  "DispatchResultOf": "DispatchResult",
  "DispatchResultTo198": "Result<(), Text>",
  "Event": "GenericEvent",
  "EventId": "[u8; 2]",
  "EventIndex": "u32",
  "EventRecord": {
    "phase": "Phase",
    "event": "Event",
    "topics": "Vec<Hash>"
  },
  "Health": {
    "peers": "u64",
    "isSyncing": "bool",
    "shouldHavePeers": "bool"
  },
  "InvalidTransaction": {
    "_enum": {
      "Call": "Null",
      "Payment": "Null",
      "Future": "Null",
      "Stale": "Null",
      "BadProof": "Null",
      "AncientBirthBlock": "Null",
      "ExhaustsResources": "Null",
      "Custom": "u8",
      "BadMandatory": "Null",
      "MandatoryDispatch": "Null"
    }
  },
  "Key": "Bytes",
  "LastRuntimeUpgradeInfo": {
    "specVersion": "Compact<u32>",
    "specName": "Text"
  },
  "NetworkState": {
    "peerId": "Text",
    "listenedAddresses": "Vec<Text>",
    "externalAddresses": "Vec<Text>",
    "connectedPeers": "HashMap<Text, Peer>",
    "notConnectedPeers": "HashMap<Text, NotConnectedPeer>",
    "averageDownloadPerSec": "u64",
    "averageUploadPerSec": "u64",
    "peerset": "NetworkStatePeerset"
  },
  "NetworkStatePeerset": {
    "messageQueue": "u64",
    "nodes": "HashMap<Text, NetworkStatePeersetInfo>"
  },
  "NetworkStatePeersetInfo": {
    "connected": "bool",
    "reputation": "i32"
  },
  "NodeRole": {
    "_enum": {
      "Full": "Null",
      "LightClient": "Null",
      "Authority": "Null",
      "UnknownRole": "u8"
    }
  },
  "NotConnectedPeer": {
    "knownAddresses": "Vec<Text>",
    "latestPingTime": "Option<PeerPing>",
    "versionString": "Option<Text>"
  },
  "Peer": {
    "enabled": "bool",
    "endpoint": "PeerEndpoint",
    "knownAddresses": "Vec<Text>",
    "latestPingTime": "PeerPing",
    "open": "bool",
    "versionString": "Text"
  },
  "PeerEndpoint": {
    "listening": "PeerEndpointAddr"
  },
  "PeerEndpointAddr": {
    "localAddr": "Text",
    "sendBackAddr": "Text"
  },
  "PeerPing": {
    "nanos": "u64",
    "secs": "u64"
  },
  "PeerInfo": {
    "peerId": "Text",
    "roles": "Text",
    "protocolVersion": "u32",
    "bestHash": "Hash",
    "bestNumber": "BlockNumber"
  },
  "PerDispatchClassU32": {
    "normal": "u32",
    "operational": "u32",
    "mandatory": "u32"
  },
  "PerDispatchClassWeight": {
    "normal": "Weight",
    "operational": "Weight",
    "mandatory": "Weight"
  },
  "PerDispatchClassWeightsPerClass": {
    "normal": "WeightPerClass",
    "operational": "WeightPerClass",
    "mandatory": "WeightPerClass"
  },
  "Phase": {
    "_enum": {
      "ApplyExtrinsic": "u32",
      "Finalization": "Null",
      "Initialization": "Null"
    }
  },
  "RawOrigin": {
    "_enum": {
      "Root": "Null",
      "Signed": "AccountId",
      "None": "Null"
    }
  },
  "RefCount": "u32",
  "RefCountTo259": "u8",
  "SyncState": {
    "startingBlock": "BlockNumber",
    "currentBlock": "BlockNumber",
    "highestBlock": "Option<BlockNumber>"
  },
  "SystemOrigin": "RawOrigin",
  "TokenError": {
    "_enum": [
      "NoFunds",
      "WouldDie",
      "BelowMinimum",
      "CannotCreate",
      "UnknownAsset",
      "Frozen",
      "Underflow",
      "Overflow"
    ]
  },
  "TransactionValidityError": {
    "_enum": {
      "Invalid": "InvalidTransaction",
      "Unknown": "UnknownTransaction"
    }
  },
  "UnknownTransaction": {
    "_enum": {
      "CannotLookup": "Null",
      "NoUnsignedValidator": "Null",
      "Custom": "u8"
    }
  },
  "WeightPerClass": {
    "baseExtrinsic": "Weight",
    "maxExtrinsic": "Option<Weight>",
    "maxTotal": "Option<Weight>",
    "reserved": "Option<Weight>"
  },
  "Bounty": {
    "proposer": "AccountId",
    "value": "Balance",
    "fee": "Balance",
    "curatorDeposit": "Balance",
    "bond": "Balance",
    "status": "BountyStatus"
  },
  "BountyIndex": "u32",
  "BountyStatus": {
    "_enum": {
      "Proposed": "Null",
      "Approved": "Null",
      "Funded": "Null",
      "CuratorProposed": "BountyStatusCuratorProposed",
      "Active": "BountyStatusActive",
      "PendingPayout": "BountyStatusPendingPayout"
    }
  },
  "BountyStatusActive": {
    "curator": "AccountId",
    "updateDue": "BlockNumber"
  },
  "BountyStatusCuratorProposed": {
    "curator": "AccountId"
  },
  "BountyStatusPendingPayout": {
    "curator": "AccountId",
    "beneficiary": "AccountId",
    "unlockAt": "BlockNumber"
  },
  "OpenTip": {
    "reason": "Hash",
    "who": "AccountId",
    "finder": "AccountId",
    "deposit": "Balance",
    "closes": "Option<BlockNumber>",
    "tips": "Vec<OpenTipTip>",
    "findersFee": "bool"
  },
  "OpenTipTo225": {
    "reason": "Hash",
    "who": "AccountId",
    "finder": "Option<OpenTipFinderTo225>",
    "closes": "Option<BlockNumber>",
    "tips": "Vec<OpenTipTip>"
  },
  "OpenTipFinderTo225": "(AccountId, Balance)",
  "OpenTipTip": "(AccountId, Balance)",
  "TreasuryProposal": {
    "proposer": "AccountId",
    "value": "Balance",
    "beneficiary": "AccountId",
    "bond": "Balance"
  },
  "Multiplier": "Fixed128",
  "ClassId": "u32",
  "InstanceId": "u32",
  "DepositBalance": "Balance",
  "DepositBalanceOf": "Balance",
  "ClassDetails": {
    "owner": "AccountId",
    "issuer": "AccountId",
    "admin": "AccountId",
    "freezer": "AccountId",
    "totalDeposit": "DepositBalance",
    "freeHolding": "bool",
    "instances": "u32",
    "instanceMetadatas": "u32",
    "attributes": "u32",
    "isFrozen": "bool"
  },
  "DestroyWitness": {
    "instances": "Compact<u32>",
    "instanceMetadatas": "Compact<u32>",
    "attributes": "Compact<u32>"
  },
  "InstanceDetails": {
    "owner": "AccountId",
    "approved": "Option<AccountId>",
    "isFrozen": "bool",
    "deposit": "DepositBalance"
  },
  "ClassMetadata": {
    "deposit": "DepositBalance",
    "data": "Vec<u8>",
    "isFrozen": "bool"
  },
  "InstanceMetadata": {
    "deposit": "DepositBalance",
    "data": "Vec<u8>",
    "isFrozen": "bool"
  },
  "Multisig": {
    "when": "Timepoint",
    "deposit": "Balance",
    "depositor": "AccountId",
    "approvals": "Vec<AccountId>"
  },
  "Timepoint": {
    "height": "BlockNumber",
    "index": "u32"
  },
  "VestingInfo": {
    "locked": "Balance",
    "perBlock": "Balance",
    "startingBlock": "BlockNumber"
  },
  "BodyId": {
    "_enum": {
      "Unit": "Null",
      "Named": "Vec<u8>",
      "Index": "Compact<u32>",
      "Executive": "Null",
      "Technical": "Null",
      "Legislative": "Null",
      "Judicial": "Null"
    }
  },
  "BodyPart": {
    "_enum": {
      "Voice": "Null",
      "Members": "Compact<u32>",
      "Fraction": {
        "nom": "Compact<u32>",
        "denom": "Compact<u32>"
      },
      "AtLeastProportion": {
        "nom": "Compact<u32>",
        "denom": "Compact<u32>"
      },
      "MoreThanProportion": {
        "nom": "Compact<u32>",
        "denom": "Compact<u32>"
      }
    }
  },
  "InteriorMultiLocation": "Junctions",
  "NetworkId": {
    "_enum": {
      "Any": "Null",
      "Named": "Vec<u8>",
      "Polkadot": "Null",
      "Kusama": "Null"
    }
  },
  "XcmOrigin": {
    "_enum": {
      "Xcm": "MultiLocation"
    }
  },
  "XcmpMessageFormat": {
    "_enum": [
      "ConcatenatedVersionedXcm",
      "ConcatenatedEncodedBlob",
      "Signals"
    ]
  },
  "XcmAssetId": {
    "_enum": {
      "Concrete": "MultiLocation",
      "Abstract": "Bytes"
    }
  },
  "InboundStatus": {
    "_enum": [
      "Ok",
      "Suspended"
    ]
  },
  "OutboundStatus": {
    "_enum": [
      "Ok",
      "Suspended"
    ]
  },
  "MultiAssets": "Vec<MultiAsset>",
  "FungibilityV0": "FungibilityV1",
  "WildFungibilityV0": "WildFungibilityV1",
  "AssetInstanceV0": {
    "_enum": {
      "Undefined": "Null",
      "Index8": "u8",
      "Index16": "Compact<u16>",
      "Index32": "Compact<u32>",
      "Index64": "Compact<u64>",
      "Index128": "Compact<u128>",
      "Array4": "[u8; 4]",
      "Array8": "[u8; 8]",
      "Array16": "[u8; 16]",
      "Array32": "[u8; 32]",
      "Blob": "Vec<u8>"
    }
  },
  "JunctionV0": {
    "_enum": {
      "Parent": "Null",
      "Parachain": "Compact<u32>",
      "AccountId32": {
        "network": "NetworkId",
        "id": "AccountId"
      },
      "AccountIndex64": {
        "network": "NetworkId",
        "index": "Compact<u64>"
      },
      "AccountKey20": {
        "network": "NetworkId",
        "key": "[u8; 20]"
      },
      "PalletInstance": "u8",
      "GeneralIndex": "Compact<u128>",
      "GeneralKey": "Vec<u8>",
      "OnlyChild": "Null",
      "Plurality": {
        "id": "BodyId",
        "part": "BodyPart"
      }
    }
  },
  "MultiAssetV0": {
    "_enum": {
      "None": "Null",
      "All": "Null",
      "AllFungible": "Null",
      "AllNonFungible": "Null",
      "AllAbstractFungible": "Vec<u8>",
      "AllAbstractNonFungible": "Vec<u8>",
      "AllConcreteFungible": "MultiLocationV0",
      "AllConcreteNonFungible": "MultiLocationV0",
      "AbstractFungible": {
        "id": "Vec<u8>",
        "instance": "Compact<u128>"
      },
      "AbstractNonFungible": {
        "class": "Vec<u8>",
        "instance": "AssetInstanceV0"
      },
      "ConcreteFungible": {
        "id": "MultiLocationV0",
        "amount": "Compact<u128>"
      },
      "ConcreteNonFungible": {
        "class": "MultiLocationV0",
        "instance": "AssetInstanceV0"
      }
    }
  },
  "MultiLocationV0": {
    "_enum": {
      "Here": "Null",
      "X1": "JunctionV0",
      "X2": "(JunctionV0, JunctionV0)",
      "X3": "(JunctionV0, JunctionV0, JunctionV0)",
      "X4": "(JunctionV0, JunctionV0, JunctionV0, JunctionV0)",
      "X5": "(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)",
      "X6": "(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)",
      "X7": "(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)",
      "X8": "(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)"
    }
  },
  "OriginKindV0": {
    "_enum": [
      "Native",
      "SovereignAccount",
      "Superuser",
      "Xcm"
    ]
  },
  "ResponseV0": {
    "_enum": {
      "Assets": "Vec<MultiAssetV0>"
    }
  },
  "XcmV0": {
    "_enum": {
      "WithdrawAsset": {
        "assets": "Vec<MultiAssetV0>",
        "effects": "Vec<XcmOrderV0>"
      },
      "ReserveAssetDeposit": {
        "assets": "Vec<MultiAssetV0>",
        "effects": "Vec<XcmOrderV0>"
      },
      "ReceiveTeleportedAsset": {
        "assets": "Vec<MultiAssetV0>",
        "effects": "Vec<XcmOrderV0>"
      },
      "QueryResponse": {
        "queryId": "Compact<u64>",
        "response": "ResponseV0"
      },
      "TransferAsset": {
        "assets": "Vec<MultiAssetV0>",
        "dest": "MultiLocationV0"
      },
      "TransferReserveAsset": {
        "assets": "Vec<MultiAssetV0>",
        "dest": "MultiLocationV0",
        "effects": "Vec<XcmOrderV0>"
      },
      "Transact": {
        "originType": "XcmOriginKind",
        "requireWeightAtMost": "u64",
        "call": "DoubleEncodedCall"
      },
      "HrmpNewChannelOpenRequest": {
        "sender": "Compact<u32>",
        "maxMessageSize": "Compact<u32>",
        "maxCapacity": "Compact<u32>"
      },
      "HrmpChannelAccepted": {
        "recipient": "Compact<u32>"
      },
      "HrmpChannelClosing": {
        "initiator": "Compact<u32>",
        "sender": "Compact<u32>",
        "recipient": "Compact<u32>"
      },
      "RelayedFrom": {
        "who": "MultiLocationV0",
        "message": "XcmV0"
      }
    }
  },
  "XcmErrorV0": {
    "_enum": {
      "Undefined": "Null",
      "Overflow": "Null",
      "Unimplemented": "Null",
      "UnhandledXcmVersion": "Null",
      "UnhandledXcmMessage": "Null",
      "UnhandledEffect": "Null",
      "EscalationOfPrivilege": "Null",
      "UntrustedReserveLocation": "Null",
      "UntrustedTeleportLocation": "Null",
      "DestinationBufferOverflow": "Null",
      "SendFailed": "Null",
      "CannotReachDestination": "(MultiLocation, Xcm)",
      "MultiLocationFull": "Null",
      "FailedToDecode": "Null",
      "BadOrigin": "Null",
      "ExceedsMaxMessageSize": "Null",
      "FailedToTransactAsset": "Null",
      "WeightLimitReached": "Weight",
      "Wildcard": "Null",
      "TooMuchWeightRequired": "Null",
      "NotHoldingFees": "Null",
      "WeightNotComputable": "Null",
      "Barrier": "Null",
      "NotWithdrawable": "Null",
      "LocationCannotHold": "Null",
      "TooExpensive": "Null",
      "AssetNotFound": "Null",
      "RecursionLimitReached": "Null"
    }
  },
  "XcmOrderV0": {
    "_enum": {
      "Null": "Null",
      "DepositAsset": {
        "assets": "Vec<MultiAssetV0>",
        "dest": "MultiLocationV0"
      },
      "DepositReserveAsset": {
        "assets": "Vec<MultiAssetV0>",
        "dest": "MultiLocationV0",
        "effects": "Vec<XcmOrderV0>"
      },
      "ExchangeAsset": {
        "give": "Vec<MultiAssetV0>",
        "receive": "Vec<MultiAssetV0>"
      },
      "InitiateReserveWithdraw": {
        "assets": "Vec<MultiAssetV0>",
        "reserve": "MultiLocationV0",
        "effects": "Vec<XcmOrderV0>"
      },
      "InitiateTeleport": {
        "assets": "Vec<MultiAsset>",
        "dest": "MultiLocationV0",
        "effects": "Vec<XcmOrderV0>"
      },
      "QueryHolding": {
        "queryId": "Compact<u64>",
        "dest": "MultiLocationV0",
        "assets": "Vec<MultiAssetV0>"
      },
      "BuyExecution": {
        "fees": "MultiAsset",
        "weight": "u64",
        "debt": "u64",
        "haltOnError": "bool",
        "xcm": "Vec<XcmV0>"
      }
    }
  },
  "AssetInstanceV1": {
    "_enum": {
      "Undefined": "Null",
      "Index": "Compact<u128>",
      "Array4": "[u8; 4]",
      "Array8": "[u8; 8]",
      "Array16": "[u8; 16]",
      "Array32": "[u8; 32]",
      "Blob": "Bytes"
    }
  },
  "FungibilityV1": {
    "_enum": {
      "Fungible": "Compact<u128>",
      "NonFungible": "AssetInstanceV1"
    }
  },
  "JunctionV1": {
    "_enum": {
      "Parachain": "Compact<u32>",
      "AccountId32": {
        "network": "NetworkId",
        "id": "AccountId"
      },
      "AccountIndex64": {
        "network": "NetworkId",
        "index": "Compact<u64>"
      },
      "AccountKey20": {
        "network": "NetworkId",
        "key": "[u8; 20]"
      },
      "PalletInstance": "u8",
      "GeneralIndex": "Compact<u128>",
      "GeneralKey": "Vec<u8>",
      "OnlyChild": "Null",
      "Plurality": {
        "id": "BodyId",
        "part": "BodyPart"
      }
    }
  },
  "JunctionsV1": {
    "_enum": {
      "Here": "Null",
      "X1": "JunctionV1",
      "X2": "(JunctionV1, JunctionV1)",
      "X3": "(JunctionV1, JunctionV1, JunctionV1)",
      "X4": "(JunctionV1, JunctionV1, JunctionV1, JunctionV1)",
      "X5": "(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)",
      "X6": "(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)",
      "X7": "(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)",
      "X8": "(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)"
    }
  },
  "MultiAssetsV1": "Vec<MultiAssetV1>",
  "MultiAssetV1": {
    "id": "XcmAssetId",
    "fungibility": "FungibilityV1"
  },
  "MultiAssetFilterV1": {
    "_enum": {
      "Definite": "MultiAssetsV1",
      "Wild": "WildMultiAssetV1"
    }
  },
  "MultiLocationV1": {
    "parents": "u8",
    "interior": "JunctionsV1"
  },
  "OriginKindV1": "OriginKindV0",
  "ResponseV1": {
    "_enum": {
      "Assets": "MultiAssetsV1"
    }
  },
  "WildFungibilityV1": {
    "_enum": [
      "Fungible",
      "NonFungible"
    ]
  },
  "WildMultiAssetV1": {
    "_enum": {
      "All": "Null",
      "AllOf": {
        "id": "XcmAssetId",
        "fungibility": "WildFungibilityV1"
      }
    }
  },
  "XcmV1": {
    "_enum": {
      "WithdrawAsset": {
        "assets": "MultiAssetsV1",
        "effects": "Vec<XcmOrderV1>"
      },
      "ReserveAssetDeposit": {
        "assets": "MultiAssetsV1",
        "effects": "Vec<XcmOrderV1>"
      },
      "ReceiveTeleportedAsset": {
        "assets": "MultiAssetsV1",
        "effects": "Vec<XcmOrderV1>"
      },
      "QueryResponse": {
        "queryId": "Compact<u64>",
        "response": "ResponseV1"
      },
      "TransferAsset": {
        "assets": "MultiAssetsV1",
        "dest": "MultiLocationV1"
      },
      "TransferReserveAsset": {
        "assets": "MultiAssetsV1",
        "dest": "MultiLocationV1",
        "effects": "Vec<XcmOrderV1>"
      },
      "Transact": {
        "originType": "XcmOriginKind",
        "requireWeightAtMost": "u64",
        "call": "DoubleEncodedCall"
      },
      "HrmpNewChannelOpenRequest": {
        "sender": "Compact<u32>",
        "maxMessageSize": "Compact<u32>",
        "maxCapacity": "Compact<u32>"
      },
      "HrmpChannelAccepted": {
        "recipient": "Compact<u32>"
      },
      "HrmpChannelClosing": {
        "initiator": "Compact<u32>",
        "sender": "Compact<u32>",
        "recipient": "Compact<u32>"
      },
      "RelayedFrom": {
        "who": "MultiLocationV1",
        "message": "XcmV1"
      }
    }
  },
  "XcmErrorV1": {
    "_enum": {
      "Undefined": "Null",
      "Overflow": "Null",
      "Unimplemented": "Null",
      "UnhandledXcmVersion": "Null",
      "UnhandledXcmMessage": "Null",
      "UnhandledEffect": "Null",
      "EscalationOfPrivilege": "Null",
      "UntrustedReserveLocation": "Null",
      "UntrustedTeleportLocation": "Null",
      "DestinationBufferOverflow": "Null",
      "SendFailed": "Null",
      "CannotReachDestination": "(MultiLocationV1, XcmV1)",
      "MultiLocationFull": "Null",
      "FailedToDecode": "Null",
      "BadOrigin": "Null",
      "ExceedsMaxMessageSize": "Null",
      "FailedToTransactAsset": "Null",
      "WeightLimitReached": "Weight",
      "Wildcard": "Null",
      "TooMuchWeightRequired": "Null",
      "NotHoldingFees": "Null",
      "WeightNotComputable": "Null",
      "Barrier": "Null",
      "NotWithdrawable": "Null",
      "LocationCannotHold": "Null",
      "TooExpensive": "Null",
      "AssetNotFound": "Null",
      "DestinationUnsupported": "Null",
      "RecursionLimitReached": "Null"
    }
  },
  "XcmOrderV1": {
    "_enum": {
      "Noop": "Null",
      "DepositAsset": {
        "assets": "MultiAssetFilterV1",
        "maxAssets": "u32",
        "beneficiary": "MultiLocationV1"
      },
      "DepositReserveAsset": {
        "assets": "MultiAssetFilterV1",
        "maxAssets": "u32",
        "dest": "MultiLocationV1",
        "effects": "Vec<XcmOrderV1>"
      },
      "ExchangeAsset": {
        "give": "MultiAssetFilterV1",
        "receive": "MultiAssetsV1"
      },
      "InitiateReserveWithdraw": {
        "assets": "MultiAssetFilterV1",
        "reserve": "MultiLocationV1",
        "effects": "Vec<XcmOrderV1>"
      },
      "InitiateTeleport": {
        "assets": "MultiAssetFilterV1",
        "dest": "MultiLocationV1",
        "effects": "Vec<XcmOrderV1>"
      },
      "QueryHolding": {
        "queryId": "Compact<u64>",
        "dest": "MultiLocationV1",
        "assets": "MultiAssetFilterV1"
      },
      "BuyExecution": {
        "fees": "MultiAssetV1",
        "weight": "u64",
        "debt": "u64",
        "haltOnError": "bool",
        "instructions": "Vec<XcmV1>"
      }
    }
  },
  "AssetInstanceV2": "AssetInstanceV1",
  "FungibilityV2": "FungibilityV1",
  "JunctionV2": "JunctionV1",
  "JunctionsV2": "JunctionsV1",
  "MultiAssetsV2": "MultiAssetsV1",
  "MultiAssetV2": "MultiAssetV1",
  "MultiAssetFilterV2": "MultiAssetFilterV1",
  "MultiLocationV2": "MultiLocationV1",
  "OriginKindV2": "OriginKindV1",
  "WildFungibilityV2": "WildFungibilityV1",
  "ResponseV2": {
    "_enum": {
      "Null": "Null",
      "Assets": "MultiAssetsV2",
      "ExecutionResult": "ResponseV2Result"
    }
  },
  "ResponseV2Error": "(u32, XcmErrorV2)",
  "ResponseV2Result": "Result<Null, ResponseV2Error>",
  "WeightLimitV2": {
    "_enum": {
      "Unlimited": "Null",
      "Limited": "Compact<u64>"
    }
  },
  "InstructionV2": {
    "_enum": {
      "WithdrawAsset": "MultiAssetsV2",
      "ReserveAssetDeposited": "MultiAssetsV2",
      "ReceiveTeleportedAsset": "MultiAssetsV2",
      "QueryResponse": {
        "queryId": "Compact<u64>",
        "response": "ResponseV2",
        "maxWeight": "Compact<u64>"
      },
      "TransferAsset": {
        "assets": "MultiAssetsV2",
        "beneficiary": "MultiLocationV2"
      },
      "TransferReserveAsset": {
        "assets": "MultiAssetsV2",
        "dest": "MultiLocationV2",
        "xcm": "XcmV2"
      },
      "Transact": {
        "originType": "OriginKindV2",
        "requireWeightAtMost": "u64",
        "call": "DoubleEncodedCall"
      },
      "HrmpNewChannelOpenRequest": {
        "sender": "Compact<u32>",
        "maxMessageSize": "Compact<u32>",
        "maxCapacity": "Compact<u32>"
      },
      "HrmpChannelAccepted": {
        "recipient": "Compact<u32>"
      },
      "HrmpChannelClosing": {
        "initiator": "Compact<u32>",
        "sender": "Compact<u32>",
        "recipient": "Compact<u32>"
      },
      "ClearOrigin": "Null",
      "DescendOrigin": "InteriorMultiLocation",
      "ReportError": {
        "queryId": "Compact<u64>",
        "dest": "MultiLocationV2",
        "maxResponseWeight": "Compact<u64>"
      },
      "DepositAsset": {
        "assets": "MultiAssetFilterV2",
        "maxAssets": "u32",
        "beneficiary": "MultiLocationV2"
      },
      "DepositReserveAsset": {
        "assets": "MultiAssetFilterV2",
        "maxAssets": "u32",
        "dest": "MultiLocationV2",
        "xcm": "XcmV2"
      },
      "ExchangeAsset": {
        "give": "MultiAssetFilterV2",
        "receive": "MultiAssetsV2"
      },
      "InitiateReserveWithdraw": {
        "assets": "MultiAssetFilterV2",
        "reserve": "MultiLocationV2",
        "xcm": "XcmV2"
      },
      "InitiateTeleport": {
        "assets": "MultiAssetFilterV2",
        "dest": "MultiLocationV2",
        "xcm": "XcmV2"
      },
      "QueryHolding": {
        "query_id": "Compact<u64>",
        "dest": "MultiLocationV2",
        "assets": "MultiAssetFilterV2",
        "maxResponse_Weight": "Compact<u64>"
      },
      "BuyExecution": {
        "fees": "MultiAssetV2",
        "weightLimit": "WeightLimitV2"
      },
      "RefundSurplus": "Null",
      "SetErrorHandler": "XcmV2",
      "SetAppendix": "XcmV2",
      "ClearError": "Null",
      "ClaimAsset": {
        "assets": "MultiAssetsV2",
        "ticket": "MultiLocationV2"
      },
      "Trap": "u64"
    }
  },
  "WildMultiAssetV2": "WildMultiAssetV1",
  "XcmV2": "Vec<InstructionV2>",
  "XcmErrorV2": {
    "_enum": {
      "Undefined": "Null",
      "Overflow": "Null",
      "Unimplemented": "Null",
      "UnhandledXcmVersion": "Null",
      "UnhandledXcmMessage": "Null",
      "UnhandledEffect": "Null",
      "EscalationOfPrivilege": "Null",
      "UntrustedReserveLocation": "Null",
      "UntrustedTeleportLocation": "Null",
      "DestinationBufferOverflow": "Null",
      "MultiLocationFull": "Null",
      "MultiLocationNotInvertible": "Null",
      "FailedToDecode": "Null",
      "BadOrigin": "Null",
      "ExceedsMaxMessageSize": "Null",
      "FailedToTransactAsset": "Null",
      "WeightLimitReached": "Weight",
      "Wildcard": "Null",
      "TooMuchWeightRequired": "Null",
      "NotHoldingFees": "Null",
      "WeightNotComputable": "Null",
      "Barrier": "Null",
      "NotWithdrawable": "Null",
      "LocationCannotHold": "Null",
      "TooExpensive": "Null",
      "AssetNotFound": "Null",
      "DestinationUnsupported": "Null",
      "RecursionLimitReached": "Null",
      "Transport": "Null",
      "Unroutable": "Null",
      "UnknownWeightRequired": "Null",
      "Trap": "u64",
      "UnknownClaim": "Null",
      "InvalidLocation": "Null"
    }
  },
  "XcmOrderV2": "XcmOrderV1",
  "AssetInstance": "AssetInstanceV2",
  "Fungibility": "FungibilityV2",
  "Junction": "JunctionV2",
  "Junctions": "JunctionsV2",
  "MultiAsset": "MultiAssetV2",
  "MultiAssetFilter": "MultiAssetFilterV2",
  "MultiLocation": "MultiLocationV2",
  "Response": "ResponseV2",
  "WildFungibility": "WildFungibilityV2",
  "WildMultiAsset": "WildMultiAssetV2",
  "Xcm": "XcmV2",
  "XcmError": "XcmErrorV2",
  "XcmOrder": "XcmOrderV2",
  "DoubleEncodedCall": {
    "encoded": "Vec<u8>"
  },
  "XcmOriginKind": {
    "_enum": [
      "Native",
      "SovereignAccount",
      "Superuser",
      "Xcm"
    ]
  },
  "Outcome": {
    "_enum": {
      "Complete": "Weight",
      "Incomplete": "(Weight, XcmErrorV0)",
      "Error": "XcmErrorV0"
    }
  },
  "QueryId": "u64",
  "QueryStatus": {
    "_enum": {
      "Pending": {
        "responder": "VersionedMultiLocation",
        "maybeNotify": "Option<(u8, u8)>",
        "timeout": "BlockNumber"
      },
      "Ready": {
        "response": "VersionedResponse",
        "at": "BlockNumber"
      }
    }
  },
  "QueueConfigData": {
    "suspendThreshold": "u32",
    "dropThreshold": "u32",
    "resumeThreshold": "u32",
    "thresholdWeight": "Weight",
    "weightRestrictDecay": "Weight"
  },
  "VersionMigrationStage": {
    "_enum": {
      "MigrateSupportedVersion": "Null",
      "MigrateVersionNotifiers": "Null",
      "NotifyCurrentTargets": "Option<Bytes>",
      "MigrateAndNotifyOldTargets": "Null"
    }
  },
  "VersionedMultiAsset": {
    "_enum": {
      "V0": "MultiAssetV0",
      "V1": "MultiAssetV1",
      "V2": "MultiAssetV2"
    }
  },
  "VersionedMultiAssets": {
    "_enum": {
      "V0": "Vec<MultiAssetV0>",
      "V1": "MultiAssetsV1",
      "V2": "MultiAssetsV2"
    }
  },
  "VersionedMultiLocation": {
    "_enum": {
      "V0": "MultiLocationV0",
      "V1": "MultiLocationV1",
      "V2": "MultiLocationV2"
    }
  },
  "VersionedResponse": {
    "V0": "ResponseV0",
    "V1": "ResponseV1",
    "V2": "ResponseV2"
  },
  "VersionedXcm": {
    "_enum": {
      "V0": "XcmV0",
      "V1": "XcmV1",
      "V2": "XcmV2"
    }
  },
  "XcmVersion": "u32"
}
