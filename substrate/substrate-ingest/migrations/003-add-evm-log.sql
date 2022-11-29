
CREATE TABLE acala_evm_executed (
    event_id char(23) primary key references event,
    contract char(42) not null
);


CREATE INDEX IDX_acala_evm_executed__contract__event
    ON acala_evm_executed (contract, event_id);


CREATE TABLE acala_evm_executed_log (
    id char(23) primary key,
    event_id char(23) not null references event on delete cascade,
    event_contract char(42) not null,
    contract char(42) not null,
    topic0 char(66),
    topic1 char(66),
    topic2 char(66),
    topic3 char(66)
);


CREATE INDEX IDX_acala_evm_executed_log__event_contract__contract__topic0__id
    ON acala_evm_executed_log (event_contract, contract, topic0, id);

CREATE INDEX IDX_acala_evm_executed_log__event_contract__topic0__id
    ON acala_evm_executed_log (event_contract, topic0, id);

CREATE INDEX IDX_acala_evm_executed_log__contract__topic0__id
    ON acala_evm_executed_log (contract, topic0, id);

CREATE INDEX IDX_acala_evm_executed_log__contract__id
    ON acala_evm_executed_log (contract, id);

CREATE INDEX IDX_acala_evm_executed_log__topic0__id
    ON acala_evm_executed_log (topic0, id);


CREATE TABLE acala_evm_executed_failed (
    event_id char(23) primary key references event,
    contract char(42) not null
);


CREATE INDEX IDX_acala_evm_executed_failed__contract__event
    ON acala_evm_executed_failed (contract, event_id);


CREATE TABLE acala_evm_executed_failed_log (
    id char(23) primary key,
    event_id char(23) not null references event on delete cascade,
    event_contract char(42) not null,
    contract char(42) not null,
    topic0 char(66),
    topic1 char(66),
    topic2 char(66),
    topic3 char(66)
);


CREATE INDEX IDX_acala_evm_executed_failed_log__event_contract__contract__topic0__id
    ON acala_evm_executed_failed_log (event_contract, contract, topic0, id);

CREATE INDEX IDX_acala_evm_executed_failed_log__event_contract__topic0__id
    ON acala_evm_executed_failed_log (event_contract, topic0, id);

CREATE INDEX IDX_acala_evm_executed_failed_log__contract__topic0__id
    ON acala_evm_executed_failed_log (contract, topic0, id);

CREATE INDEX IDX_acala_evm_executed_failed_log__contract__id
    ON acala_evm_executed_failed_log (contract, id);

CREATE INDEX IDX_acala_evm_executed_failed_log__topic0__id
    ON acala_evm_executed_failed_log (topic0, id);

