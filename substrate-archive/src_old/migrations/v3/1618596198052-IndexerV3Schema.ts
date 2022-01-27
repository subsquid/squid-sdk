import { MigrationInterface, QueryRunner } from 'typeorm'

export class IndexerV3Schema1618596198052 implements MigrationInterface {
  name = 'IndexerV3Schema1618596198052'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "substrate_block" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" character varying NOT NULL DEFAULT 'hydra-indexer', "updated_at" TIMESTAMP DEFAULT now(), "updated_by_id" character varying, "deleted_at" TIMESTAMP, "deleted_by_id" character varying, "version" integer NOT NULL, "id" character varying NOT NULL, "height" integer NOT NULL, "timestamp" bigint NOT NULL, "hash" character varying NOT NULL, "parent_hash" character varying NOT NULL, "state_root" character varying NOT NULL, "extrinsics_root" character varying NOT NULL, "runtime_version" jsonb NOT NULL, "last_runtime_upgrade" jsonb NOT NULL, "events" jsonb NOT NULL, "extrinsics" jsonb NOT NULL, CONSTRAINT "PK_6d10c61cb468c6f0322ec785f00" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_0a079b7de8677bf14e3ce7eae5" ON "substrate_block" ("height") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_1c466d50a1051e61740ca39d5d" ON "substrate_block" ("hash") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_4d1f3ccae8198d4e845ec71961" ON "substrate_block" ("parent_hash") `
    )
    await queryRunner.query(
      `CREATE TABLE "substrate_extrinsic" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" character varying NOT NULL DEFAULT 'hydra-indexer', "updated_at" TIMESTAMP DEFAULT now(), "updated_by_id" character varying, "deleted_at" TIMESTAMP, "deleted_by_id" character varying, "version" integer NOT NULL, "id" character varying NOT NULL, "tip" numeric NOT NULL, "block_number" bigint NOT NULL, "block_hash" character varying NOT NULL, "version_info" character varying NOT NULL, "meta" jsonb NOT NULL, "method" character varying NOT NULL, "index_in_block" integer NOT NULL, "section" character varying NOT NULL, "name" character varying NOT NULL, "args" jsonb NOT NULL, "signer" character varying NOT NULL, "signature" character varying NOT NULL, "nonce" integer NOT NULL, "era" jsonb NOT NULL, "hash" character varying NOT NULL, "is_signed" boolean NOT NULL, "block_id" character varying, CONSTRAINT "PK_a4c7ce64007d5d29f412c071373" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_2edcefa903e8eedd4c6478ddc5" ON "substrate_extrinsic" ("block_number") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_034d244f7ec619f6733b5bbe2f" ON "substrate_extrinsic" ("block_hash") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e55cc0b6066f8e243fb1f0b649" ON "substrate_extrinsic" ("method") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9edd16e8dcc91307f46e81c845" ON "substrate_extrinsic" ("section") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_97782f111ef9a1e1f68486d3d8" ON "substrate_extrinsic" ("name") `
    )
    await queryRunner.query(
      `CREATE TABLE "substrate_event" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" character varying NOT NULL DEFAULT 'hydra-indexer', "updated_at" TIMESTAMP DEFAULT now(), "updated_by_id" character varying, "deleted_at" TIMESTAMP, "deleted_by_id" character varying, "version" integer NOT NULL, "id" character varying NOT NULL, "name" character varying NOT NULL, "section" character varying, "extrinsic_name" character varying, "extrinsic_args" jsonb NOT NULL, "extrinsic_hash" character varying, "extrinsic_index" integer, "method" character varying NOT NULL, "phase" jsonb NOT NULL, "block_number" integer NOT NULL, "block_hash" character varying NOT NULL, "block_timestamp" bigint NOT NULL, "index_in_block" integer NOT NULL, "params" jsonb NOT NULL, "data" jsonb NOT NULL, "extrinsic_id" character varying, "block_id" character varying, CONSTRAINT "PK_eb7d4a5378857e4a4e82fb6e16d" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_2f2ba86b666ea355ef4376fdfb" ON "substrate_event" ("name") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_dae9c549210adc50510a373729" ON "substrate_event" ("extrinsic_name") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_4c0dda69c6781e1898e66e97f6" ON "substrate_event" ("block_number") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_b5e20a05b55554025c79a421c3" ON "substrate_event" ("block_hash") `
    )
    await queryRunner.query(
      `ALTER TABLE "substrate_extrinsic" ADD CONSTRAINT "FK_b2649ca2f43b8084e74046b4079" FOREIGN KEY ("block_id") REFERENCES "substrate_block"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "substrate_event" ADD CONSTRAINT "FK_039d734d88baa87b2a46c951175" FOREIGN KEY ("extrinsic_id") REFERENCES "substrate_extrinsic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "substrate_event" ADD CONSTRAINT "FK_5f77b684d238ee013241c77457d" FOREIGN KEY ("block_id") REFERENCES "substrate_block"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "substrate_event" DROP CONSTRAINT "FK_5f77b684d238ee013241c77457d"`
    )
    await queryRunner.query(
      `ALTER TABLE "substrate_event" DROP CONSTRAINT "FK_039d734d88baa87b2a46c951175"`
    )
    await queryRunner.query(
      `ALTER TABLE "substrate_extrinsic" DROP CONSTRAINT "FK_b2649ca2f43b8084e74046b4079"`
    )
    await queryRunner.query(`DROP INDEX "IDX_b5e20a05b55554025c79a421c3"`)
    await queryRunner.query(`DROP INDEX "IDX_4c0dda69c6781e1898e66e97f6"`)
    await queryRunner.query(`DROP INDEX "IDX_dae9c549210adc50510a373729"`)
    await queryRunner.query(`DROP INDEX "IDX_2f2ba86b666ea355ef4376fdfb"`)
    await queryRunner.query(`DROP TABLE "substrate_event"`)
    await queryRunner.query(`DROP INDEX "IDX_97782f111ef9a1e1f68486d3d8"`)
    await queryRunner.query(`DROP INDEX "IDX_9edd16e8dcc91307f46e81c845"`)
    await queryRunner.query(`DROP INDEX "IDX_e55cc0b6066f8e243fb1f0b649"`)
    await queryRunner.query(`DROP INDEX "IDX_034d244f7ec619f6733b5bbe2f"`)
    await queryRunner.query(`DROP INDEX "IDX_2edcefa903e8eedd4c6478ddc5"`)
    await queryRunner.query(`DROP TABLE "substrate_extrinsic"`)
    await queryRunner.query(`DROP INDEX "IDX_4d1f3ccae8198d4e845ec71961"`)
    await queryRunner.query(`DROP INDEX "IDX_1c466d50a1051e61740ca39d5d"`)
    await queryRunner.query(`DROP INDEX "IDX_0a079b7de8677bf14e3ce7eae5"`)
    await queryRunner.query(`DROP TABLE "substrate_block"`)
  }
}
