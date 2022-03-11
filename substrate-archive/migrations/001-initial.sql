CREATE TABLE block (
    id char(16) PRIMARY KEY,
    height integer NOT NULL,
    hash char(66) NOT NULL,
    parent_hash char(66) NOT NULL,
    timestamp timestamptz NOT NULL
);


CREATE INDEX block__height__idx ON block(height);
CREATE INDEX block__hash__idx ON block(hash);
CREATE INDEX block__timestamp__idx ON block(timestamp);


CREATE TABLE metadata (
    spec_version integer PRIMARY KEY,
    block_height integer NOT NULL,
    block_hash char(66) NOT NULL,
    hex varchar NOT NULL
);


CREATE TABLE extrinsic (
    id varchar(23) PRIMARY KEY,
    block_id char(16) NOT NULL REFERENCES block,
    index_in_block integer NOT NULL,
    name varchar NOT NULL,
    signature jsonb,
    success bool not null,
    hash char(66) NOT NULL,
    call_id char(23) NOT NULL
);


CREATE INDEX extrinsic__name_block__idx ON extrinsic(name, block_id);
CREATE INDEX extrinsic__block_index__idx ON extrinsic(block_id, index_in_block);


CREATE TABLE call (
    id char(23) primary key,
    index integer not null,
    extrinsic_id char(23) not null REFERENCES extrinsic,
    parent_id varchar(23) REFERENCES call,
    success bool not null,
    name varchar not null,
    args jsonb
);


CREATE INDEX call__extrinsic_index__idx ON call(extrinsic_id, index);
CREATE INDEX call__name_extrinsic__idx ON call(name, extrinsic_id);
CREATE INDEX call__parent__idx ON call(parent_id);


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


CREATE INDEX event__block_index__idx ON event(block_id, index_in_block);
CREATE INDEX event__extrinsic__idx ON event(extrinsic_id);
CREATE INDEX event__call__idx ON event(call_id);
CREATE INDEX event__name_block__idx ON event(name, block_id);


CREATE TABLE warning (
    block_id char(16),
    message varchar
);
