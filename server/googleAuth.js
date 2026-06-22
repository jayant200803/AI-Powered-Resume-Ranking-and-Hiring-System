import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

// Google OAuth Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || "http://localhost:5000"}/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile._json.email;
        const google_id = profile.id;

        // replaces: SELECT * FROM login WHERE google_id = $1
        let user = await User.findOne({ google_id });

        if (!user) {
            // replaces: INSERT INTO login (email, google_id, role) VALUES ($1, $2, 'none')
            user = await User.create({ email, google_id, role: "none" });
        }

        return done(null, { email: user.email, google_id: user.google_id });
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
    try {
        // replaces: SELECT * FROM login WHERE email = $1
        const user = await User.findOne({ email });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Routes
export const googleAuthRoutes = (app) => {

    app.get("/auth/google", passport.authenticate("google", {
        scope: ["email"]
    }));

    app.get("/auth/google/callback", (req, res, next) => {
        passport.authenticate("google", (err, user) => {
            // TokenError (expired/reused code) and other OAuth errors land here as err
            if (err || !user) {
                return res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
            }
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    return res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
                }
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/choose-role`);
            });
        })(req, res, next);
    });
};
