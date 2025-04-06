// User types
export interface User {
  id: string;
  displayName: string;
  email?: string;
  role_id?: number;
  role_name?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: User | null;
}

// Team types
export interface Team {
  id: string;
  name: string;
  venue?: string;
  division?: string;
}

export interface TeamMember {
  id: string;
  displayName: string;
  email?: string;
  isCaptain: boolean;
}

// Match types
export interface Match {
  id: string;
  date: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  venue: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  homeScore?: number;
  awayScore?: number;
  createdBy?: string;
  createdByName?: string;
}

// Game types
export interface Game {
  id: string;
  matchId: string;
  homePlayerId: string;
  homePlayerName: string;
  awayPlayerId: string;
  awayPlayerName: string;
  winnerId?: string;
  winnerName?: string;
  gameNumber: number;
  gameType?: string;
}