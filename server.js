import dotenv from "dotenv";
dotenv.config(); // Loads variables from .env into process.env
import express from "express";
import session from "express-session";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import passport from "passport";
import cors from "cors";
import pool from "./databaseconnection.js";
import connectPgSimple from "connect-pg-simple";

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

//check the authentication of the request
app.get("/authentication", (req, res) => {
  res.json({ Authenticated: req.isAuthenticated() });
});

//this is all for the google authentication
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
app.get(
  "/auth/google/authenticationsystem",
  passport.authenticate("google", {
    successRedirect:"http://localhost:5173/welcome",
    failureRedirect: "http://localhost:5173/login",
  })
);

//sign out request
app.get("/signout",(req,res)=>{
  req.logout((err)=>{
    if (err) { return next(err); }
    res.json({signedout:true});
  })
});

//registerr request
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM public.user where email=$1",
      [email],
    );
    if (result.rows.length === 0) {
      const newUser = { name: name, email: email, password: password };
      await pool.query(
        "INSERT INTO public.user(name,email,password) values($1,$2,$3) RETURNING *",
        [name, email, password],
      );
      req.logIn(newUser, (err) => {
        if (err) return next(err);
        return res.json({
          registered: true,
          message: "The user is successfully registered.",
        });
      });
    } else {
      res.json({
        registered: false,
        message: "The user is already exist try to login.",
      });
    }
  } catch (err) {
    return cb(err);
  }
});

//login request
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.json({ authenticated: false, message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ authenticated: true, user, message: info.message });
    });
  })(req, res, next); //this type of function is used when you want to check the authentication using passport strategy and also send the response based on the authentication
});

//logout request
app.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out" });
  });
});

//STRATEGIES FOR THE AUTHENTICATION
passport.use(
  new Strategy(
    { usernameField: "email", passwordField: "password" },
    async function verify(username, password, cb) {
      try {
        const result = await pool.query(
          "SELECT * FROM public.user where email=$1",
          [username],
        );
        if (result.rows.length !== 0) {
          const users = result.rows[0];
          if (password === users.password) {
            return cb(null, users, { message: "Successfull!" });
          } else if (users.password === "google") {
            return cb(null, users, { message: "Successfull!" });
          } else {
            return cb(null, false, { message: "Invalid Password" });
          }
        } else {
          return cb(null, false, { message: "User not found, first register" });
        }
      } catch (err) {
        return cb(err);
      }
    },
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
    async (accessToken, refreshToken, profile, cb) => {
      console.log(profile);
      try {
        const result = await pool.query(
          "SELECT * FROM public.user WHERE email=$1",
          [profile.email],
        );
        if (result.rows.length !== 0) {
          const users = result.rows[0];
          return cb(null, users, { message: "Successfully authenticated!" });
        } else {
          const result = await pool.query(
            "INSERT INTO public.user(name,email,password) values($1,$2,$3) RETURNING *",
            [profile.displayName, profile.email, "google"],
          ); //use something new instead of Google
          const newUser = result.rows[0];
          return cb(null, newUser, { message: "Successfully authenticated!" });
        }
      } catch (err) {
        return cb(err, null);
      }
    },
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
