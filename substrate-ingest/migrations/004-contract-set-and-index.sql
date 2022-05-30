CREATE INDEX IDX_event__contract__block ON event(contract, block_id);

UPDATE event SET contract = args->>'address' WHERE name = 'EVM.Log';
UPDATE event SET contract = args->>'contract' WHERE name = 'Contracts.ContractEmitted';
