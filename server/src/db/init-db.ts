import fs from 'fs';
import path from 'path';
import pool from '../db';

/**
 * Initialize the database with the schema
 */
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema SQL
    await pool.query(schemaSql);
    
    console.log('Database schema initialized successfully');
    
    // Check if admin user exists, create one if not
    const { rows } = await pool.query('SELECT * FROM users WHERE role_id = (SELECT id FROM roles WHERE name = $1)', ['admin']);
    
    if (rows.length === 0) {
      console.log('Creating default admin user...');
      
      // Get the admin role ID
      const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
      const adminRoleId = roleResult.rows[0]?.id;
      
      if (adminRoleId) {
        // Create a default admin user if none exists
        await pool.query(
          'INSERT INTO users (google_id, email, display_name, role_id) VALUES ($1, $2, $3, $4)',
          ['admin_google_id', 'admin@pooleague.com', 'System Administrator', adminRoleId]
        );
        console.log('Default admin user created');
      } else {
        console.error('Admin role not found');
      }
    } else {
      console.log('Admin user already exists');
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase;
