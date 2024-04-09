import { OldTypesBundle } from "../types"

export const bundle: OldTypesBundle = {
    types: {},
    versions: [
        {
          minmax: [0, null],
          types: {
            Keys: 'AccountId',
            Address: 'MultiAddress',
            LookupSource: 'MultiAddress',
            AmountOf: 'Amount',
            Amount: 'i128',
            SmartContract: {
              _enum: {
                Evm: 'H160',
                Wasm: 'AccountId'
              }
            },
            EraStakingPoints: {
              total: 'Balance',
              stakers: 'BTreeMap<AccountId, Balance>',
              formerStakedEra: 'EraIndex',
              claimedRewards: 'Balance'
            },
            EraRewardAndStake: {
              rewards: 'Balance',
              staked: 'Balance'
            },
            EraIndex: 'u32'
          }
        }
      ]
}