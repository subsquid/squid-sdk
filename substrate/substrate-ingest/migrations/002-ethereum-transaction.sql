
CREATE TABLE frontier_ethereum_transaction (
    call_id varchar(30) primary key references call,
    contract char(42) not null,
    sighash varchar(10)
);


CREATE INDEX IDX_frontier_ethereum_transaction__contract__sighash__call
    ON frontier_ethereum_transaction (contract, sighash, call_id);


CREATE INDEX IDX_frontier_ethereum_transaction__contract__call
    ON frontier_ethereum_transaction (contract, call_id);


CREATE INDEX IDX_frontier_ethereum_transaction__sighash__call
    ON frontier_ethereum_transaction (sighash, call_id);
