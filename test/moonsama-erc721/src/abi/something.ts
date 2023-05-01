import * as ethers from 'ethers'
import {LogEvent, Func, ContractBase} from './abi.support'
import {ABI_JSON} from './something.abi'

export const abi = new ethers.Interface(ABI_JSON);

export const events = {
    Transfer: new LogEvent<([_from: string, _to: string, _amount: bigint] & {_from: string, _to: string, _amount: bigint})>(
        abi, '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    ),
    Approval: new LogEvent<([_owner: string, _spender: string, _amount: bigint] & {_owner: string, _spender: string, _amount: bigint})>(
        abi, '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'
    ),
    FuelingToDate: new LogEvent<([value: bigint] & {value: bigint})>(
        abi, '0xf381a3e2428fdda36615919e8d9c35878d9eb0cf85ac6edf575088e80e4c147e'
    ),
    CreatedToken: new LogEvent<([to: string, amount: bigint] & {to: string, amount: bigint})>(
        abi, '0xdbccb92686efceafb9bb7e0394df7f58f71b954061b81afb57109bf247d3d75a'
    ),
    Refund: new LogEvent<([to: string, value: bigint] & {to: string, value: bigint})>(
        abi, '0xbb28353e4598c3b9199101a66e0989549b659a59a54d2c27fbb183f1932c8e6d'
    ),
    ProposalAdded: new LogEvent<([proposalID: bigint, recipient: string, amount: bigint, newCurator: boolean, description: string] & {proposalID: bigint, recipient: string, amount: bigint, newCurator: boolean, description: string})>(
        abi, '0x5790de2c279e58269b93b12828f56fd5f2bc8ad15e61ce08572585c81a38756f'
    ),
    Voted: new LogEvent<([proposalID: bigint, position: boolean, voter: string] & {proposalID: bigint, position: boolean, voter: string})>(
        abi, '0x86abfce99b7dd908bec0169288797f85049ec73cbe046ed9de818fab3a497ae0'
    ),
    ProposalTallied: new LogEvent<([proposalID: bigint, result: boolean, quorum: bigint] & {proposalID: bigint, result: boolean, quorum: bigint})>(
        abi, '0xdfc78bdca8e3e0b18c16c5c99323c6cb9eb5e00afde190b4e7273f5158702b07'
    ),
    NewCurator: new LogEvent<([_newCurator: string] & {_newCurator: string})>(
        abi, '0x9046fefd66f538ab35263248a44217dcb70e2eb2cd136629e141b8b8f9f03b60'
    ),
    AllowedRecipientChanged: new LogEvent<([_recipient: string, _allowed: boolean] & {_recipient: string, _allowed: boolean})>(
        abi, '0x73ad2a153c8b67991df9459024950b318a609782cee8c7eeda47b905f9baa91f'
    ),
}

export const functions = {
    proposals: new Func<[_: bigint], {}, ([recipient: string, amount: bigint, description: string, votingDeadline: bigint, open: boolean, proposalPassed: boolean, proposalHash: string, proposalDeposit: bigint, newCurator: boolean, yea: bigint, nay: bigint, creator: string] & {recipient: string, amount: bigint, description: string, votingDeadline: bigint, open: boolean, proposalPassed: boolean, proposalHash: string, proposalDeposit: bigint, newCurator: boolean, yea: bigint, nay: bigint, creator: string})>(
        abi, '0x013cf08b'
    ),
    approve: new Func<[_spender: string, _amount: bigint], {_spender: string, _amount: bigint}, boolean>(
        abi, '0x095ea7b3'
    ),
    minTokensToCreate: new Func<[], {}, bigint>(
        abi, '0x0c3b7b96'
    ),
    rewardAccount: new Func<[], {}, string>(
        abi, '0x0e708203'
    ),
    daoCreator: new Func<[], {}, string>(
        abi, '0x149acf9a'
    ),
    totalSupply: new Func<[], {}, bigint>(
        abi, '0x18160ddd'
    ),
    divisor: new Func<[], {}, bigint>(
        abi, '0x1f2dc5ef'
    ),
    extraBalance: new Func<[], {}, string>(
        abi, '0x21b5b8dd'
    ),
    executeProposal: new Func<[_proposalID: bigint, _transactionData: string], {_proposalID: bigint, _transactionData: string}, boolean>(
        abi, '0x237e9492'
    ),
    transferFrom: new Func<[_from: string, _to: string, _value: bigint], {_from: string, _to: string, _value: bigint}, boolean>(
        abi, '0x23b872dd'
    ),
    unblockMe: new Func<[], {}, boolean>(
        abi, '0x2632bf20'
    ),
    totalRewardToken: new Func<[], {}, bigint>(
        abi, '0x34145808'
    ),
    actualBalance: new Func<[], {}, bigint>(
        abi, '0x39d1f908'
    ),
    closingTime: new Func<[], {}, bigint>(
        abi, '0x4b6753bc'
    ),
    allowedRecipients: new Func<[_: string], {}, boolean>(
        abi, '0x4df6d6cc'
    ),
    transferWithoutReward: new Func<[_to: string, _value: bigint], {_to: string, _value: bigint}, boolean>(
        abi, '0x4e10c3ee'
    ),
    refund: new Func<[], {}, []>(
        abi, '0x590e1ae3'
    ),
    newProposal: new Func<[_recipient: string, _amount: bigint, _description: string, _transactionData: string, _debatingPeriod: bigint, _newCurator: boolean], {_recipient: string, _amount: bigint, _description: string, _transactionData: string, _debatingPeriod: bigint, _newCurator: boolean}, bigint>(
        abi, '0x612e45a3'
    ),
    DAOpaidOut: new Func<[_: string], {}, bigint>(
        abi, '0x643f7cdd'
    ),
    minQuorumDivisor: new Func<[], {}, bigint>(
        abi, '0x674ed066'
    ),
    newContract: new Func<[_newContract: string], {_newContract: string}, []>(
        abi, '0x6837ff1e'
    ),
    balanceOf: new Func<[_owner: string], {_owner: string}, bigint>(
        abi, '0x70a08231'
    ),
    changeAllowedRecipients: new Func<[_recipient: string, _allowed: boolean], {_recipient: string, _allowed: boolean}, boolean>(
        abi, '0x749f9889'
    ),
    halveMinQuorum: new Func<[], {}, boolean>(
        abi, '0x78524b2e'
    ),
    paidOut: new Func<[_: string], {}, bigint>(
        abi, '0x81f03fcb'
    ),
    splitDAO: new Func<[_proposalID: bigint, _newCurator: string], {_proposalID: bigint, _newCurator: string}, boolean>(
        abi, '0x82661dc4'
    ),
    DAOrewardAccount: new Func<[], {}, string>(
        abi, '0x82bf6464'
    ),
    proposalDeposit: new Func<[], {}, bigint>(
        abi, '0x8b15a605'
    ),
    numberOfProposals: new Func<[], {}, bigint>(
        abi, '0x8d7af473'
    ),
    lastTimeMinQuorumMet: new Func<[], {}, bigint>(
        abi, '0x96d7f3f5'
    ),
    retrieveDAOReward: new Func<[_toMembers: boolean], {_toMembers: boolean}, boolean>(
        abi, '0xa1da2fb9'
    ),
    receiveEther: new Func<[], {}, boolean>(
        abi, '0xa3912ec8'
    ),
    transfer: new Func<[_to: string, _value: bigint], {_to: string, _value: bigint}, boolean>(
        abi, '0xa9059cbb'
    ),
    isFueled: new Func<[], {}, boolean>(
        abi, '0xb7bc2c84'
    ),
    createTokenProxy: new Func<[_tokenHolder: string], {_tokenHolder: string}, boolean>(
        abi, '0xbaac5300'
    ),
    getNewDAOAddress: new Func<[_proposalID: bigint], {_proposalID: bigint}, string>(
        abi, '0xbe7c29c1'
    ),
    vote: new Func<[_proposalID: bigint, _supportsProposal: boolean], {_proposalID: bigint, _supportsProposal: boolean}, bigint>(
        abi, '0xc9d27afe'
    ),
    getMyReward: new Func<[], {}, boolean>(
        abi, '0xcc9ae3f6'
    ),
    rewardToken: new Func<[_: string], {}, bigint>(
        abi, '0xcdef91d0'
    ),
    transferFromWithoutReward: new Func<[_from: string, _to: string, _value: bigint], {_from: string, _to: string, _value: bigint}, boolean>(
        abi, '0xdbde1988'
    ),
    allowance: new Func<[_owner: string, _spender: string], {_owner: string, _spender: string}, bigint>(
        abi, '0xdd62ed3e'
    ),
    changeProposalDeposit: new Func<[_proposalDeposit: bigint], {_proposalDeposit: bigint}, []>(
        abi, '0xe33734fd'
    ),
    blocked: new Func<[_: string], {}, bigint>(
        abi, '0xe5962195'
    ),
    curator: new Func<[], {}, string>(
        abi, '0xe66f53b7'
    ),
    checkProposalCode: new Func<[_proposalID: bigint, _recipient: string, _amount: bigint, _transactionData: string], {_proposalID: bigint, _recipient: string, _amount: bigint, _transactionData: string}, boolean>(
        abi, '0xeceb2945'
    ),
    privateCreation: new Func<[], {}, string>(
        abi, '0xf8c80d26'
    ),
}

export class Contract extends ContractBase {
}
