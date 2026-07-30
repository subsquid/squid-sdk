/**
 * SQL for the orphan-repair pass that {@link TypeormDatabase.connect} runs
 * inside its init transaction.
 *
 * These statements are anti-joins, and they are deliberately written as
 * `NOT EXISTS` rather than `NOT IN (SELECT ...)`.
 *
 * `NOT IN (subquery)` is not an anti-join to the planner: it becomes a
 * `SubPlan` over the subquery's result. Postgres can turn that into a *hashed*
 * SubPlan only when the whole subquery result is estimated to fit in
 * `work_mem`. Above that threshold it silently degrades to a `Materialize`
 * node that is rescanned once per outer row — O(outer x inner) instead of
 * O(outer + inner).
 *
 * That cliff is reachable in production. A squid with a deep hot window
 * (e.g. Arbitrum, where L1 finality leaves several thousand unfinalized
 * blocks) writing a few hundred entity changes per block accumulates a
 * hot_change_log of >1M rows. Against a hosted default `work_mem` of ~4MB the
 * hash no longer fits, so
 *
 *     DELETE FROM hot_block WHERE height NOT IN (SELECT block_height FROM hot_change_log)
 *
 * jumps from a ~7.8e3 cost plan to a ~2.7e8 one, exceeds `statement_timeout`,
 * and aborts `connect()`. The processor then crash-loops forever: it can never
 * start, so the hot tables never shrink, so the next start times out
 * identically.
 *
 * `NOT EXISTS` gives the planner a real anti-join instead. It can use the
 * `hot_change_log` primary key `(block_height, index)` for a nested-loop anti
 * join, and when it does pick a hash anti join that hash may spill to disk in
 * batches — neither strategy is gated on the inner side fitting in `work_mem`.
 *
 * `NOT EXISTS` is also NULL-safe: `NOT IN` yields no rows at all if the
 * subquery ever produces a NULL. The columns involved are `NOT NULL` today, so
 * this is a robustness property rather than a live bug.
 */
export function orphanRepairStatements(escapedSchema: string): string[] {
    return [
        // Orphan hot_change_log rows whose block_height has no matching
        // hot_block. Normally the FK + cascade prevents this, but it can be
        // reached via manual constraint disable, partial restores, etc.
        `DELETE FROM ${escapedSchema}.hot_change_log l
          WHERE NOT EXISTS (
              SELECT 1 FROM ${escapedSchema}.hot_block b WHERE b.height = l.block_height
          )`,

        // Orphan hot_block rows that have no sentinel/change-log entry —
        // they did not go through insertHotBlock. The cascade FK on
        // hot_change_log cleans up the (empty) child rows automatically.
        `DELETE FROM ${escapedSchema}.hot_block b
          WHERE NOT EXISTS (
              SELECT 1 FROM ${escapedSchema}.hot_change_log l WHERE l.block_height = b.height
          )`,

        // Orphan template_registry rows whose height matches neither a
        // finalized state nor any surviving hot_block.
        `DELETE FROM ${escapedSchema}.template_registry t
          WHERE t.height > COALESCE((SELECT height FROM ${escapedSchema}.status WHERE id = 0), -1)
            AND NOT EXISTS (
                SELECT 1 FROM ${escapedSchema}.hot_block b WHERE b.height = t.height
            )`,
    ]
}
