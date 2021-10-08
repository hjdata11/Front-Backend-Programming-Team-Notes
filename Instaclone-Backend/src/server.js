require("dotenv").config();
const PORT = process.env.PORT;
import logger from "morgan";
import express from "express";

import { graphqlUploadExpress } from 'graphql-upload';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { typeDefs, resolvers } from './schema';
import { getUser } from './users/users.utils';

import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

import pubsub from './pubsub';

console.log(pubsub)

async function startApolloServer(typeDefs, resolvers) {
    const schema = makeExecutableSchema({ typeDefs, resolvers,});
    const server = new ApolloServer({
        schema,
        context: async(ctx) => {
            if (ctx.req) {
                return { loggedInUser: await getUser(ctx.req.headers.token) }
            } else {
                const { connection: { context } } = ctx;
                return {
                    loggedInUser: context.loggedInUser
                }
            }
        },
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    });
    await server.start();
    const app = express();
    app.use(logger("tiny"));
    app.use(graphqlUploadExpress());
    app.use("/static", express.static("uploads"));
    const httpServer = createServer(app);
    server.applyMiddleware({ app });

    SubscriptionServer.create({
        schema,
        execute,
        subscribe,
        async onConnect({ token }, webSocket, context) {
            if (!token) throw new Error("You can't listen.");
            const loggedInUser = await getUser(token);
            return { loggedInUser }

        },
        onDisconnect(webSocket, context) {
            console.log("Disconnected!")
        }
    }, {
        server: httpServer,
        path: server.graphqlPath
    });

    await new Promise(resolve => httpServer.listen({ port: PORT }, resolve))
    .then(() =>
      console.log(`🚀 Server is running on http://localhost:${PORT}${server.graphqlPath} ✅`)
    );
}

startApolloServer(typeDefs, resolvers);