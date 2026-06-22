import expressSession from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

// Accept the already-open MongoClient from Mongoose so we don't
// open a second TLS connection to Atlas (which causes SSL alert 80 on M0).
export const createSessionMiddleware = (mongoClient) => expressSession({
    store: MongoStore.create({
        client: mongoClient,
        dbName: "hiring_system",
        collectionName: "sessions",
        ttl: 24 * 60 * 60,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
    },
});
