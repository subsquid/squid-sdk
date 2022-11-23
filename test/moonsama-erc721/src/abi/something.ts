import * as ethers from 'ethers'
import {LogEvent, Func, ContractBase} from './abi.support'
import {ABI_JSON} from './something.abi'

export const abi = new ethers.utils.Interface(ABI_JSON);

export const events = {
    Transfer: new LogEvent<([_from: string, _to: string, _amount: ethers.BigNumber] & {_from: string, _to: string, _amount: ethers.BigNumber})>(
        abi, '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    ),
    Approval: new LogEvent<([_owner: string, _spender: string, _amount: ethers.BigNumber] & {_owner: string, _spender: string, _amount: ethers.BigNumber})>(
        abi, '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'
    ),
    FuelingToDate: new LogEvent<([value: ethers.BigNumber] & {value: ethers.BigNumber})>(
        abi, '0xf381a3e2428fdda36615919e8d9c35878d9eb0cf85ac6edf575088e80e4c147e'
    ),
    CreatedToken: new LogEvent<([to: string, amount: ethers.BigNumber] & {to: string, amount: ethers.BigNumber})>(
        abi, '0xdbccb92686efceafb9bb7e0394df7f58f71b954061b81afb57109bf247d3d75a'
    ),
    Refund: new LogEvent<([to: string, value: ethers.BigNumber] & {to: string, value: ethers.BigNumber})>(
        abi, '0xbb28353e4598c3b9199101a66e0989549b659a59a54d2c27fbb183f1932c8e6d'
    ),
    ProposalAdded: new LogEvent<([proposalID: ethers.BigNumber, recipient: string, amount: ethers.BigNumber, newCurator: boolean, description: string] & {proposalID: ethers.BigNumber, recipient: string, amount: ethers.BigNumber, newCurator: boolean, description: string})>(
        abi, '0x5790de2c279e58269b93b12828f56fd5f2bc8ad15e61ce08572585c81a38756f'
    ),
    Voted: new LogEvent<([proposalID: ethers.BigNumber, position: boolean, voter: string] & {proposalID: ethers.BigNumber, position: boolean, voter: string})>(
        abi, '0x86abfce99b7dd908bec0169288797f85049ec73cbe046ed9de818fab3a497ae0'
    ),
    ProposalTallied: new LogEvent<([proposalID: ethers.BigNumber, result: boolean, quorum: ethers.BigNumber] & {proposalID: ethers.BigNumber, result: boolean, quorum: ethers.BigNumber})>(
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
    proposals: new Func<[ethers.BigNumber], {}, ([recipient: string, amount: ethers.BigNumber, description: string, votingDeadline: ethers.BigNumber, open: boolean, proposalPassed: boolean, proposalHash: string, proposalDeposit: ethers.BigNumber, newCurator: boolean, yea: ethers.BigNumber, nay: ethers.BigNumber, creator: string] & {recipient: string, amount: ethers.BigNumber, description: string, votingDeadline: ethers.BigNumber, open: boolean, proposalPassed: boolean, proposalHash: string, proposalDeposit: ethers.BigNumber, newCurator: boolean, yea: ethers.BigNumber, nay: ethers.BigNumber, creator: string})>(
        abi, '0x013cf08b'
    ),
    approve: new Func<[_spender: string, _amount: ethers.BigNumber], {_spender: string, _amount: ethers.BigNumber}, boolean>(
        abi, '0x095ea7b3'
    ),
    minTokensToCreate: new Func<[], {}, ethers.BigNumber>(
        abi, '0x0c3b7b96'
    ),
    rewardAccount: new Func<[], {}, string>(
        abi, '0x0e708203'
    ),
    daoCreator: new Func<[], {}, string>(
        abi, '0x149acf9a'
    ),
    totalSupply: new Func<[], {}, ethers.BigNumber>(
        abi, '0x18160ddd'
    ),
    divisor: new Func<[], {}, ethers.BigNumber>(
        abi, '0x1f2dc5ef'
    ),
    extraBalance: new Func<[], {}, string>(
        abi, '0x21b5b8dd'
    ),
    executeProposal: new Func<[_proposalID: ethers.BigNumber, _transactionData: string], {_proposalID: ethers.BigNumber, _transactionData: string}, boolean>(
        abi, '0x237e9492'
    ),
    transferFrom: new Func<[_from: string, _to: string, _value: ethers.BigNumber], {_from: string, _to: string, _value: ethers.BigNumber}, boolean>(
        abi, '0x23b872dd'
    ),
    unblockMe: new Func<[], {}, boolean>(
        abi, '0x2632bf20'
    ),
    totalRewardToken: new Func<[], {}, ethers.BigNumber>(
        abi, '0x34145808'
    ),
    actualBalance: new Func<[], {}, ethers.BigNumber>(
        abi, '0x39d1f908'
    ),
    closingTime: new Func<[], {}, ethers.BigNumber>(
        abi, '0x4b6753bc'
    ),
    allowedRecipients: new Func<[string], {}, boolean>(
        abi, '0x4df6d6cc'
    ),
    transferWithoutReward: new Func<[_to: string, _value: ethers.BigNumber], {_to: string, _value: ethers.BigNumber}, boolean>(
        abi, '0x4e10c3ee'
    ),
    refund: new Func<[], {}, []>(
        abi, '0x590e1ae3'
    ),
    newProposal: new Func<[_recipient: string, _amount: ethers.BigNumber, _description: string, _transactionData: string, _debatingPeriod: ethers.BigNumber, _newCurator: boolean], {_recipient: string, _amount: ethers.BigNumber, _description: string, _transactionData: string, _debatingPeriod: ethers.BigNumber, _newCurator: boolean}, ethers.BigNumber>(
        abi, '0x612e45a3'
    ),
    DAOpaidOut: new Func<[string], {}, ethers.BigNumber>(
        abi, '0x643f7cdd'
    ),
    minQuorumDivisor: new Func<[], {}, ethers.BigNumber>(
        abi, '0x674ed066'
    ),
    newContract: new Func<[_newContract: string], {_newContract: string}, []>(
        abi, '0x6837ff1e'
    ),
    balanceOf: new Func<[_owner: string], {_owner: string}, ethers.BigNumber>(
        abi, '0x70a08231'
    ),
    changeAllowedRecipients: new Func<[_recipient: string, _allowed: boolean], {_recipient: string, _allowed: boolean}, boolean>(
        abi, '0x749f9889'
    ),
    halveMinQuorum: new Func<[], {}, boolean>(
        abi, '0x78524b2e'
    ),
    paidOut: new Func<[string], {}, ethers.BigNumber>(
        abi, '0x81f03fcb'
    ),
    splitDAO: new Func<[_proposalID: ethers.BigNumber, _newCurator: string], {_proposalID: ethers.BigNumber, _newCurator: string}, boolean>(
        abi, '0x82661dc4'
    ),
    DAOrewardAccount: new Func<[], {}, string>(
        abi, '0x82bf6464'
    ),
    proposalDeposit: new Func<[], {}, ethers.BigNumber>(
        abi, '0x8b15a605'
    ),
    numberOfProposals: new Func<[], {}, ethers.BigNumber>(
        abi, '0x8d7af473'
    ),
    lastTimeMinQuorumMet: new Func<[], {}, ethers.BigNumber>(
        abi, '0x96d7f3f5'
    ),
    retrieveDAOReward: new Func<[_toMembers: boolean], {_toMembers: boolean}, boolean>(
        abi, '0xa1da2fb9'
    ),
    receiveEther: new Func<[], {}, boolean>(
        abi, '0xa3912ec8'
    ),
    transfer: new Func<[_to: string, _value: ethers.BigNumber], {_to: string, _value: ethers.BigNumber}, boolean>(
        abi, '0xa9059cbb'
    ),
    isFueled: new Func<[], {}, boolean>(
        abi, '0xb7bc2c84'
    ),
    createTokenProxy: new Func<[_tokenHolder: string], {_tokenHolder: string}, boolean>(
        abi, '0xbaac5300'
    ),
    getNewDAOAddress: new Func<[_proposalID: ethers.BigNumber], {_proposalID: ethers.BigNumber}, string>(
        abi, '0xbe7c29c1'
    ),
    vote: new Func<[_proposalID: ethers.BigNumber, _supportsProposal: boolean], {_proposalID: ethers.BigNumber, _supportsProposal: boolean}, ethers.BigNumber>(
        abi, '0xc9d27afe'
    ),
    getMyReward: new Func<[], {}, boolean>(
        abi, '0xcc9ae3f6'
    ),
    rewardToken: new Func<[string], {}, ethers.BigNumber>(
        abi, '0xcdef91d0'
    ),
    transferFromWithoutReward: new Func<[_from: string, _to: string, _value: ethers.BigNumber], {_from: string, _to: string, _value: ethers.BigNumber}, boolean>(
        abi, '0xdbde1988'
    ),
    allowance: new Func<[_owner: string, _spender: string], {_owner: string, _spender: string}, ethers.BigNumber>(
        abi, '0xdd62ed3e'
    ),
    changeProposalDeposit: new Func<[_proposalDeposit: ethers.BigNumber], {_proposalDeposit: ethers.BigNumber}, []>(
        abi, '0xe33734fd'
    ),
    blocked: new Func<[string], {}, ethers.BigNumber>(
        abi, '0xe5962195'
    ),
    curator: new Func<[], {}, string>(
        abi, '0xe66f53b7'
    ),
    checkProposalCode: new Func<[_proposalID: ethers.BigNumber, _recipient: string, _amount: ethers.BigNumber, _transactionData: string], {_proposalID: ethers.BigNumber, _recipient: string, _amount: ethers.BigNumber, _transactionData: string}, boolean>(
        abi, '0xeceb2945'
    ),
    privateCreation: new Func<[], {}, string>(
        abi, '0xf8c80d26'
    ),
}

export class Contract extends ContractBase {

    proposals(arg0: ethers.BigNumber): Promise<([recipient: string, amount: ethers.BigNumber, description: string, votingDeadline: ethers.BigNumber, open: boolean, proposalPassed: boolean, proposalHash: string, proposalDeposit: ethers.BigNumber, newCurator: boolean, yea: ethers.BigNumber, nay: ethers.BigNumber, creator: string] & {recipient: string, amount: ethers.BigNumber, description: string, votingDeadline: ethers.BigNumber, open: boolean, proposalPassed: boolean, proposalHash: string, proposalDeposit: ethers.BigNumber, newCurator: boolean, yea: ethers.BigNumber, nay: ethers.BigNumber, creator: string})> {
        return this.eth_call(functions.proposals, [arg0])
    }

    minTokensToCreate(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.minTokensToCreate, [])
    }

    rewardAccount(): Promise<string> {
        return this.eth_call(functions.rewardAccount, [])
    }

    daoCreator(): Promise<string> {
        return this.eth_call(functions.daoCreator, [])
    }

    totalSupply(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.totalSupply, [])
    }

    divisor(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.divisor, [])
    }

    extraBalance(): Promise<string> {
        return this.eth_call(functions.extraBalance, [])
    }

    totalRewardToken(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.totalRewardToken, [])
    }

    actualBalance(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.actualBalance, [])
    }

    closingTime(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.closingTime, [])
    }

    allowedRecipients(arg0: string): Promise<boolean> {
        return this.eth_call(functions.allowedRecipients, [arg0])
    }

    DAOpaidOut(arg0: string): Promise<ethers.BigNumber> {
        return this.eth_call(functions.DAOpaidOut, [arg0])
    }

    minQuorumDivisor(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.minQuorumDivisor, [])
    }

    balanceOf(_owner: string): Promise<ethers.BigNumber> {
        return this.eth_call(functions.balanceOf, [_owner])
    }

    paidOut(arg0: string): Promise<ethers.BigNumber> {
        return this.eth_call(functions.paidOut, [arg0])
    }

    DAOrewardAccount(): Promise<string> {
        return this.eth_call(functions.DAOrewardAccount, [])
    }

    proposalDeposit(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.proposalDeposit, [])
    }

    numberOfProposals(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.numberOfProposals, [])
    }

    lastTimeMinQuorumMet(): Promise<ethers.BigNumber> {
        return this.eth_call(functions.lastTimeMinQuorumMet, [])
    }

    isFueled(): Promise<boolean> {
        return this.eth_call(functions.isFueled, [])
    }

    getNewDAOAddress(_proposalID: ethers.BigNumber): Promise<string> {
        return this.eth_call(functions.getNewDAOAddress, [_proposalID])
    }

    rewardToken(arg0: string): Promise<ethers.BigNumber> {
        return this.eth_call(functions.rewardToken, [arg0])
    }

    allowance(_owner: string, _spender: string): Promise<ethers.BigNumber> {
        return this.eth_call(functions.allowance, [_owner, _spender])
    }

    blocked(arg0: string): Promise<ethers.BigNumber> {
        return this.eth_call(functions.blocked, [arg0])
    }

    curator(): Promise<string> {
        return this.eth_call(functions.curator, [])
    }

    checkProposalCode(_proposalID: ethers.BigNumber, _recipient: string, _amount: ethers.BigNumber, _transactionData: string): Promise<boolean> {
        return this.eth_call(functions.checkProposalCode, [_proposalID, _recipient, _amount, _transactionData])
    }

    privateCreation(): Promise<string> {
        return this.eth_call(functions.privateCreation, [])
    }
}
