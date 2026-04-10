const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prices.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Keep database connection open
db.configure('busyTimeout', 10000);

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode = WAL', (err) => {
  if (err) console.error('Error enabling WAL mode:', err);
  else console.log('WAL mode enabled');
});

// Initialize database schema
const initializeDatabase = () => {
  db.serialize(() => {
    // Create categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating categories table:', err);
    });

    // Create subcategories table
    db.run(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        href TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE(category_id, name)
      )
    `, (err) => {
      if (err) console.error('Error creating subcategories table:', err);
    });

    // Create tasks table (роботи/services)
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subcategory_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        unit TEXT DEFAULT 'грн/m^2',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
        UNIQUE(subcategory_id, name)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating tasks table:', err);
      } else {
        console.log('Database schema initialized');
      }
    });
  });
};

// Helper functions for database operations
const db_run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const db_get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const db_all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Clear all data from database
const clearDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM tasks', (err) => {
        if (err) reject(err);
        else {
          db.run('DELETE FROM subcategories', (err) => {
            if (err) reject(err);
            else {
              db.run('DELETE FROM categories', (err) => {
                if (err) reject(err);
                else resolve();
              });
            };
          });
        }
      });
    });
  });
};

module.exports = {
  db,
  initializeDatabase,
  db_run,
  db_get,
  db_all,
  clearDatabase
};
