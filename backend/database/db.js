/**
 * SQLite Database Connection for AlumniConnect
 * Vidyalankar Institute of Technology, Mumbai
 */

const fs = require('fs');
const path = require('path');

// SQLite connection helper
const dbPath = path.resolve(__dirname, 'aluminiconnect.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

function initializeDatabase() {
  console.log(`[Database] Initializing SQLite database at: ${dbPath}`);
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('[Database] Schema loaded successfully.');
    return { status: 'ready', dbPath, schemaSql };
  }
  return { status: 'pending', dbPath };
}

module.exports = {
  dbPath,
  initializeDatabase
};
