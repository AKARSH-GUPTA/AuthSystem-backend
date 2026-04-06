import express from "express";
import passport from "passport";
import authControllers from "../controller/user-controller.js";
import dotenv from "dotenv";
dotenv.config(); 

const router = express.Router();

router.get("/authentication", authControllers.checkAuthentication);
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
// router.get(
//   "/auth/google/authenticationsystem",
//   passport.authenticate("google", {
//     successRedirect: `${process.env.CLIENT_URL}/`,
//     failureRedirect: `${process.env.CLIENT_URL}/login`,
//   }),
// );
router.get("/auth/google/authenticationsystem",
  passport.authenticate("google", { failureRedirect:`${process.env.CLIENT_URL}/login`}),
  (req, res) => {

    req.session.save(() => {
      res.redirect(`${process.env.CLIENT_URL}/`);
    });

  }
);
router.get("/signout",authControllers.Signout);
router.post("/register",authControllers.Registration);
router.post("/login",authControllers.Login);


export default router;
