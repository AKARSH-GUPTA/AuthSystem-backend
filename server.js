import dotenv from "dotenv";
dotenv.config(); // Loads variables from .env into process.env

import express from "express";
import session from "express-session";
import passport from "passport";
import {Strategy} from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import cors from "cors";
import pool from "./config/databaseconnection.js";
import connectPgSimple from "connect-pg-simple";
import userRoutes from "./routes/user-routes.js";
import strategies from "./config/Strategies.js"
const pgSession = connectPgSimple(session);


const app = express();

//ERROR handling middileware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Use environment variables for configuration
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "https://authsystem-frontend-qmh0.onrender.com";

app.set("trust proxy", 1);//for the render (secure cookies won't work without it)

//setting cors for cross site cookies handling
app.use(
  cors({
    origin: "https://authsystem-frontend-qmh0.onrender.com", // your React app URL
    credentials: true,
  }),
);
// app.use(cors({
//   origin: function (origin, callback) {
//     if (
//       !origin ||
//       origin.includes("vercel.app")
//     ) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));
app.use(express.json()); //important fro recieving the json data through the axios requests
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new pgSession({
      pool: pool, // PostgreSQL pool
      tableName: "session", // table name
    }),
    secret: process.env.SESSION_SECRET, // Protected secret
    resave: false, //don't want to store the session on every request in the database
    saveUninitialized: false, // important (we don't want to save the empty sessiom until it contain any data)
    cookie: {
      httpOnly: true,
      secure: true, // true only in HTTPS (it will not allow cookies if it is not set to true in https requests)
      sameSite: "none", // or "none" if cross-site (see below) ("lax" is used for the localhost) ("strictonly" for same domain)
      // domain:'.onrender.com',
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

//strategies for the passport
passport.use(
  new Strategy(
    { usernameField: "email", passwordField: "password" },
     strategies.Local
  ),
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    strategies.Google
  ),
);

//set the user to the session and sends the cookie
passport.serializeUser((user, cb) => {
  cb(null, user.email);
});
//fetches the user from the recieved cookie
passport.deserializeUser(async (email, cb) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public.user where email=$1",
      [email],
    );
    if (result.rows.length !== 0) {
      const users = result.rows[0];
      return cb(null, users);
    } else {
      return cb(null, false);
    }
  } catch (err) {
    return cb(err);
  }
});

//Routes
app.use("/",userRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
