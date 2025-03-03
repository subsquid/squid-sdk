import {Base58Bytes} from '@subsquid/solana-rpc-data'
import * as norm from './data'


/**
 * Block account index
 */
export type AccountIndex = number


export interface Block {
    header: BlockHeader
    accounts: Base58Bytes[]
    transactions: Transaction[]
    instructions: Instruction[]
    logs: LogMessage[]
    balances: Balance[]
    tokenBalances: TokenBalance[]
    rewards: Reward[]
}


export interface BlockHeader {
    number: number
    hash: string
    parentNumber: number
    parentHash: string
    height?: number
    timestamp?: number
}


export type Transaction = Omit<norm.Transaction, 'accountKeys' | 'addressTableLookups' | 'loadedAddresses'> & {
    accountKeys: AccountIndex[]
    addressTableLookups: AddressTableLookup[]
    loadedAddresses: {
        readonly: AccountIndex[]
        writable: AccountIndex[]
    }
}


export interface AddressTableLookup {
    accountKey: AccountIndex
    readonlyIndexes: number[]
    writableIndexes: number[]
}


export type Instruction = Omit<norm.Instruction, 'programId' | 'accounts'> & {
    programId: AccountIndex
    accounts: AccountIndex[]
}


export type LogMessage = Omit<norm.LogMessage, 'programId'> & {
    programId: AccountIndex
}


export type Balance = Omit<norm.Balance, 'account'> & {
    account: AccountIndex
}


export type TokenBalance = PatchAccounts<norm.TokenBalance>


type PatchAccounts<T> = {
    [K in keyof T]: T[K] extends string ? AccountIndex : T[K]
}


export type Reward = Omit<norm.Reward, 'pubkey'> & {
    pubkey: AccountIndex
}


export function toArchiveBlock(block: norm.Block): Block {
    let dict = new AccountDict()

    let {
        header: {number: slot, parentNumber: parentSlot, ...hdr}
    } = block

    let header = {
        number: slot,
        parentNumber: parentSlot,
        ...hdr
    }

    let transactions = block.transactions.map(tx => {
        let {accountKeys, addressTableLookups, loadedAddresses, ...props} = tx
        return {
            ...props,
            accountKeys: accountKeys.map(a => dict.get(a)),
            addressTableLookups: addressTableLookups.map(lookup => {
                return {
                    accountKey: dict.get(lookup.accountKey),
                    readonlyIndexes: lookup.readonlyIndexes,
                    writableIndexes: lookup.writableIndexes
                }
            }),
            loadedAddresses: {
                readonly: loadedAddresses.readonly.map(a => dict.get(a)),
                writable: loadedAddresses.writable.map(a => dict.get(a))
            }
        }
    })

    let instructions = block.instructions.map(ins => {
        let {programId, accounts, ...props} = ins
        return {
            ...props,
            programId: dict.get(programId),
            accounts: accounts.map(a => dict.get(a))
        }
    })

    let logs = block.logs.map(rec => {
        let {programId, ...props} = rec
        return {
            ...props,
            programId: dict.get(programId)
        }
    })

    let balances = block.balances.map(b => {
        let {account, ...props} = b
        return {
            ...props,
            account: dict.get(account)
        }
    })

    let tokenBalances: TokenBalance[] = block.tokenBalances.map(b => {
        let res: any = {}
        let key: keyof norm.TokenBalance
        for (key in b) {
            let val = b[key]
            if (typeof val == 'string') {
                res[key] = dict.get(val)
            } else {
                res[key] = val
            }
        }
        return res
    })

    let rewards = block.rewards.map(reward => {
        let {pubkey, ...props} = reward
        return {
            pubkey: dict.get(pubkey),
            ...props
        }
    })

    return {
        header,
        accounts: dict.list(),
        transactions,
        instructions,
        logs,
        balances,
        tokenBalances,
        rewards
    }
}


class AccountDict {
    private map = new Map<Base58Bytes, AccountIndex>

    get(account: Base58Bytes): AccountIndex {
        let idx = this.map.get(account)
        if (idx == null) {
            idx = this.map.size
            this.map.set(account, idx)
        }
        return idx
    }

    list(): Base58Bytes[] {
        return Array.from(this.map.keys())
    }
}
