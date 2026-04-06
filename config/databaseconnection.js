import {Pool} from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool =  new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,

  // REQUIRED for Supabase (SSL)
  ssl: {
    rejectUnauthorized: false,
}});

export default pool;