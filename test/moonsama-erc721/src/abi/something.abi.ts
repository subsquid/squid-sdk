export const ABI_JSON = [
    {
        "type": "function",
        "name": "proposals",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256"
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": "recipient"
            },
            {
                "type": "uint256",
                "name": "amount"
            },
            {
                "type": "string",
                "name": "description"
            },
            {
                "type": "uint256",
                "name": "votingDeadline"
            },
            {
                "type": "bool",
                "name": "open"
            },
            {
                "type": "bool",
                "name": "proposalPassed"
            },
            {
                "type": "bytes32",
                "name": "proposalHash"
            },
            {
                "type": "uint256",
                "name": "proposalDeposit"
            },
            {
                "type": "bool",
                "name": "newCurator"
            },
            {
                "type": "uint256",
                "name": "yea"
            },
            {
                "type": "uint256",
                "name": "nay"
            },
            {
                "type": "address",
                "name": "creator"
            }
        ]
    },
    {
        "type": "function",
        "name": "approve",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_spender"
            },
            {
                "type": "uint256",
                "name": "_amount"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "success"
            }
        ]
    },
    {
        "type": "function",
        "name": "minTokensToCreate",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "rewardAccount",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address"
            }
        ]
    },
    {
        "type": "function",
        "name": "daoCreator",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address"
            }
        ]
    },
    {
        "type": "function",
        "name": "totalSupply",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "divisor",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": "divisor"
            }
        ]
    },
    {
        "type": "function",
        "name": "extraBalance",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address"
            }
        ]
    },
    {
        "type": "function",
        "name": "executeProposal",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "_proposalID"
            },
            {
                "type": "bytes",
                "name": "_transactionData"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "_success"
            }
        ]
    },
    {
        "type": "function",
        "name": "transferFrom",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_from"
            },
            {
                "type": "address",
                "name": "_to"
            },
            {
                "type": "uint256",
                "name": "_value"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "success"
            }
        ]
    },
    {
        "type": "function",
        "name": "unblockMe",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "bool"
            }
        ]
    },
    {
        "type": "function",
        "name": "totalRewardToken",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "actualBalance",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": "_actualBalance"
            }
        ]
    },
    {
        "type": "function",
        "name": "closingTime",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "allowedRecipients",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address"
            }
        ],
        "outputs": [
            {
                "type": "bool"
            }
        ]
    },
    {
        "type": "function",
        "name": "transferWithoutReward",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_to"
            },
            {
                "type": "uint256",
                "name": "_value"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "success"
            }
        ]
    },
    {
        "type": "function",
        "name": "refund",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": []
    },
    {
        "type": "function",
        "name": "newProposal",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_recipient"
            },
            {
                "type": "uint256",
                "name": "_amount"
            },
            {
                "type": "string",
                "name": "_description"
            },
            {
                "type": "bytes",
                "name": "_transactionData"
            },
            {
                "type": "uint256",
                "name": "_debatingPeriod"
            },
            {
                "type": "bool",
                "name": "_newCurator"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": "_proposalID"
            }
        ]
    },
    {
        "type": "function",
        "name": "DAOpaidOut",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address"
            }
        ],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "minQuorumDivisor",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "newContract",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_newContract"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "balanceOf",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_owner"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": "balance"
            }
        ]
    },
    {
        "type": "function",
        "name": "changeAllowedRecipients",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_recipient"
            },
            {
                "type": "bool",
                "name": "_allowed"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "_success"
            }
        ]
    },
    {
        "type": "function",
        "name": "halveMinQuorum",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "bool",
                "name": "_success"
            }
        ]
    },
    {
        "type": "function",
        "name": "paidOut",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address"
            }
        ],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "splitDAO",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "_proposalID"
            },
            {
                "type": "address",
                "name": "_newCurator"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "_success"
            }
        ]
    },
    {
        "type": "function",
        "name": "DAOrewardAccount",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address"
            }
        ]
    },
    {
        "type": "function",
        "name": "proposalDeposit",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "numberOfProposals",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": "_numberOfProposals"
            }
        ]
    },
    {
        "type": "function",
        "name": "lastTimeMinQuorumMet",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "retrieveDAOReward",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "bool",
                "name": "_toMembers"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "_success"
            }
        ]
    },
    {
        "type": "function",
        "name": "receiveEther",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "bool"
            }
        ]
    },
    {
        "type": "function",
        "name": "transfer",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_to"
            },
            {
                "type": "uint256",
                "name": "_value"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "success"
            }
        ]
    },
    {
        "type": "function",
        "name": "isFueled",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "bool"
            }
        ]
    },
    {
        "type": "function",
        "name": "createTokenProxy",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_tokenHolder"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "success"
            }
        ]
    },
    {
        "type": "function",
        "name": "getNewDAOAddress",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "_proposalID"
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": "_newDAO"
            }
        ]
    },
    {
        "type": "function",
        "name": "vote",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "_proposalID"
            },
            {
                "type": "bool",
                "name": "_supportsProposal"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": "_voteID"
            }
        ]
    },
    {
        "type": "function",
        "name": "getMyReward",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "bool",
                "name": "_success"
            }
        ]
    },
    {
        "type": "function",
        "name": "rewardToken",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address"
            }
        ],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "transferFromWithoutReward",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_from"
            },
            {
                "type": "address",
                "name": "_to"
            },
            {
                "type": "uint256",
                "name": "_value"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "success"
            }
        ]
    },
    {
        "type": "function",
        "name": "allowance",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_owner"
            },
            {
                "type": "address",
                "name": "_spender"
            }
        ],
        "outputs": [
            {
                "type": "uint256",
                "name": "remaining"
            }
        ]
    },
    {
        "type": "function",
        "name": "changeProposalDeposit",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "_proposalDeposit"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "blocked",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address"
            }
        ],
        "outputs": [
            {
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "curator",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address"
            }
        ]
    },
    {
        "type": "function",
        "name": "checkProposalCode",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": "_proposalID"
            },
            {
                "type": "address",
                "name": "_recipient"
            },
            {
                "type": "uint256",
                "name": "_amount"
            },
            {
                "type": "bytes",
                "name": "_transactionData"
            }
        ],
        "outputs": [
            {
                "type": "bool",
                "name": "_codeChecksOut"
            }
        ]
    },
    {
        "type": "function",
        "name": "privateCreation",
        "constant": false,
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address"
            }
        ]
    },
    {
        "type": "constructor",
        "stateMutability": "undefined",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_curator"
            },
            {
                "type": "address",
                "name": "_daoCreator"
            },
            {
                "type": "uint256",
                "name": "_proposalDeposit"
            },
            {
                "type": "uint256",
                "name": "_minTokensToCreate"
            },
            {
                "type": "uint256",
                "name": "_closingTime"
            },
            {
                "type": "address",
                "name": "_privateCreation"
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "Transfer",
        "inputs": [
            {
                "type": "address",
                "name": "_from",
                "indexed": true
            },
            {
                "type": "address",
                "name": "_to",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "_amount",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "Approval",
        "inputs": [
            {
                "type": "address",
                "name": "_owner",
                "indexed": true
            },
            {
                "type": "address",
                "name": "_spender",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "_amount",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "FuelingToDate",
        "inputs": [
            {
                "type": "uint256",
                "name": "value",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "CreatedToken",
        "inputs": [
            {
                "type": "address",
                "name": "to",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "amount",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "Refund",
        "inputs": [
            {
                "type": "address",
                "name": "to",
                "indexed": true
            },
            {
                "type": "uint256",
                "name": "value",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ProposalAdded",
        "inputs": [
            {
                "type": "uint256",
                "name": "proposalID",
                "indexed": true
            },
            {
                "type": "address",
                "name": "recipient",
                "indexed": false
            },
            {
                "type": "uint256",
                "name": "amount",
                "indexed": false
            },
            {
                "type": "bool",
                "name": "newCurator",
                "indexed": false
            },
            {
                "type": "string",
                "name": "description",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "Voted",
        "inputs": [
            {
                "type": "uint256",
                "name": "proposalID",
                "indexed": true
            },
            {
                "type": "bool",
                "name": "position",
                "indexed": false
            },
            {
                "type": "address",
                "name": "voter",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "ProposalTallied",
        "inputs": [
            {
                "type": "uint256",
                "name": "proposalID",
                "indexed": true
            },
            {
                "type": "bool",
                "name": "result",
                "indexed": false
            },
            {
                "type": "uint256",
                "name": "quorum",
                "indexed": false
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "NewCurator",
        "inputs": [
            {
                "type": "address",
                "name": "_newCurator",
                "indexed": true
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "AllowedRecipientChanged",
        "inputs": [
            {
                "type": "address",
                "name": "_recipient",
                "indexed": true
            },
            {
                "type": "bool",
                "name": "_allowed",
                "indexed": false
            }
        ]
    }
]
