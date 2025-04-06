import pool from '../db';
import { Match, Game, MatchWithTeams } from '../types';

/**
 * Match service for handling match-related operations
 */
export const matchService = {
  /**
   * Get all matches
   */
  async getAllMatches(): Promise<MatchWithTeams[]> {
    try {
      const query = `
        SELECT m.*, 
          ht.name as home_team_name, 
          at.name as away_team_name,
          u.display_name as created_by_name
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN users u ON m.created_by = u.id
        ORDER BY m.date DESC
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error getting all matches:', error);
      throw error;
    }
  },

  /**
   * Get match by ID
   */
  async getMatchById(id: number): Promise<MatchWithTeams | null> {
    try {
      const query = `
        SELECT m.*, 
          ht.name as home_team_name, 
          at.name as away_team_name,
          u.display_name as created_by_name
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN users u ON m.created_by = u.id
        WHERE m.id = $1
      `;
      const { rows } = await pool.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error getting match with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get matches for a team
   */
  async getMatchesForTeam(teamId: number): Promise<MatchWithTeams[]> {
    try {
      const query = `
        SELECT m.*, 
          ht.name as home_team_name, 
          at.name as away_team_name,
          u.display_name as created_by_name
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN users u ON m.created_by = u.id
        WHERE m.home_team_id = $1 OR m.away_team_id = $1
        ORDER BY m.date
      `;
      const { rows } = await pool.query(query, [teamId]);
      return rows;
    } catch (error) {
      console.error(`Error getting matches for team ${teamId}:`, error);
      throw error;
    }
  },

  /**
   * Get matches for a user (via their teams)
   */
  async getMatchesForUser(userId: number): Promise<MatchWithTeams[]> {
    try {
      const query = `
        SELECT DISTINCT m.*, 
          ht.name as home_team_name, 
          at.name as away_team_name,
          u.display_name as created_by_name
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN users u ON m.created_by = u.id
        JOIN user_teams ut ON (ut.team_id = m.home_team_id OR ut.team_id = m.away_team_id)
        WHERE ut.user_id = $1
        ORDER BY m.date
      `;
      const { rows } = await pool.query(query, [userId]);
      return rows;
    } catch (error) {
      console.error(`Error getting matches for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new match
   */
  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match> {
    try {
      const query = `
        INSERT INTO matches (
          date, home_team_id, away_team_id, venue, 
          status, home_score, away_score, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        match.date,
        match.home_team_id,
        match.away_team_id,
        match.venue,
        match.status || 'scheduled',
        match.home_score,
        match.away_score,
        match.created_by
      ]);
      return rows[0];
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  /**
   * Update match score
   */
  async updateMatchScore(
    matchId: number, 
    homeScore: number, 
    awayScore: number, 
    status: string = 'completed'
  ): Promise<Match | null> {
    try {
      const query = `
        UPDATE matches
        SET home_score = $1, away_score = $2, status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      const { rows } = await pool.query(query, [homeScore, awayScore, status, matchId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error updating score for match ${matchId}:`, error);
      throw error;
    }
  },

  /**
   * Add a game to a match
   */
  async addGameToMatch(game: Omit<Game, 'id' | 'created_at'>): Promise<Game> {
    try {
      const query = `
        INSERT INTO games (
          match_id, home_player_id, away_player_id, 
          winner_id, game_number, game_type
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        game.match_id,
        game.home_player_id,
        game.away_player_id,
        game.winner_id,
        game.game_number,
        game.game_type
      ]);
      return rows[0];
    } catch (error) {
      console.error(`Error adding game to match ${game.match_id}:`, error);
      throw error;
    }
  },

  /**
   * Get games for a match
   */
  async getGamesForMatch(matchId: number): Promise<Game[]> {
    try {
      const query = `
        SELECT g.*,
          hp.display_name as home_player_name,
          ap.display_name as away_player_name,
          w.display_name as winner_name
        FROM games g
        JOIN users hp ON g.home_player_id = hp.id
        JOIN users ap ON g.away_player_id = ap.id
        LEFT JOIN users w ON g.winner_id = w.id
        WHERE g.match_id = $1
        ORDER BY g.game_number
      `;
      const { rows } = await pool.query(query, [matchId]);
      return rows;
    } catch (error) {
      console.error(`Error getting games for match ${matchId}:`, error);
      throw error;
    }
  }
};

export default matchService;
