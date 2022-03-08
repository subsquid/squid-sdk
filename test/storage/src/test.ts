import {ApiPromise, WsProvider} from "@polkadot/api"


async function main(): Promise<void> {
    let api = await ApiPromise.create({
        provider: new WsProvider('wss://kusama-rpc.polkadot.io')
    })

    let account = await api.query.balances.account('F3opxRbN5ZbbNGg1tmxQQt5JsP3D9GHi1r9NkDLQfb1Gqv8')
    console.log(account)
}

main().then(
    () => process.exit(0),
    err => {
        console.log(err)
        process.exit(1)
    }
)
