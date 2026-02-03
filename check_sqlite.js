const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../backend/prisma/dev.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.all("SELECT * FROM User", [], (err, rows) => {
        if (err) {
            console.error('Error querying users:', err.message);
            // Try lowercase 'users' just in case
            db.all("SELECT * FROM users", [], (err2, rows2) => {
                if (err2) {
                    console.error('Error querying users (lowercase):', err2.message);
                } else {
                    if (rows2.length > 0) {
                        console.log(`Found ${rows2.length} users (lowercase table):`);
                        console.log(rows2.slice(0, 3)); // Print first 3
                    } else {
                        console.log('No users found in "users" table.');
                    }
                }
            });
        } else {
            if (rows.length > 0) {
                console.log(`Found ${rows.length} users (PascalCase table):`);
                console.log(rows.slice(0, 3)); // Print first 3
            } else {
                console.log('No users found in "User" table.');
            }
        }
    });
});

db.close();
