import express from "express";
import passport from "passport";
import {Strategy} from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import strategies from "../extra/Strategies.js";
import authControllers from "../controller/user-controller.js";
import dotenv from "dotenv";
dotenv.config(); 

const router = express.Router();

router.get("/authentication", authControllers.checkAuthentication);
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/auth/google/authenticationsystem",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/welcome",
    failureRedirect: "http://localhost:5173/login",
  }),
);
router.get("/signout",authControllers.Signout);
router.post("/register",authControllers.Registration);
router.post("/login",authControllers.Login);


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

export default router;