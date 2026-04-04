import pool from "../extra/databaseconnection.js";
import passport from "passport";

function checkAuthentication(req, res) {
  res.json({ Authenticated: req.isAuthenticated() });
}

function Signout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ signedout: true });
  });
}

async function Registration(req, res ,next) {
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
    return next(err);
  }
}

function Login(req, res, next) {
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
}


export default { checkAuthentication, Signout,Registration ,Login};
