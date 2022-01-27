import EventEmitter from 'events'

export const eventEmitter = new EventEmitter()

export enum IndexerEvents {
  // NEW_BLOCK_ARRIVED = 'NEW_BLOCK_ARRIVED', // when a new block has arrived
  INDEXER_STOP = 'NODE_STOP', // emitted when the indexer is stopping
  NEW_FINALIZED_HEAD = 'NEW_FINALIZED_HEAD', // new block has been finalized
  NEW_BEST_HEAD = 'NEW_BEST_HEAD', // new block has been finalized
  NEW_HEAD = 'NEW_HEAD', // emitted from a subscription to all heads
  API_CONNECTED = 'API_CONNECTED', // api has been (re)-connected
  BLOCK_COMPLETED = 'BLOCK_COMPLETED', // a full block hash been successfully saved
  BLOCK_STARTED = 'BLOCK_STARTED', // block processing started
}
