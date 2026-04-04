import dotenv from "dotenv";
dotenv.config(); // Loads variables from .env into process.env

import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import pool from "./extra/databaseconnection.js";
import connectPgSimple from "connect-pg-simple";
import userRoutes from "./routes/user-routes.js";
const pgSession = connectPgSimple(session);

const app = express();

// Use environment variables for configuration
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL, // your React app URL
    credentials: true,
  }),
);

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
      secure: false, // true only in HTTPS (it will not allow cookies if it is not set to true in https requests)
      sameSite: "lax", // or "none" if cross-site (see below) ("lax" is used for the localhost) ("strictonly" for same domain)
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

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
