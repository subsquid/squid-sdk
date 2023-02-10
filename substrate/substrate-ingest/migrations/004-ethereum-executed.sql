
CREATE TABLE frontier_ethereum_executed (
    event_id varchar(23) primary key references event,
    contract char(42) not null
);


CREATE INDEX IDX_frontier_ethereum_executed__contract__event_id
    ON frontier_ethereum_executed(contract, event_id);
