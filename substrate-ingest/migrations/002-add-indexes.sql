CREATE INDEX IDX_block__validator ON block(validator);

CREATE INDEX IDX_extrinsic__hash ON extrinsic(hash);
CREATE INDEX IDX_extrinsic__call ON extrinsic(call_id);
CREATE INDEX IDX_extrinsic__signature ON extrinsic USING GIN (signature);

CREATE INDEX IDX_call__block ON call(block_id);
