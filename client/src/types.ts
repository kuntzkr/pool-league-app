export interface User {
  id: string; // Google ID is a string
  displayName: string;
  email?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: User | null;
}

export interface Team {
  id: string;
  name: string;
  venue?: string;
  division?: string;
  players?: string[];
}

export interface Match {
  id: string;
  date: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  venue: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  score?: {
    home: number;
    away: number;
  };
}