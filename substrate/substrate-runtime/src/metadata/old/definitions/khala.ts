import {OldTypesBundle} from "../types"

export const bundle: OldTypesBundle = {
    types: {
        "Address": "MultiAddress",
        "LookupSource": "MultiAddress",
        "Keys": "AccountId",
        "BridgeChainId": "u8",
        "BridgeEvent": {
            "_enum": {
                "FungibleTransfer": "FungibleTransfer",
                "NonFungibleTransfer": "NonFungibleTransfer",
                "GenericTransfer": "GenericTransfer"
            }
        },
        "FungibleTransfer": {
            "destId": "BridgeChainId",
            "nonce": "DepositNonce",
            "resourceId": "ResourceId",
            "amount": "U256",
            "recipient": "Vec<u8>"
        },
        "NonFungibleTransfer": {
            "destId": "BridgeChainId",
            "nonce": "DepositNonce",
            "resourceId": "ResourceId",
            "tokenId": "Vec<u8>",
            "recipient": "Vec<u8>",
            "metadata": "Vec<u8>"
        },
        "GenericTransfer": {
            "destId": "BridgeChainId",
            "nonce": "DepositNonce",
            "resourceId": "ResourceId",
            "metadata": "Vec<u8>"
        },
        "ResourceId": "[u8; 32]",
        "TokenId": "U256",
        "DepositNonce": "u64",
        "ProposalStatus": {
            "_enum": {
                "Initiated": null,
                "Approved": null,
                "Rejected": null
            }
        },
        "ProposalVotes": {
            "votesFor": "Vec<AccountId>",
            "votesAgainst": "Vec<AccountId>",
            "status": "ProposalStatus",
            "expiry": "BlockNumber"
        },
        "AssetInfo": {
            "destId": "BridgeChainId",
            "assetIdentity": "Vec<u8>"
        },
        "ProxyType": {
            "_enum": [
                "Any",
                "NonTransfer",
                "CancelProxy",
                "Governance",
                "Collator",
                "StakePoolManager"
            ]
        },
        "Sr25519PublicKey": "[u8; 32]",
        "MasterPublicKey": "Sr25519PublicKey",
        "WorkerPublicKey": "Sr25519PublicKey",
        "ContractPublicKey": "Sr25519PublicKey",
        "EcdhPublicKey": "[u8; 32]",
        "MessageOrigin": {
            "_enum": {
                "Pallet": "Vec<u8>",
                "Contract": "H256",
                "Worker": "Sr25519PublicKey",
                "AccountId": "H256",
                "MultiLocation": "Vec<u8>",
                "Gatekeeper": null
            }
        },
        "Attestation": {
            "_enum": {
                "SgxIas": "AttestationSgxIas"
            }
        },
        "AttestationSgxIas": {
            "raReport": "Vec<u8>",
            "signature": "Vec<u8>",
            "rawSigningCert": "Vec<u8>"
        },
        "SenderId": "MessageOrigin",
        "Path": "Vec<u8>",
        "Topic": "Path",
        "Message": {
            "sender": "SenderId",
            "destination": "Topic",
            "payload": "Vec<u8>"
        },
        "SignedMessage": {
            "message": "Message",
            "sequence": "u64",
            "signature": "Vec<u8>"
        },
        "WorkerRegistrationInfo": {
            "version": "u32",
            "machineId": "Vec<u8>",
            "pubkey": "WorkerPublicKey",
            "ecdhPubkey": "EcdhPublicKey",
            "genesisBlockHash": "H256",
            "features": "Vec<u32>",
            "operator": "Option<AccountId>"
        },
        "PoolInfo": {
            "pid": "u64",
            "owner": "AccountId",
            "payoutCommission": "Option<Permill>",
            "ownerReward": "Balance",
            "cap": "Option<Balance>",
            "rewardAcc": "u128",
            "totalShares": "Balance",
            "totalStake": "Balance",
            "freeStake": "Balance",
            "releasingStake": "Balance",
            "workers": "Vec<WorkerPublicKey>",
            "withdrawQueue": "Vec<WithdrawInfo>"
        },
        "WithdrawInfo": {
            "user": "AccountId",
            "shares": "Balance",
            "startTime": "u64"
        },
        "WorkerInfo": {
            "pubkey": "WorkerPublicKey",
            "ecdhPubkey": "EcdhPublicKey",
            "runtimeVersion": "u32",
            "lastUpdated": "u64",
            "operator": "Option<AccountId>",
            "confidenceLevel": "u8",
            "initialScore": "Option<u32>",
            "features": "Vec<u32>"
        },
        "MinerInfo": {
            "state": "MinerState",
            "ve": "u128",
            "v": "u128",
            "vUpdatedAt": "u64",
            "benchmark": "Benchmark",
            "coolDownStart": "u64",
            "stats": "MinerStats"
        },
        "Benchmark": {
            "pInit": "u32",
            "pInstant": "u32",
            "iterations": "u64",
            "miningStartTime": "u64",
            "challengeTimeLast": "u64"
        },
        "MinerState": {
            "_enum": {
                "Ready": null,
                "MiningIdle": null,
                "MiningActive": null,
                "MiningUnresponsive": null,
                "MiningCoolingDown": null
            }
        },
        "MinerStats": {
            "totalReward": "Balance"
        },
        "HeartbeatChallenge": {
            "seed": "U256",
            "onlineTarget": "U256"
        },
        "KeyDistribution": {
            "_enum": {
                "MasterKeyDistribution": "DispatchMasterKeyEvent",
            }
        },
        "GatekeeperLaunch": {
            "_enum": {
                "FirstGatekeeper": "NewGatekeeperEvent",
                "MasterPubkeyOnChain": null,
            }
        },
        "GatekeeperChange": {
            "_enum": {
                "GatekeeperRegistered": "NewGatekeeperEvent",
            }
        },
        "GatekeeperEvent": {
            "_enum": {
                "NewRandomNumber": "RandomNumberEvent",
                "TokenomicParametersChanged": "TokenomicParameters"
            }
        },
        "NewGatekeeperEvent": {
            "pubkey": "WorkerPublicKey",
            "ecdhPubkey": "EcdhPublicKey"
        },
        "DispatchMasterKeyEvent": {
            "dest": "WorkerPublicKey",
            "ecdhPubkey": "EcdhPublicKey",
            "encryptedMasterKey": "Vec<u8>",
            "iv": "[u8; 12]"
        },
        "RandomNumberEvent": {
            "blockNumber": "u32",
            "randomNumber": "[u8; 32]",
            "lastRandomNumber": "[u8; 32]"
        },
        "TokenomicParameters": {
            "phaRate": "U64F64Bits",
            "rho": "U64F64Bits",
            "budgetPerBlock": "U64F64Bits",
            "vMax": "U64F64Bits",
            "costK": "U64F64Bits",
            "costB": "U64F64Bits",
            "slashRate": "U64F64Bits",
            "treasuryRatio": "U64F64Bits",
            "heartbeatWindow": "u32",
            "rigK": "U64F64Bits",
            "rigB": "U64F64Bits",
            "re": "U64F64Bits",
            "k": "U64F64Bits",
            "kappa": "U64F64Bits"
        },
        "TokenomicParams": "TokenomicParameters",
        "U64F64Bits": "u128",
        "UserStakeInfo": {
            "user": "AccountId",
            "locked": "Balance",
            "shares": "Balance",
            "availableRewards": "Balance",
            "rewardDebt": "Balance"
        }
    },
    versions: [
        {
            minmax: [0, 10],
            types: {
                "ChainId": "u8"
            }
        }
    ],
    signedExtensions: {
        CheckMqSequence: 'Null'
    }
}
