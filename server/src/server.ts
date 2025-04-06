import dotenv from 'dotenv';
import express, { Request, Response, NextFunction, Application } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback } from 'passport-google-oauth20';

import pool, { AppUser } from './db'; 
dotenv.config();

const ensureEnvVar = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    console.error(`Error: Environment variable ${varName} is not set.`);
    process.exit(1); // Exit if variable is missing
  }
  return value; // Return the value if found
};

const GOOGLE_CLIENT_ID = ensureEnvVar('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = ensureEnvVar('GOOGLE_CLIENT_SECRET');
const SESSION_SECRET = ensureEnvVar('SESSION_SECRET');
const SERVER_BASE_URL = ensureEnvVar('SERVER_BASE_URL');
const CLIENT_BASE_URL = ensureEnvVar('CLIENT_BASE_URL');

// Use the PORT environment variable passed from docker-compose
const PORT = ensureEnvVar('PORT'); // No default needed now

// --- Express App Initialization ---
const app: Application = express();

// --- Session Configuration ---
const sessionOptions: session.SessionOptions = {
  secret: SESSION_SECRET, // Use the environment variable we already validated
  resave: false,          // Add this to fix the deprecation warning
  saveUninitialized: false // Add this to fix the deprecation warning
};
app.use(session(sessionOptions));

// --- Passport Configuration ---
app.use(passport.initialize());
app.use(passport.session());

// Define the Google Strategy - MODIFIED
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${SERVER_BASE_URL}/auth/google/callback`,
  scope: ['profile', 'email']
},
  // Verify callback - MODIFIED to use database
  async (accessToken: string, refreshToken: string | undefined, profile: GoogleProfile, done: VerifyCallback) => {
    console.log('Google Profile Received:', profile.id, profile.displayName);
    const googleId = profile.id;
    const email = profile.emails && profile.emails[0].value; // Handle cases where email might not be present
    const displayName = profile.displayName;

    try {
      // Check if user already exists
      const findUserQuery = 'SELECT * FROM users WHERE google_id = $1';
      const { rows } = await pool.query<AppUser>(findUserQuery, [googleId]);

      if (rows.length > 0) {
        // User found, return existing user
        console.log(`User found: ${rows[0].display_name} (ID: ${rows[0].id})`);
        // Optional: Update email/display name if changed?
        // await pool.query('UPDATE users SET email = $1, display_name = $2 WHERE google_id = $3', [email, displayName, googleId]);
        return done(null, rows[0]); // Pass the user record from DB
      } else {
        // User not found, create new user
        console.log(`User not found, creating new user: ${displayName}`);
        const insertUserQuery = `
          INSERT INTO users (google_id, email, display_name)
          VALUES ($1, $2, $3)
          RETURNING *`; // Return the newly created row
        const { rows: newRows } = await pool.query<AppUser>(insertUserQuery, [
          googleId,
          email,
          displayName,
        ]);
        console.log(`User created: ${newRows[0].display_name} (ID: ${newRows[0].id})`);
        return done(null, newRows[0]); // Pass the newly created user record
      }
    } catch (err) {
      console.error('Error during database operation in Google Strategy:', err);
      return done(err, undefined); // Pass error to Passport
    }
  }
));

// --- Serialization and Deserialization - MODIFIED ---

// Store only the user ID from our database in the session
passport.serializeUser((user, done) => {
  // 'user' is the AppUser object from the DB (fetched or created in the strategy)
  done(null, (user as AppUser).id); // Store only the primary key id
});

// Retrieve the full user details from the database using the ID stored in the session
passport.deserializeUser(async (id: number, done) => {
    // 'id' is the user ID we stored via serializeUser
    console.log(`Deserializing user with ID: ${id}`);
    try {
        const { rows } = await pool.query<AppUser>('SELECT * FROM users WHERE id = $1', [id]);
        if (rows.length > 0) {
            done(null, rows[0]); // Found user, pass the full user object
        } else {
            // User not found in DB (perhaps deleted?), treat as unauthenticated
            console.warn(`User with ID ${id} not found during deserialization.`);
            done(null, false); // Indicate user not found/valid
        }
    } catch (err) {
        console.error(`Error deserializing user ID ${id}:`, err);
        done(err, null); // Pass error
    }
});


// --- Middleware to Extend Express Request Type - MODIFIED ---
// Tell Express that req.user is now our database AppUser type
declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface User extends AppUser {}
    }
}

// --- Routes ---

// Basic API test route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

// --- Authentication Routes ---

// 1. Start Google Authentication (keep as is)
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google Callback Route (keep as is) - relies on strategy/serialize/deserialize changes
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req: Request, res: Response) => {
    // Now req.user should be the AppUser object from deserializeUser
    console.log('Successfully authenticated, user from DB:', req.user?.display_name);
    res.redirect(CLIENT_BASE_URL || '/');
  }
);

// 3. Check Authentication Status - MODIFIED
app.get('/api/auth/status', (req: Request, res: Response) => {
  if (req.isAuthenticated() && req.user) {
    // req.user is now the AppUser object from the database
    console.log('Auth status check: User is authenticated:', req.user.display_name);
    res.json({
      authenticated: true,
      // Return data directly from our AppUser object
      user: {
        id: req.user.id, // Your internal DB ID
        displayName: req.user.display_name,
        email: req.user.email,
        googleId: req.user.google_id, // Expose if needed by client
        createdAt: req.user.created_at
        // Add other relevant fields from AppUser
      }
    });
  } else {
    console.log('Auth status check: User is NOT authenticated');
    res.status(401).json({ authenticated: false, user: null });
  }
});

// 4. Logout Route
app.get('/api/auth/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// 5. Authentication Failure Route
app.get('/auth/failure', (req: Request, res: Response) => {
  res.status(401).json({ success: false, message: 'Authentication failed' });
});


// --- Start Server ---
app.listen(PORT, () => {
  // Use the PORT variable which comes from the environment
  console.log(`Server listening on port ${PORT} (TypeScript)`);

  // Test DB connection on startup (optional)
  pool.query('SELECT NOW()', (err, res) => {
      if (err) {
          console.error("!!! Failed to connect to database on startup:", err);
      } else {
          console.log("--- Database connection verified on startup. Current time:", res.rows[0].now);
      }
  });
});