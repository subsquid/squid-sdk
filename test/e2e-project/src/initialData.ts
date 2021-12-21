import {Store} from "@subsquid/substrate-processor"
import {
    AdditionalData,
    ComplexEntity,
    EventA,
    EventB,
    EventC,
    EventParam,
    HappyPoor,
    Issue,
    IssueCancellation,
    IssuePayment,
    Network,
    SystemEvent
} from "./model"


export async function loadInitialData(store: Store): Promise<void> {
    {
        await store.save(new EventA({
            id: 'a-1',
            inExtrinsic: 'test',
            inBlock: 0,
            network: Network.ALEXANDRIA,
            indexInBlock: 0,
            field1: 'field1',
        }))

        await store.save(new EventB({
            id: 'b-1',
            inExtrinsic: 'test',
            inBlock: 0,
            network: Network.BABYLON,
            indexInBlock: 1,
            field2: 'field2',
            statusList: [new HappyPoor({ isMale: true })],
        }))

        let ce = new ComplexEntity()
        ce.id = 'c-1'
        ce.arg1 = 'xxx'
        ce.arg2 = 'yyy'
        await store.save(ce)

        await store.save(new EventC({
            id: 'c-1',
            inExtrinsic: 'test',
            inBlock: 0,
            network: Network.OLYMPIA,
            indexInBlock: 2,
            field3: 'field3',
            complexField: ce,
        }))
    }

    {
        let e = new SystemEvent({id: 'se-1'})
        let params = new EventParam()
        let additionalData = new AdditionalData()
        additionalData.data = Buffer.from('aabb', 'hex')
        params.name = 'account'
        params.type = 'string'
        params.value = '0x000'
        params.additionalData = [additionalData]
        e.params = params
        e.arrayField = ['aaa', 'bbb', 'ccc']
        await store.save(e)
    }

    {
        let issue1 = new Issue({ id: '1' })
        let issue2 = new Issue({ id: '2' })
        await store.save(issue1)
        await store.save(issue2)

        await store.save(new IssuePayment({
            id: '1',
            issue: issue1,
            amount: 10
        }))

        await store.save(new IssueCancellation({
            id: '2',
            issue: issue2,
            block: 100
        }))
    }
}
