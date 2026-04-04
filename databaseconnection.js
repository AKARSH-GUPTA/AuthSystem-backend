import {Pool} from "pg";

const pool =  new Pool({
    connectionString: "postgresql://postgres:krishnagupta1300@db.ghmrdofusfwlwftaepgn.supabase.co:5432/postgres",

  // REQUIRED for Supabase (SSL)
  ssl: {
    rejectUnauthorized: false,
}});

export default pool;