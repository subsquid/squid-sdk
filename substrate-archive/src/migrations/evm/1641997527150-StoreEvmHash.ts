import { MigrationInterface, QueryRunner } from 'typeorm'

export class StoreEvmHash1641997527150 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "evm_hash"  TEXT`
        )


        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION evm_hash_insert_trigger_fnc()
                RETURNS trigger AS
            
            $$
            BEGIN
                IF (NEW.name = 'ethereum.Executed') THEN
                    if (NEW.params is not null) THEN
                        UPDATE substrate_event
                        SET evm_hash = NEW.params -> 2 ->> 'value'
                        WHERE block_id = NEW.block_id
                          AND extrinsic_id = NEW.extrinsic_id;
                    END IF;
                END IF;
            
                RETURN NEW;
            END;
            
            $$
                LANGUAGE 'plpgsql';
            
            
            
            CREATE TRIGGER evm_hash_insert_trigger_fnc
                AFTER INSERT OR UPDATE
                ON "substrate_event"
                FOR EACH ROW
                WHEN (pg_trigger_depth() = 0)
            EXECUTE PROCEDURE evm_hash_insert_trigger_fnc();
        `)

        await queryRunner.query(
            `UPDATE substrate_event SET name=name;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TRIGGER evm_hash_insert_trigger_fnc ON substrate_event;`
        )

        await queryRunner.query(
            `DROP FUNCTION evm_hash_insert_trigger_fnc();`
        )

        await queryRunner.query(
            `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "evm_hash"`
        )

    }
}
