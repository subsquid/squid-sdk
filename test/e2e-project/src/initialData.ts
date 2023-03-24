import {BigDecimal} from '@subsquid/big-decimal'
import type {Store} from "@subsquid/typeorm-store"
import {
    AdditionalData,
    ComplexEntity,
    EnumInJson,
    EventA,
    EventB,
    EventC,
    EventParam,
    HappyPoor,
    Issue,
    IssueCancellation,
    IssuePayment,
    NestedScalars,
    Network,
    ScalarRaw,
    Vector,
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

    {
        await store.save(new ScalarRaw({
            id: '1',
            float: 0,
            nested: new NestedScalars({float: 0, json: [1, 2, 3], enumInJson: EnumInJson.A}),
            json: {foo: 1},
            bigdecimal: BigDecimal(123, 2)
        }))

        await store.save(new ScalarRaw({
            id: '2',
            float: 0.7,
            nested: new NestedScalars({float: 0.8, bigdecimal: BigDecimal(1, 2)})
        }))
    }

    {
        await store.save(new Vector({
            id: '1',
            bigdecimal: [
                BigDecimal('43547643746896859707690907904.3524688974607909579637673567'),
                BigDecimal('0.00000000000000000000000000000000000036457637724562456326534625623546346')
            ],
            bigint: []
        }))

        await store.save(new Vector({
            id: '2',
            bigdecimal: [
                BigDecimal('-3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173')
            ],
            bigint: [
                -44363467586496785273658476984936472457475262346n
            ]
        }))

        await store.save(new Vector({
            id: '3',
            bigdecimal: [],
            bigint: [
                44363467586496785273658476984936472457475262346n,
                86272327917860857843838279679766814541009538837863609506800642251252051173929848960841284886269456042419652850222106611863067442n
            ]
        }))
    }
}
