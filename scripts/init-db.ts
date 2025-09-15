import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  const tempPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
  });

  
  // Now connect to the stockexchange database
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'stockexchange',
    user: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
  });

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../src/lib/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
