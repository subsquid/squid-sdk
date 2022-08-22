CREATE TABLE acala_evm_log (
    id char(17) primary key,
    event_id char(23) not null references event on delete cascade,
    contract char(42) not null,
    topic0 char(66),
    topic1 char(66),
    topic2 char(66),
    topic3 char(66)
);


CREATE INDEX IDX_acala_evm_log__contract__topic0__id ON evm_log (contract, topic0, id);
CREATE INDEX IDX_acala_evm_log__contract__id ON evm_log (contract, id);
CREATE INDEX IDX_acala_evm_log__topic0__id ON evm_log (topic0, id);


CREATE TABLE acala_evm_call (
    call_id varchar(30) primary key references call,
    contract char(42) not null,
    selector char(10)
);


CREATE INDEX IDX_acala_evm_call__contract__sighash__call ON acala_evm_call (contract, sighash, call_id);
CREATE INDEX IDX_acala_evm_call__contract__call ON acala_evm_call (contract, call_id);
CREATE INDEX IDX_acala_evm_call__sighash__call ON acala_evm_call (sighash, call_id);


CREATE TABLE acala_evm_eth_call (
    call_id varchar(30) primary key references call,
    contract char(42) not null,
    sighash char(10)
);


CREATE INDEX IDX_acala_evm_eth_call__contract__sighash__call ON acala_evm_eth_call (contract, sighash, call_id);
CREATE INDEX IDX_acala_evm_eth_call__contract__call ON acala_evm_eth_call (contract, call_id);
CREATE INDEX IDX_acala_evm_eth_call__sighash__call ON acala_evm_eth_call (sighash, call_id);
