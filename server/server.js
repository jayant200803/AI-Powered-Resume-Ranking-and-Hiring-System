import express from "express";
import cors from "cors";
import passport from "passport";
import mongoose from "mongoose";
import { createSessionMiddleware } from "./sessionMiddleware.js";
import { authRoutes } from "./routes/authRoutes.js";
import { roleRoutes } from "./routes/roleRoutes.js";
import { jobSeekerRoutes } from "./routes/jobSeekerRoutes.js";
import { employerRoutes } from "./routes/employerRoutes.js";
import { jobRoutes } from "./routes/jobRoutes.js";
import { googleAuthRoutes } from "./googleAuth.js";
import { isLoggedIn } from "./middleware/isLoggedIn.js";
import { logoutRoutes } from "./routes/logoutRoutes.js";
import connectDB from "./db.js";

// Connect to MongoDB before starting
await connectDB();

const app = express();

// Middleware Setup
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
// Reuse the already-open Mongoose client — avoids a second TLS connection to Atlas
app.use(createSessionMiddleware(mongoose.connection.getClient()));
app.use(passport.initialize());
app.use(passport.session());

// Routes
googleAuthRoutes(app);
authRoutes(app);
logoutRoutes(app);
roleRoutes(app, isLoggedIn);
jobSeekerRoutes(app, isLoggedIn);
employerRoutes(app, isLoggedIn);
jobRoutes(app, isLoggedIn);

// Global error handler — catches any unhandled Express errors cleanly
app.use((err, req, res, next) => {
    console.error("Express error:", err.message);
    res.status(500).json({ error: "Internal server error" });
});

// Start server — use $PORT on Render, fallback to 5000 locally
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
