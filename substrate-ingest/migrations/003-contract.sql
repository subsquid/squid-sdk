ALTER TABLE event
    ADD COLUMN contract varchar
        DEFAULT (
            CASE
                WHEN name = 'EVM.Log' THEN args->>'address'
                WHEN name = 'Contracts.ContractEmitted' THEN args->>'contract'
            END
        );


UPDATE event SET contract = args->>'address' WHERE name = 'EVM.Log';
UPDATE event SET contract = args->>'contract' WHERE name = 'Contracts.ContractEmitted';


CREATE INDEX IDX_event__contract__block ON event(contract, block_id);
