import expect from "expect"
import {parse, print, Type} from "./typeExp"

describe('Type expressions', function () {
    function ast(exp: string, type: Type): void {
        it('AST: ' + exp, () => {
            let parsed = parse(exp)
            expect(parsed).toEqual(type)
        })
    }

    function test(exp: string, result?: string): void {
        it(result ? exp + ' -> ' + result : exp, () => {
            let type = parse(exp)
            let printed = print(type)
            expect(printed).toEqual(result || exp)
        })
    }

    ast('A', {
        kind: 'named',
        name: 'A',
        params: []
    })

    ast('Vec<u8>', {
        kind: 'named',
        name: 'Vec',
        params: [{
            kind: 'named',
            name: 'u8',
            params: []
        }]
    })

    ast('[A; 10]', {
        kind: 'array',
        item: {
            kind: 'named',
            name: 'A',
            params: []
        },
        len: 10
    })

    ast('[u8; 16; H128]', {
        kind: 'array',
        item: {
            kind: 'named',
            name: 'u8',
            params: []
        },
        len: 16
    })

    ast('(A, B, [u8; 5])', {
        kind: 'tuple',
        params: [
            {
                kind: 'named',
                name: 'A',
                params: []
            },
            {
                kind: 'named',
                name: 'B',
                params: []
            },
            {
                kind: 'array',
                item: {
                    kind: 'named',
                    name: 'u8',
                    params: []
                },
                len: 5
            }
        ]
    })

    test('A')
    test('Vec<u8>')
    test('[A; 20]')
    test('(A, B, C, [Foo; 5])')
    test('Vec<(NominatorIndex, [CompactScore; 0], ValidatorIndex)>')
    test('Result<(), DispatchError>')

    test('<T::InherentOfflineReport as InherentOfflineReport>::Inherent', 'InherentOfflineReport')
    test('<T::Balance as HasCompact>', 'Compact<Balance>')
    test('<T as Trait<I>>::Proposal', 'Proposal')
    test('rstd::marker::PhantomData<(AccountId, Event)>', 'PhantomData<(AccountId, Event)>')

    test(
        'Vec<(T::AccountId,<<T as pallet_proxy::Config>::Currency as frame_support::traits::Currency<<T as frame_system::Config>::AccountId,>>::Balance, (BoundedVec<ProxyDefinition<T::AccountId, T::ProxyType, T::BlockNumber>,<T as pallet_proxy::Config>::MaxProxies,>,<<T as pallet_proxy::Config>::Currency as frame_support::traits::Currency<<T as frame_system::Config>::AccountId,>>::Balance,),)>',
        'Vec<(AccountId, Balance, (BoundedVec<ProxyDefinition<AccountId, ProxyType, BlockNumber>, MaxProxies>, Balance))>'
    )

    test('EthHeaderBrief::<T::AccountId>', 'EthHeaderBrief<AccountId>')
})




