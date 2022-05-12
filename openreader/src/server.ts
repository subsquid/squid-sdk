import { makeExecutableSchema } from "@graphql-tools/schema"
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core"
import { ApolloServer } from "apollo-server-express"
import express from "express"
import { useServer } from 'graphql-ws/lib/use/ws'
import { createServer } from "http"
import type { Pool } from "pg"
import { WebSocketServer } from "ws"
import { PoolTransaction } from "./db"
import { Dialect } from "./dialect"
import { buildServerSchema } from "./gql/opencrud"
import type { Model } from "./model"
import { buildResolvers } from "./resolver"

export async function serve(options: ServerOptions): Promise<ListeningServer> {
    let { model, db } = options;
    let dialect = options.dialect ?? "postgres";
    let resolvers = buildResolvers(model, dialect);
    let typeDefs = buildServerSchema(model, dialect);
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    const app = express();
    const httpServer = createServer(app);

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: "/graphql",
    });
    const serverCleanup = useServer({
        context: () => ({
            db,
            openReaderTransaction: new PoolTransaction(db)
        }),
        schema
    }, wsServer);

    const server = new ApolloServer({
        schema,
        context: () => ({openReaderTransaction: new PoolTransaction(db)}),
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                serverWillStart: async () => ({
                    drainServer: async () => serverCleanup.dispose(),
                }),
            },
        ],
    });
    await server.start();
    server.applyMiddleware({ app });

    httpServer.listen(options.port, () => {
        console.log(
            `Server is now running on http://localhost:${options.port}${server.graphqlPath}`
        );
    });

    return {
        port: options.port,
        stop: () => new Promise((resolve) => resolve()),
    };
}

// TODO Make GraphiQL console great again

export interface ListeningServer {
    readonly port: number;
    stop(): Promise<void>;
}

export interface ServerOptions {
    model: Model;
    db: Pool;
    port: number;
    dialect?: Dialect;
    graphiqlConsole?: boolean;
}
