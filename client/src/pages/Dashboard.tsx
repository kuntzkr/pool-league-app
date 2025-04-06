import React, { useState, useEffect } from 'react';
import { User, Team, Match } from '../types';
import TeamSelector from '../components/TeamSelector';
import UpcomingMatches from '../components/UpcomingMatches';
import '../components/Dashboard.css';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Mock data for demonstration purposes
  useEffect(() => {
    // Simulate API call to fetch user's teams
    const mockTeams: Team[] = [
      { id: '1', name: 'The Cue Masters', venue: 'Downtown Billiards', division: 'A' },
      { id: '2', name: 'Pocket Rockets', venue: 'Eastside Pool Hall', division: 'B' },
      { id: '3', name: 'Break & Run', venue: 'Westside Lounge', division: 'A' },
    ];

    // Simulate API call to fetch matches
    const mockMatches: Match[] = [
      {
        id: '101',
        date: '2025-04-15T19:00:00',
        homeTeamId: '1',
        homeTeamName: 'The Cue Masters',
        awayTeamId: '4',
        awayTeamName: 'Chalk It Up',
        venue: 'Downtown Billiards',
        status: 'scheduled'
      },
      {
        id: '102',
        date: '2025-04-22T19:00:00',
        homeTeamId: '5',
        homeTeamName: 'Eight Ball Wizards',
        awayTeamId: '1',
        awayTeamName: 'The Cue Masters',
        venue: 'Northside Pool Club',
        status: 'scheduled'
      },
      {
        id: '103',
        date: '2025-04-10T19:00:00',
        homeTeamId: '2',
        homeTeamName: 'Pocket Rockets',
        awayTeamId: '6',
        awayTeamName: 'Straight Shooters',
        venue: 'Eastside Pool Hall',
        status: 'scheduled'
      },
      {
        id: '104',
        date: '2025-04-17T19:00:00',
        homeTeamId: '7',
        homeTeamName: 'Bank Shot Bandits',
        awayTeamId: '2',
        awayTeamName: 'Pocket Rockets',
        venue: 'Southside Billiards',
        status: 'scheduled'
      },
      {
        id: '105',
        date: '2025-04-12T19:00:00',
        homeTeamId: '3',
        homeTeamName: 'Break & Run',
        awayTeamId: '8',
        awayTeamName: "Rack 'Em Up",
        venue: 'Westside Lounge',
        status: 'scheduled'
      }
    ];

    setTeams(mockTeams);
    setMatches(mockMatches);

    // Set the first team as selected by default
    if (mockTeams.length > 0) {
      setSelectedTeam(mockTeams[0]);
    }

    setLoading(false);
  }, []);

  // Filter matches for the selected team
  const filteredMatches = matches.filter(match =>
    selectedTeam && (match.homeTeamId === selectedTeam.id || match.awayTeamId === selectedTeam.id)
  );

  // Handle team selection
  const handleTeamSelect = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    setSelectedTeam(team || null);
  };

  // Logout handler
  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Pool League Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.displayName}!</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="teams-section">
          <h2>Your Teams</h2>
          {teams.length > 0 ? (
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeam?.id || ''}
              onSelectTeam={handleTeamSelect}
            />
          ) : (
            <p>You are not a member of any teams yet.</p>
          )}
        </section>

        <section className="matches-section">
          <h2>Upcoming Matches</h2>
          {selectedTeam ? (
            filteredMatches.length > 0 ? (
              <UpcomingMatches matches={filteredMatches} teamId={selectedTeam.id} />
            ) : (
              <p>No upcoming matches for {selectedTeam.name}.</p>
            )
          ) : (
            <p>Select a team to view upcoming matches.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;