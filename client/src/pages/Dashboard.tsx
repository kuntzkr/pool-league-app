import React, { useState, useEffect } from 'react';
import { User, Team, Match, Game } from '../types';
import { teamApi, matchApi, userApi } from '../services/api';
import TeamSelector from '../components/TeamSelector';
import UpcomingMatches from '../components/UpcomingMatches';
import CreateMatchForm from '../components/CreateMatchForm';
import CreateTeamForm from '../components/CreateTeamForm';
import AddTeamMemberForm from '../components/AddTeamMemberForm';
import EnhancedCreateMatchForm from '../components/EnhancedCreateMatchForm';
import '../components/Dashboard.css';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'myTeams' | 'allTeams' | 'allMatches' | 'users' | 'createTeam' | 'addTeamMember' | 'createMatch' | 'enhancedCreateMatch'
  >('myTeams');

  // Check if user is admin (role_id = 1 or role_name = 'admin')
  const isAdmin = user.role_id === 1 || user.role_name === 'admin';
  const isPlayer = teams.length > 0; // User is a player if they belong to at least one team

  console.log('User role info:', user.role_id, user.role_name, 'isAdmin:', isAdmin);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // For all users
        const userTeams = await teamApi.getUserTeams();
        const userMatches = await matchApi.getUserMatches();

        setTeams(userTeams);
        setMatches(userMatches);

        // Set the first team as selected by default
        if (userTeams.length > 0) {
          setSelectedTeam(userTeams[0]);
        }

        // For admin users, fetch additional data
        if (isAdmin) {
          const [allTeamsData, allMatchesData, usersData] = await Promise.all([
            teamApi.getAllTeams(),
            matchApi.getAllMatches(),
            userApi.getAllUsers()
          ]);

          setAllTeams(allTeamsData);
          setAllMatches(allMatchesData);
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');

        // Fallback to mock data for development
        const mockTeams: Team[] = [
          { id: '1', name: 'The Cue Masters', venue: 'Downtown Billiards', division: 'A' },
          { id: '2', name: 'Pocket Rockets', venue: 'Eastside Pool Hall', division: 'B' },
          { id: '3', name: 'Break & Run', venue: 'Westside Lounge', division: 'A' },
        ];

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
          }
        ];

        setTeams(mockTeams);
        setMatches(mockMatches);
        setAllTeams(mockTeams);
        setAllMatches(mockMatches);

        // Set the first team as selected by default
        if (mockTeams.length > 0) {
          setSelectedTeam(mockTeams[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, user.id]);

  // Filter matches for the selected team
  const filteredMatches = matches.filter(match =>
    selectedTeam && (match.homeTeamId === selectedTeam.id || match.awayTeamId === selectedTeam.id)
  );

  // Handle team selection
  const handleTeamSelect = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    setSelectedTeam(team || null);
  };

  // Handle team creation
  const handleCreateTeam = async (newTeam: Team) => {
    try {
      // Add the new team to the lists
      setAllTeams(prevTeams => [...prevTeams, newTeam]);

      // Switch to the all teams tab
      setActiveTab('allTeams');
    } catch (err) {
      console.error('Error handling team creation:', err);
      setError('Failed to handle team creation. Please try again.');
    }
  };

  // Handle team member addition
  const handleTeamMemberAdded = () => {
    // Refresh the teams data
    const refreshTeams = async () => {
      try {
        const [userTeams, allTeamsData] = await Promise.all([
          teamApi.getUserTeams(),
          teamApi.getAllTeams()
        ]);

        setTeams(userTeams);
        setAllTeams(allTeamsData);

        // Switch to the all teams tab
        setActiveTab('allTeams');
      } catch (err) {
        console.error('Error refreshing teams:', err);
        setError('Failed to refresh teams. Please try again.');
      }
    };

    refreshTeams();
  };

  // Handle match creation
  const handleCreateMatch = async (newMatch: Partial<Match>) => {
    try {
      const createdMatch = await matchApi.createMatch(newMatch);
      setAllMatches(prevMatches => [...prevMatches, createdMatch]);
      setActiveTab('allMatches');
      return true;
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Failed to create match. Please try again.');
      return false;
    }
  };

  // Handle enhanced match creation with games
  const handleEnhancedCreateMatch = async (newMatch: Partial<Match>, games: Partial<Game>[]) => {
    try {
      // First create the match
      const createdMatch = await matchApi.createMatch(newMatch);

      // Then add all the games
      const gamePromises = games.map(game => {
        return matchApi.addGameToMatch(createdMatch.id, {
          ...game,
          matchId: createdMatch.id
        });
      });

      await Promise.all(gamePromises);

      // Update the matches list
      setAllMatches(prevMatches => [...prevMatches, createdMatch]);

      // Switch to the all matches tab
      setActiveTab('allMatches');
      return true;
    } catch (err) {
      console.error('Error creating match with games:', err);
      setError('Failed to create match with games. Please try again.');
      return false;
    }
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
          <span>Welcome, {user.displayName}! {isAdmin && '(Admin)'}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Show message if user is not a player */}
      {!isPlayer && !isAdmin && (
        <div className="not-player-message">
          <h2>Welcome to the Pool League App</h2>
          <p>You are not currently a member of any team. Please contact an administrator to be added to a team.</p>
        </div>
      )}

      {/* Admin Tabs */}
      {isAdmin && (
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'myTeams' ? 'active' : ''}`}
            onClick={() => setActiveTab('myTeams')}
          >
            My Teams
          </button>
          <button
            className={`admin-tab ${activeTab === 'allTeams' ? 'active' : ''}`}
            onClick={() => setActiveTab('allTeams')}
          >
            All Teams
          </button>
          <button
            className={`admin-tab ${activeTab === 'createTeam' ? 'active' : ''}`}
            onClick={() => setActiveTab('createTeam')}
          >
            Create Team
          </button>
          <button
            className={`admin-tab ${activeTab === 'addTeamMember' ? 'active' : ''}`}
            onClick={() => setActiveTab('addTeamMember')}
          >
            Add Team Member
          </button>
          <button
            className={`admin-tab ${activeTab === 'allMatches' ? 'active' : ''}`}
            onClick={() => setActiveTab('allMatches')}
          >
            All Matches
          </button>
          <button
            className={`admin-tab ${activeTab === 'createMatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('createMatch')}
          >
            Create Match
          </button>
          <button
            className={`admin-tab ${activeTab === 'enhancedCreateMatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('enhancedCreateMatch')}
          >
            Create Match with Players
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>
      )}

      {/* Player Tabs (non-admin) */}
      {!isAdmin && isPlayer && (
        <div className="player-tabs">
          <button
            className={`player-tab ${activeTab === 'myTeams' ? 'active' : ''}`}
            onClick={() => setActiveTab('myTeams')}
          >
            My Teams
          </button>
        </div>
      )}

      <main className={`dashboard-content ${isAdmin ? 'admin-content' : ''}`}>
        {/* Regular user view or admin's My Teams tab */}
        {(!isAdmin || activeTab === 'myTeams') && (
          <>
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
          </>
        )}

        {/* Admin All Teams tab */}
        {isAdmin && activeTab === 'allTeams' && (
          <section className="teams-section">
            <h2>All Teams</h2>
            {allTeams.length > 0 ? (
              <div className="teams-list">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Venue</th>
                      <th>Division</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTeams.map(team => (
                      <tr key={team.id}>
                        <td>{team.name}</td>
                        <td>{team.venue || 'N/A'}</td>
                        <td>{team.division || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No teams found.</p>
            )}
          </section>
        )}

        {/* Admin All Matches tab */}
        {isAdmin && activeTab === 'allMatches' && (
          <section className="matches-section">
            <h2>All Matches</h2>
            {allMatches.length > 0 ? (
              <div className="matches-list">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Home Team</th>
                      <th>Away Team</th>
                      <th>Venue</th>
                      <th>Status</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMatches.map(match => (
                      <tr key={match.id}>
                        <td>{new Date(match.date).toLocaleDateString()}</td>
                        <td>{match.homeTeamName}</td>
                        <td>{match.awayTeamName}</td>
                        <td>{match.venue}</td>
                        <td>{match.status}</td>
                        <td>
                          {match.homeScore !== undefined && match.awayScore !== undefined
                            ? `${match.homeScore} - ${match.awayScore}`
                            : 'Not played'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No matches found.</p>
            )}
          </section>
        )}

        {/* Admin Users tab */}
        {isAdmin && activeTab === 'users' && (
          <section className="users-section">
            <h2>All Users</h2>
            {users.length > 0 ? (
              <div className="users-list">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.displayName}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>{user.role_name || 'Player'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No users found.</p>
            )}
          </section>
        )}

        {/* Admin Create Team tab */}
        {isAdmin && activeTab === 'createTeam' && (
          <section className="create-section">
            <h2>Create New Team</h2>
            <CreateTeamForm onTeamCreated={handleCreateTeam} />
          </section>
        )}

        {/* Admin Add Team Member tab */}
        {isAdmin && activeTab === 'addTeamMember' && (
          <section className="create-section">
            <h2>Add Team Member</h2>
            <div className="team-selection">
              <label htmlFor="teamSelect">Select Team:</label>
              <select
                id="teamSelect"
                value={selectedTeamForMembers?.id || ''}
                onChange={(e) => {
                  const team = allTeams.find(t => t.id === e.target.value);
                  setSelectedTeamForMembers(team || null);
                }}
              >
                <option value="">-- Select a team --</option>
                {allTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {selectedTeamForMembers && (
              <AddTeamMemberForm
                team={selectedTeamForMembers}
                onMemberAdded={handleTeamMemberAdded}
              />
            )}
          </section>
        )}

        {/* Admin Create Match tab */}
        {isAdmin && activeTab === 'createMatch' && (
          <section className="create-section">
            <h2>Create New Match</h2>
            <CreateMatchForm
              teams={allTeams}
              onCreateMatch={handleCreateMatch}
            />
          </section>
        )}

        {/* Admin Enhanced Create Match tab */}
        {isAdmin && activeTab === 'enhancedCreateMatch' && (
          <section className="create-section">
            <h2>Create Match with Player Assignments</h2>
            <EnhancedCreateMatchForm
              teams={allTeams}
              onCreateMatch={handleEnhancedCreateMatch}
            />
          </section>
        )}
      </main>

      {/* Dashboard Footer */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} Pool League App. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;