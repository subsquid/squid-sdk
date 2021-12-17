#!/bin/bash

wait-until() {
    local attempt_counter=0
    local max_attempts=${2:-30}
    until eval "$1"; do
        if [ ${attempt_counter} -eq ${max_attempts} ];then
            echo "Max attempts reached"
            exit 1
        fi
        attempt_counter=$(($attempt_counter+1))
        sleep 2
    done
}


METADATA_HASH=($(tar fc - -C / hasura-metadata | md5sum))
MDB="gateway_metadata_$METADATA_HASH"
echo "metadata hash: $METADATA_HASH"
echo "metadata db: $MDB"


export PGHOST=$DB_HOST
export PGPORT=$DB_PORT
export PGUSER=$DB_USER
export PGPASSWORD=$DB_PASS


echo "waiting until indexer db is ready"
wait-until 'psql --dbname="$DB_NAME" -c "select id from substrate_block limit 1" > /dev/null 2>&1'


create-database() {
    if [ "$( psql -tAc "SELECT 1 FROM pg_database WHERE datname='"$MDB"'" )" = '1' ]
    then
        echo "found metadata database"
    else
        createdb "$MDB" && echo "created metadata database"
    fi
}
wait-until 'create-database' 5


if [ "$DEV_MODE" == "true" ]; then
    export HASURA_GRAPHQL_ENABLE_CONSOLE="true"
else
    export HASURA_GRAPHQL_ADMIN_SECRET="$(openssl rand -hex 12)"
    export HASURA_GRAPHQL_UNAUTHORIZED_ROLE=user
fi
export HASURA_GRAPHQL_STRINGIFY_NUMERIC_TYPES=true
export HASURA_GRAPHQL_STRINGIFY_NUMERIC_TYPES=true
export HASURA_GRAPHQL_ENABLE_TELEMETRY=false
export HASURA_GRAPHQL_METADATA_DATABASE_URL="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$MDB"
export HYDRA_INDEXER_DB="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"


exec /bin/hasura-entrypoint.sh graphql-engine serve
