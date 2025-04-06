import { Pool } from 'pg';

// The Pool manages multiple client connections
// It reads connection details from environment variables by default:
// PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// Our docker-compose setup provides these via DB_HOST etc.,
// but the 'pg' library understands the standard PG vars.
// We can map them explicitly if needed or rely on defaults.
// Let's rely on defaults matching our .env names assuming pg reads them,
// Or map explicitly for clarity.

// Make sure to convert environment variables to strings to avoid the SASL error
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',         // From .env via docker-compose
    port: parseInt(process.env.DB_PORT || '5433', 10), // From .env via docker-compose
    database: process.env.DB_NAME || 'pool_league_db',       // From .env via docker-compose
    user: process.env.DB_USER || 'pooluser',         // From .env via docker-compose
    password: String(process.env.DB_PASSWORD || 'poolsecretpassword'),   // Explicitly convert to string
    // Optional settings:
    // max: 20, // max number of clients in the pool
    // idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    // connectionTimeoutMillis: 2000, // how long to wait for a connection attempt
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1); // Exit the process on critical DB errors
});

export default pool;

export interface AppUser {
    id: number; // Or string if using UUIDs
    google_id: string;
    email: string | null;
    display_name: string | null;
    created_at: Date;
    role_id?: number;
    role_name?: string;
}