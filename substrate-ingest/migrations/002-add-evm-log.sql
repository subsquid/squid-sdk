CREATE TABLE evm_log (
    id char(17) primary key,
    block_id char(16) not null references block on delete cascade,
    event_id char(23) not null references event on delete cascade,
    contract varchar not null,
    topic0 varchar,
    topic1 varchar,
    topic2 varchar,
    topic3 varchar
);


CREATE INDEX IDX_evm_log__contract__topic0 ON evm_log(contract, topic0);
CREATE INDEX IDX_evm_log__contract ON evm_log(contract);
CREATE INDEX IDX_evm_log__topic0 ON evm_log(topic0);


CREATE TABLE acala_evm_eth_call (
    call_id varchar(30) primary key references call,
    contract varchar not null,
    selector char(10)
);


CREATE TABLE acala_evm_call (
    call_id varchar(30) primary key references call,
    contract varchar not null,
    selector char(10)
);
