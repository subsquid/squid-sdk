import { MigrationInterface, QueryRunner } from 'typeorm'

export class EventExtraFields1612537639000 implements MigrationInterface {
  name = 'EventExtraFields1612537639000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "extrinsic_args" jsonb  NOT NULL DEFAULT '{}'::jsonb`
    )
    await queryRunner.query(
      `CREATE INDEX "substrate_event_args_idx" ON "substrate_event" USING gin("extrinsic_args")`
    )

    await queryRunner.query(
      `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "extrinsic_hash" character varying`
    )
    await queryRunner.query(
      `CREATE INDEX "extrinsic_hash_idx" ON "substrate_event" ("extrinsic_hash") `
    )

    await queryRunner.query(
      `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "data" jsonb NOT NULL DEFAULT '{}'::jsonb`
    )
    await queryRunner.query(
      `CREATE INDEX "substrate_event_data_idx" ON "substrate_event" USING gin("data")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "extrinsic_args"`
    )
    await queryRunner.query(
      `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "extrinsic_hash"`
    )
    await queryRunner.query(
      `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "data"`
    )
    await queryRunner.query(`DROP INDEX "extrinsic_hash_idx" `)
    await queryRunner.query(`DROP INDEX "substrate_event_args_idx" `)
    await queryRunner.query(`DROP INDEX "substrate_event_data_idx" `)
  }
}
