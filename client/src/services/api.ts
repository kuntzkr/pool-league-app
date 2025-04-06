import { User, Team, Match, Game, TeamMember } from '../types';

// Base API URL
const API_BASE_URL = '/api';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// User API
export const userApi = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    return handleResponse<User[]>(response);
  },

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    return handleResponse<User>(response);
  },

  // Update user role
  async updateUserRole(userId: string, roleId: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId })
    });
    return handleResponse<User>(response);
  }
};

// Team API
export const teamApi = {
  // Get all teams
  async getAllTeams(): Promise<Team[]> {
    const response = await fetch(`${API_BASE_URL}/teams`);
    return handleResponse<Team[]>(response);
  },

  // Get team by ID
  async getTeamById(id: string): Promise<Team> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`);
    return handleResponse<Team>(response);
  },

  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`);
    return handleResponse<TeamMember[]>(response);
  },

  // Create team
  async createTeam(team: Partial<Team>): Promise<Team> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    return handleResponse<Team>(response);
  },

  // Add user to team
  async addUserToTeam(teamId: string, userId: string, isCaptain: boolean = false): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isCaptain })
    });
    return handleResponse<void>(response);
  },

  // Remove user from team
  async removeUserFromTeam(teamId: string, userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE'
    });
    return handleResponse<void>(response);
  },

  // Get current user's teams
  async getUserTeams(): Promise<Team[]> {
    const response = await fetch(`${API_BASE_URL}/user/teams`);
    return handleResponse<Team[]>(response);
  }
};

// Match API
export const matchApi = {
  // Get all matches
  async getAllMatches(): Promise<Match[]> {
    const response = await fetch(`${API_BASE_URL}/matches`);
    return handleResponse<Match[]>(response);
  },

  // Get match by ID
  async getMatchById(id: string): Promise<Match> {
    const response = await fetch(`${API_BASE_URL}/matches/${id}`);
    return handleResponse<Match>(response);
  },

  // Get match games
  async getMatchGames(matchId: string): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/games`);
    return handleResponse<Game[]>(response);
  },

  // Create match
  async createMatch(match: Partial<Match>): Promise<Match> {
    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: match.date,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        venue: match.venue,
        status: match.status || 'scheduled'
      })
    });
    return handleResponse<Match>(response);
  },

  // Update match score
  async updateMatchScore(
    matchId: string, 
    homeScore: number, 
    awayScore: number, 
    status: string = 'completed'
  ): Promise<Match> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeScore, awayScore, status })
    });
    return handleResponse<Match>(response);
  },

  // Add game to match
  async addGameToMatch(matchId: string, game: Partial<Game>): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homePlayerId: game.homePlayerId,
        awayPlayerId: game.awayPlayerId,
        winnerId: game.winnerId,
        gameNumber: game.gameNumber,
        gameType: game.gameType
      })
    });
    return handleResponse<Game>(response);
  },

  // Get current user's matches
  async getUserMatches(): Promise<Match[]> {
    const response = await fetch(`${API_BASE_URL}/user/matches`);
    return handleResponse<Match[]>(response);
  }
};
