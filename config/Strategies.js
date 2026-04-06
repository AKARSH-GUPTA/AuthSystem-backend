import pool from "./databaseconnection.js";

async function Local(username, password, cb) {
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
}

async function Google(accessToken, refreshToken, profile, cb) {
  try {
    const result = await pool.query(
      "SELECT * FROM public.user WHERE email=$1",
      [profile.emails[0].value],
    );
    if (result.rows.length !== 0) {
      const users = result.rows[0];
      return cb(null, users, { message: "Successfully authenticated!" });
    } else {
      const result = await pool.query(
        "INSERT INTO public.user(name,email,password) values($1,$2,$3) RETURNING *",
        [profile.displayName, profile.emails[0].value, "google"],
      ); //use something new instead of Google
      const newUser = result.rows[0];
      return cb(null, newUser, { message: "Successfully authenticated!" });
    }
  } catch (err) {
    return cb(err, null);
  }
}

export default {Local,Google};