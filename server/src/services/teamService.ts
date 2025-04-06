import pool from '../db';
import { Team, TeamMember } from '../types';

/**
 * Team service for handling team-related operations
 */
export const teamService = {
  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      const query = `
        SELECT * FROM teams
        ORDER BY name
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error getting all teams:', error);
      throw error;
    }
  },

  /**
   * Get team by ID
   */
  async getTeamById(id: number): Promise<Team | null> {
    try {
      const query = `
        SELECT * FROM teams
        WHERE id = $1
      `;
      const { rows } = await pool.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error getting team with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get teams for a user
   */
  async getTeamsForUser(userId: number): Promise<Team[]> {
    try {
      const query = `
        SELECT t.* 
        FROM teams t
        JOIN user_teams ut ON t.id = ut.team_id
        WHERE ut.user_id = $1
        ORDER BY t.name
      `;
      const { rows } = await pool.query(query, [userId]);
      return rows;
    } catch (error) {
      console.error(`Error getting teams for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new team
   */
  async createTeam(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    try {
      const query = `
        INSERT INTO teams (name, venue, division)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        team.name,
        team.venue,
        team.division
      ]);
      return rows[0];
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  /**
   * Add user to team
   */
  async addUserToTeam(userId: number, teamId: number, isCaptain: boolean = false): Promise<void> {
    try {
      const query = `
        INSERT INTO user_teams (user_id, team_id, is_captain)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, team_id) 
        DO UPDATE SET is_captain = $3
      `;
      await pool.query(query, [userId, teamId, isCaptain]);
    } catch (error) {
      console.error(`Error adding user ${userId} to team ${teamId}:`, error);
      throw error;
    }
  },

  /**
   * Remove user from team
   */
  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    try {
      const query = `
        DELETE FROM user_teams
        WHERE user_id = $1 AND team_id = $2
      `;
      await pool.query(query, [userId, teamId]);
    } catch (error) {
      console.error(`Error removing user ${userId} from team ${teamId}:`, error);
      throw error;
    }
  },

  /**
   * Get team members
   */
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    try {
      const query = `
        SELECT u.id, u.display_name, u.email, ut.is_captain
        FROM users u
        JOIN user_teams ut ON u.id = ut.user_id
        WHERE ut.team_id = $1
        ORDER BY ut.is_captain DESC, u.display_name
      `;
      const { rows } = await pool.query(query, [teamId]);
      return rows;
    } catch (error) {
      console.error(`Error getting members for team ${teamId}:`, error);
      throw error;
    }
  }
};

export default teamService;
