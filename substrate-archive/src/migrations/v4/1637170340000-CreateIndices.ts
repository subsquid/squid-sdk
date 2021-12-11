import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateIndices1637170340000 implements MigrationInterface {
  name = 'CreateIndices1637170340000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX idx_substrate_event_extrinsic_id ON substrate_event(extrinsic_id)`
    )
    await queryRunner.query(
      `CREATE INDEX idx_substrate_event_block_id ON substrate_event(block_id)`
    )
    await queryRunner.query(
      `CREATE INDEX idx_substrate_extrinsic_block_id ON substrate_extrinsic(block_id)`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_substrate_extrinsic_block_id"`)
    await queryRunner.query(`DROP INDEX "idx_substrate_event_block_id"`)
    await queryRunner.query(`DROP INDEX "idx_substrate_event_extrinsic_id"`)
  }
}
