ALTER TABLE call ADD contract varchar;
CREATE INDEX IDX_call__contract__block ON call(contract, block_id);
