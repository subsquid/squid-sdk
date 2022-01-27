import { MigrationInterface, QueryRunner } from 'typeorm'

export class ExtrinsicName1612537537000 implements MigrationInterface {
  name = 'ExtrinsicName1612537537000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "extrinsic_name" character varying`
    )
    await queryRunner.query(
      `CREATE INDEX "extrinsic_name_idx" ON "substrate_event" ("extrinsic_name") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "extrinsic_name"`
    )
    await queryRunner.query(`DROP INDEX "extrinsic_name_idx" `)
  }
}
