CREATE TABLE block (
    id varchar PRIMARY KEY,
    height integer NOT NULL,
    hash varchar NOT NULL,
    parent_hash varchar NOT NULL,
    spec integer NOT NULL,
    timestamp bigint NOT NULL
);

CREATE TABLE metadata (
    spec integer PRIMARY KEY,
    block_height integer NOT NULL,
    block_hash varchar NOT NULL,
    data varchar NOT NULL
);
