import { MigrationInterface, QueryRunner } from 'typeorm'

export class BlockTimestamp1607690267560 implements MigrationInterface {
  name = 'BlockTimestamp1607690267560'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "block_timestamp" numeric NOT NULL DEFAULT 0`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "block_timestamp"`
    )
  }
}
