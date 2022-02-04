CREATE TABLE block (
    id varchar PRIMARY KEY,
    height integer NOT NULL,
    hash varchar NOT NULL,
    parent_hash varchar NOT NULL,
    timestamp bigint NOT NULL
);

CREATE TABLE metadata (
    spec integer PRIMARY KEY,
    block_height integer NOT NULL,
    block_hash varchar NOT NULL,
    data varchar NOT NULL
);

CREATE TABLE extrinsic (
    id varchar PRIMARY KEY,
    block_id varchar REFERENCES block ON DELETE CASCADE,
    name varchar NOT NULL,
    tip numeric NOT NULL
);

CREATE TABLE call (
    extrinsic_id varchar REFERENCES extrinsic ON DELETE CASCADE,
    args jsonb NOT NULL
);
