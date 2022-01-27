CREATE TABLE block (
    height integer NOT NULL,
    hash varchar NOT NULL,
    parent_hash varchar NOT NULL,
    spec integer NOT NULL,
    timestamp bigint NOT NULL
);

CREATE TABLE log (
    name varchar NOT NULL,
    tip number NOT NULL
);

CREATE TABLE metadata (
    spec integer NOT NULL,
    block_height integer NOT NULL,
    block_hash integer NOT NULL,
    data varchar NOT NULL
);
