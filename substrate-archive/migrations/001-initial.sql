CREATE TABLE block (
    id varchar(16) PRIMARY KEY,
    height integer NOT NULL,
    hash varchar NOT NULL,
    parent_hash varchar NOT NULL,
    timestamp timestamptz NOT NULL
);


CREATE TABLE metadata (
    spec_version integer PRIMARY KEY,
    block_height integer NOT NULL,
    block_hash varchar NOT NULL,
    hex varchar NOT NULL
);


CREATE TABLE extrinsic (
    id varchar(23) PRIMARY KEY,
    block_id varchar(16) REFERENCES block,
    index_in_block integer NOT NULL,
    name varchar NOT NULL,
    signature jsonb,
    success bool not null,
    hash bytea NOT NULL
);


CREATE TABLE call (
    id varchar(23) primary key,
    index integer not null,
    extrinsic_id varchar(23) not null REFERENCES extrinsic,
    parent_id varchar REFERENCES call,
    success bool not null,
    args jsonb
);


CREATE TABLE event (
    id varchar(23) PRIMARY KEY,
    block_id varchar(16) not null REFERENCES block,
    index_in_block integer NOT NULL,
    phase varchar NOT NULL,
    extrinsic_id varchar(23) REFERENCES extrinsic,
    call_id varchar(23) REFERENCES call,
    name varchar NOT NULL,
    args jsonb
);
