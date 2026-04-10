const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prices.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

db.all('SELECT id, name, price, unit FROM tasks LIMIT 5', (err, rows) => {
  if (err) {
    console.error('Query error:', err);
  } else {
    console.log('Tasks in database:');
    console.table(rows);
  }
  db.close();
  process.exit(0);
});
