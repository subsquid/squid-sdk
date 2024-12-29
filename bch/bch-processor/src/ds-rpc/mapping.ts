import {addErrorContext} from '@subsquid/util-internal'
import {cast} from '@subsquid/util-internal-validation'
import {
    Block,
    BlockHeader,
    Transaction
} from '../mapping/entities.js'
import {setUpRelations} from '../mapping/relations.js'
import {filterBlock} from './filter.js'
import {MappingRequest} from './request.js'
import {Block as RpcBlock} from './rpc-data.js'
import {getBlockValidator} from './schema.js'


export function mapBlock(rpcBlock: RpcBlock, req: MappingRequest): Block {
    try {
        return tryMapBlock(rpcBlock, req)
    } catch(err: any) {
        throw addErrorContext(err, {
            blockHash: rpcBlock.hash,
            blockHeight: rpcBlock.height
        })
    }
}


function tryMapBlock(rpcBlock: RpcBlock, req: MappingRequest): Block {
    let src = cast(getBlockValidator(req), rpcBlock)

    let {height, hash, parentHash, transactions, ...headerProps} = src.block
    if (headerProps.timestamp) {
        headerProps.timestamp = headerProps.timestamp * 1000 // convert to ms
    }

    let header = new BlockHeader(height, hash, parentHash)
    Object.assign(header, headerProps)

    let block = new Block(header)

    if (req.transactionList) {
        for (let i = 0; i < transactions.length; i++) {
            let stx = transactions[i]
            let tx = new Transaction(header, i)
            if (typeof stx == 'string') {
                if (req.fields.transaction?.hash) {
                    tx.hash = stx
                }
            } else {
                let {...props} = stx
                Object.assign(tx, props)
            }
            block.transactions.push(tx)
        }
    }

    setUpRelations(block)
    filterBlock(block, req.dataRequest)

    return block
}
