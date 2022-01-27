import { MigrationInterface, QueryRunner } from 'typeorm'

export class StoreValidatorId1632994699021 implements MigrationInterface {
  name = 'StoreValidatorId1632994699021'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_block" ADD COLUMN IF NOT EXISTS "validator_id" character varying NOT NULL DEFAULT ''`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_block" DROP COLUMN IF EXISTS "validator_id"`
    )
  }
}
