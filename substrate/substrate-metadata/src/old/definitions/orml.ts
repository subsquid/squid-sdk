import { OldTypeDefinition, OldTypesAlias } from "../types";

export const ormlTypes: Record<string, OldTypeDefinition> = {
    CallOf: 'Call',
      DispatchTime: {
        _enum: {
          At: 'BlockNumber',
          After: 'BlockNumber'
        }
      },
      ScheduleTaskIndex: 'u32',
      DelayedOrigin: {
        delay: 'BlockNumber',
        origin: 'PalletsOrigin'
      },
      AuthorityOrigin: 'DelayedOrigin',
      StorageValue: 'Vec<u8>',
      GraduallyUpdate: {
        key: 'StorageKey',
        targetValue: 'StorageValue',
        perBlock: 'StorageValue'
      },
      StorageKeyBytes: 'Vec<u8>',
      StorageValueBytes: 'Vec<u8>',
      RpcDataProviderId: 'Text',
      DataProviderId: 'u8',
      TimestampedValue: {
        value: 'OracleValue',
        timestamp: 'Moment'
      },
      TimestampedValueOf: 'TimestampedValue',
      OrderedSet: 'Vec<AccountId>',
      OrmlCurrencyId: 'u8',
      PoolInfo: {
        totalShares: 'Share',
        rewards: 'BTreeMap<OrmlCurrencyId, (Balance, Balance)>'
      },
      CompactBalance: 'Compact<Balance>',
      PoolInfoV0: {
        totalShares: 'Compact<Share>',
        totalRewards: 'CompactBalance',
        totalWithdrawnRewards: 'CompactBalance'
      },
      Share: 'u128',
      OracleValue: 'FixedU128',
      OrmlAccountData: {
        free: 'Balance',
        reserved: 'Balance',
        frozen: 'Balance'
      },
      OrmlBalanceLock: {
        amount: 'Balance',
        id: 'LockIdentifier'
      },
      AuctionInfo: {
        bid: 'Option<(AccountId, Balance)>',
        start: 'BlockNumber',
        end: 'Option<BlockNumber>'
      },
      DelayedDispatchTime: {
        _enum: {
          At: 'BlockNumber',
          After: 'BlockNumber'
        }
      },
      DispatchId: 'u32',
      Price: 'FixedU128',
      OrmlVestingSchedule: {
        start: 'BlockNumber',
        period: 'BlockNumber',
        periodCount: 'u32',
        perPeriod: 'Compact<Balance>'
      },
      VestingScheduleOf: 'OrmlVestingSchedule'
  }

export const ormlAlias: OldTypesAlias = {
    tokens: {
        AccountData: 'OrmlAccountData',
        BalanceLock: 'OrmlBalanceLock'
    }
}
