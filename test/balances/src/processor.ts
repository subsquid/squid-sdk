import {SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import {getTransferEvent, TransferEvent} from "./events"
import {Account, HistoricalBalance} from "./model"


new SubstrateBatchProcessor()
    .setBatchSize(500)
    .setDataSource({
        archive: 'https://kusama.archive.subsquid.io/graphql'
    })
    .addEvent('Balances.Transfer', {
        data: {event: {args: true}}
    } as const)
    .run(new TypeormDatabase('kusama_balances'), async ctx => {
        let transfers: TransferEvent[] = []

        for (let block of ctx.blocks) {
            for (let item of block.items) {
                if (item.name == 'Balances.Transfer') {
                    transfers.push(
                        getTransferEvent(item.event, block.header.timestamp)
                    )
                }
            }
        }

        let accountIds = new Set<string>()
        for (let t of transfers) {
            accountIds.add(t.from)
            accountIds.add(t.to)
        }

        let accounts = await ctx.store.findByIds(Account, Array.from(accountIds)).then(accounts => {
            return new Map(accounts.map(a => [a.id, a]))
        })

        let history: HistoricalBalance[] = []

        for (let t of transfers) {
            let from = getAccount(accounts, t.from)
            let to = getAccount(accounts, t.to)

            from.balance -= t.amount
            to.balance += t.amount

            history.push(new HistoricalBalance({
                id: t.id + '-from',
                account: from,
                balance: from.balance,
                timestamp: t.timestamp
            }))

            history.push(new HistoricalBalance({
                id: t.id + '-to',
                account: to,
                balance: to.balance,
                timestamp: t.timestamp
            }))
        }

        await ctx.store.save(Array.from(accounts.values()))
        await ctx.store.save(history)
    })


function getAccount(m: Map<string, Account>, id: string): Account {
    let acc = m.get(id)
    if (acc == null) {
        acc = new Account()
        acc.id = id
        acc.balance = 0n
        m.set(id, acc)
    }
    return acc
}
