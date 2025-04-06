-- Schema for Pool League App

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table (extending the existing users table with role)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    venue VARCHAR(100),
    division VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Team relationship (many-to-many)
CREATE TABLE IF NOT EXISTS user_teams (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    is_captain BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    venue VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- Individual games within a match
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    home_player_id INTEGER REFERENCES users(id),
    away_player_id INTEGER REFERENCES users(id),
    winner_id INTEGER REFERENCES users(id),
    game_number INTEGER NOT NULL,
    game_type VARCHAR(50), -- e.g., '8-ball', '9-ball'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_players CHECK (home_player_id != away_player_id)
);

-- Insert default roles
INSERT INTO roles (name, description) 
VALUES 
    ('admin', 'Administrator with full access'),
    ('captain', 'Team captain with team management access'),
    ('player', 'Regular player')
ON CONFLICT (name) DO NOTHING;
