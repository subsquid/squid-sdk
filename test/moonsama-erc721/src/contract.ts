import {assertNotNull} from "@subsquid/substrate-processor"
import type {Store} from "@subsquid/typeorm-store"
import {Contract} from "./model"

export const contractAddress = '0xb654611f84a8dc429ba3cb4fda9fad236c505a1a'

export function createContractEntity(): Contract {
    return new Contract({
        id: contractAddress,
        name: 'Moonsama',
        symbol: 'MSAMA',
        totalSupply: 1000n
    })
}


let contractEntity: Contract | undefined


export async function getContractEntity({store}: {store: Store}): Promise<Contract> {
    if (contractEntity == null) {
        contractEntity = await store.get(Contract, contractAddress)
    }
    return assertNotNull(contractEntity)
}
