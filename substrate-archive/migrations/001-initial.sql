
CREATE TABLE metadata (
    spec_version integer PRIMARY KEY,
    block_height integer NOT NULL,
    block_hash char(66) NOT NULL,
    hex varchar NOT NULL
);


CREATE TABLE block (
    id char(16) PRIMARY KEY,
    height integer NOT NULL,
    hash char(66) NOT NULL,
    parent_hash char(66) NOT NULL,
    timestamp timestamptz NOT NULL,
    spec_version integer NOT NULL REFERENCES metadata
);


CREATE INDEX IDX_block__height ON block(height);
CREATE INDEX IDX_block__hash ON block(hash);
CREATE INDEX IDX_block__timestamp ON block(timestamp);


CREATE TABLE extrinsic (
    id varchar(23) PRIMARY KEY,
    block_id char(16) NOT NULL REFERENCES block ON DELETE cascade,
    index_in_block integer NOT NULL,
    name varchar NOT NULL,
    signature jsonb,
    success bool not null,
    hash char(66) NOT NULL,
    call_id char(23) NOT NULL
);


CREATE INDEX IDX_extrinsic__name__block ON extrinsic(name, block_id);
CREATE INDEX IDX_extrinsic__block__index ON extrinsic(block_id, index_in_block);


CREATE TABLE call (
    id char(23) primary key,
    index integer not null,
    block_id char(16) not null REFERENCES block ON DELETE cascade,
    extrinsic_id char(23) not null REFERENCES extrinsic ON DELETE cascade,
    parent_id varchar(23) REFERENCES call,
    success bool not null,
    name varchar not null,
    args jsonb
);


CREATE INDEX IDX_call__extrinsic__index ON call(extrinsic_id, index);
CREATE INDEX IDX_call__name__block ON call(name, block_id);
CREATE INDEX IDX_call__parent ON call(parent_id);


CREATE TABLE event (
    id char(23) PRIMARY KEY,
    block_id char(16) not null REFERENCES block,
    index_in_block integer NOT NULL,
    phase varchar NOT NULL,
    extrinsic_id char(23) REFERENCES extrinsic,
    call_id char(23) REFERENCES call,
    name varchar NOT NULL,
    args jsonb
);


CREATE INDEX IDX_event__name__block ON event(name, block_id);
CREATE INDEX IDX_event__block__index ON event(block_id, index_in_block);
CREATE INDEX IDX_event__extrinsic ON event(extrinsic_id);
CREATE INDEX IDX_event__call ON event(call_id);


CREATE TABLE warning (
    block_id char(16),
    message varchar
);
