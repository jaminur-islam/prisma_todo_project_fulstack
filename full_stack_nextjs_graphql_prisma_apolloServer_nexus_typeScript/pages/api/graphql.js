import { ApolloServer } from "apollo-server-micro";
import { schema } from "../../graphql/schema";
import Cors from "micro-cors";
import { db } from "../../lib/dbFun";
import jwt from "jsonwebtoken";

const cors = Cors();

const apolloServer = new ApolloServer({
  schema,
  debug: false,
  context: async ({ req }) => {
    const token = req?.headers?.authorization?.split(" ")[1];
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return { db, user };
    } catch (err) {
      return { db, user: err };
    }
  },
});
const startServer = apolloServer.start();

export default cors(async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://studio.apollographql.com"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
});

export const config = {
  api: {
    bodyParser: false,
  },
};

// https://blog.escape.tech/9-graphql-security-best-practices/
