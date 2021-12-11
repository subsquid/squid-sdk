/**
 * A service reporting the current intedexer state
 */
export interface IStatusService {
  /**
   * The indexer head is the maximal height X such that all
   * blocks with heights up to X are indexed. Note, that is typically
   * not the same as the maximal indexed height, since the blocks are being
   * indexer simultaneously by multiple workers.
   *
   * @return current indexer head
   */
  getIndexerHead(): Promise<number>

  /**
   * Returns true if the canonical (i.e. finalized) block with height `h` is indexed.
   * Note here it is silently assumed that only finalized blocks are processed, and thus
   * there's always a unique block with given height.
   *
   * @param h - block height
   */
  isComplete(h: number): Promise<boolean>
}
