const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'db', 'yesilmarket.sqlite');
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('schema.sql bulunamadı.');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');
const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, 'utf-8') : '';

const db = new Database(dbPath);

db.exec('PRAGMA foreign_keys = OFF;');
db.exec(schema);
db.exec('PRAGMA foreign_keys = ON;');

if (seed.trim()) {
  db.exec(seed);
}

db.close();

console.log('Veritabanı sıfırlandı ve örnek veriler yüklendi.');
