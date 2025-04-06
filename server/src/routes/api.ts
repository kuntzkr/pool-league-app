import express, { Request, Response, NextFunction } from 'express';
import pool from '../db';

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [req.user.id]
    );

    if (rows.length > 0 && rows[0].name === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// User routes
router.get('/users', isAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users/:id', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/role', isAdmin, async (req: Request, res: Response): Promise<void> => {
  const { roleId } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *',
      [roleId, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Team routes
router.get('/teams', isAuthenticated, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM teams');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/teams/:id', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/teams/:id/members', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT u.*, ut.is_captain
       FROM user_teams ut
       JOIN users u ON ut.user_id = u.id
       WHERE ut.team_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching team members:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/teams', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  const { name, venue, division } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO teams (name, venue, division) VALUES ($1, $2, $3) RETURNING *',
      [name, venue, division]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/teams/:id/members', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  const { userId, isCaptain } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO user_teams (team_id, user_id, is_captain) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, userId, isCaptain]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding team member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teams for current user
router.get('/user/teams', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*
       FROM teams t
       JOIN user_teams ut ON t.id = ut.team_id
       WHERE ut.user_id = $1`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user teams:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Match routes
router.get('/matches', isAuthenticated, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM matches');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create match
router.post('/matches', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  const { date, homeTeamId, awayTeamId, venue, status = 'scheduled' } = req.body;
  try {
    // Validate required fields
    if (!date || !homeTeamId || !awayTeamId || !venue) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate teams are different
    if (homeTeamId === awayTeamId) {
      res.status(400).json({ error: 'Home team and away team must be different' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO matches
       (date, home_team_id, away_team_id, venue, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [date, homeTeamId, awayTeamId, venue, status, req.user!.id]
    );

    // Get team names for the response
    const teamsResult = await pool.query(
      'SELECT id, name FROM teams WHERE id IN ($1, $2)',
      [homeTeamId, awayTeamId]
    );

    const homeTeam = teamsResult.rows.find(team => team.id.toString() === homeTeamId.toString());
    const awayTeam = teamsResult.rows.find(team => team.id.toString() === awayTeamId.toString());

    // Combine match data with team names
    const matchWithTeamNames = {
      ...rows[0],
      homeTeamName: homeTeam?.name || 'Unknown',
      awayTeamName: awayTeam?.name || 'Unknown'
    };

    res.status(201).json(matchWithTeamNames);
  } catch (err) {
    console.error('Error creating match:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/matches/:id', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM matches WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching match:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/matches/:id/games', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM games WHERE match_id = $1', [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching match games:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/matches/:id/games', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  const { homePlayerId, awayPlayerId, winnerId, gameNumber, gameType } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO games
       (match_id, home_player_id, away_player_id, winner_id, game_number, game_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.params.id, homePlayerId, awayPlayerId, winnerId, gameNumber, gameType]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding game to match:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get matches for current user
router.get('/user/matches', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       JOIN user_teams htm ON ht.id = htm.team_id
       JOIN user_teams atm ON at.id = atm.team_id
       WHERE htm.user_id = $1 OR atm.user_id = $1`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user matches:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
