import {MigrationInterface, QueryRunner} from 'typeorm'

export class StoreEvmLog1641997527150 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "evm_log_data"  CHARACTER VARYING`
        )

        await queryRunner.query(
            `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "evm_log_address"  CHARACTER VARYING`
        )

        await queryRunner.query(
            `ALTER TABLE "substrate_event" ADD COLUMN IF NOT EXISTS "evm_log_topics"  TEXT []`
        )


        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION evm_log_insert_trigger_fnc()
              RETURNS trigger AS
            
            $$
            DECLARE
                params_array    jsonb;
            BEGIN
                IF (NEW.name = 'evm.Log') THEN
                    params_array = jsonb_array_elements(NEW.params);
                    if (params_array is not null) THEN
                        UPDATE substrate_event
                        SET 
                            evm_log_data = params_array->'value'->>'data', 
                            evm_log_address = params_array->'value'->>'address',
                            evm_log_topics = ARRAY(SELECT jsonb_array_elements(params_array->'value'->'topics')#>>'{}')
                        WHERE id = NEW.id;
                    END IF;
                END IF;
            
                RETURN NEW;
            END;
            
            $$
            
            LANGUAGE 'plpgsql';
            
            CREATE TRIGGER evm_log_insert_trigger
              AFTER INSERT
              ON "substrate_event"
              FOR EACH ROW
              EXECUTE PROCEDURE evm_log_insert_trigger_fnc();
        `)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TRIGGER evm_log_insert_trigger ON substrate_event;`
        )

        await queryRunner.query(
            `DROP FUNCTION evm_log_insert_trigger_fnc();`
        )

        await queryRunner.query(
            `DROP TRIGGER evm_hash_insert_trigger_fnc ON substrate_event;`
        )

        await queryRunner.query(
            `DROP FUNCTION evm_hash_insert_trigger_fnc();`
        )

        await queryRunner.query(
            `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "evm_log_topics"`
        )

        await queryRunner.query(
            `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "evm_log_address"`
        )

        await queryRunner.query(
            `ALTER TABLE "substrate_event" DROP COLUMN IF EXISTS "evm_log_data"`
        )

    }
}
