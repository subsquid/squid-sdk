

CREATE TABLE blocks (
    number UInt64,
    hash String,
    parent_hash String,
    timestamp DateTime
)
ENGINE = MergeTree()
ORDER BY number;


CREATE TABLE erc20_transfers
(
    block_number UInt64,
    block_hash String,
    block_timestamp DateTime,
    log_index UInt32,
    transaction_hash String,
    contract String,
    from String,
    to String,
    amount UInt256
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(block_timestamp)
ORDER BY (contract, block_number, log_index);
