require('dotenv').config({ path: '.env' });
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

async function ensureDatabase() {
  const admin = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await admin.connect();
  const dbName = process.env.DB_NAME;
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

  if (!exists.rowCount) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database ${dbName}`);
  } else {
    console.log(`Database ${dbName} already exists`);
  }

  await admin.end();
}

async function applySchema() {
  const sqlPath = path.join(__dirname, '..', 'sql', '001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const app = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await app.connect();
  await app.query(sql);
  console.log('Applied sql/001_init.sql');
  await app.end();
}

async function main() {
  await ensureDatabase();
  await applySchema();
}

main().catch((error) => {
  console.error('DB bootstrap failed:', error.message);
  process.exit(1);
});
