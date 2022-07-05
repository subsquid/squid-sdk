UPDATE call
SET contract =
        CASE
            WHEN args->'transaction'->'action'->>'value'::text IS NULL
                THEN args->'transaction'->'value'->'action'->>'value'
            ELSE args->'transaction'->'action'->>'value'
        END
WHERE name = 'Ethereum.transact';
