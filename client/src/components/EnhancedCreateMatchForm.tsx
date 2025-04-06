import React, { useState, useEffect } from 'react';
import { Team, Match, User, Game } from '../types';
import { teamApi, matchApi } from '../services/api';

interface EnhancedCreateMatchFormProps {
  teams: Team[];
  onCreateMatch: (match: Partial<Match>, games: Partial<Game>[]) => Promise<boolean>;
}

const EnhancedCreateMatchForm: React.FC<EnhancedCreateMatchFormProps> = ({ teams, onCreateMatch }) => {
  const [formData, setFormData] = useState<Partial<Match>>({
    date: new Date().toISOString().split('T')[0] + 'T19:00',
    homeTeamId: '',
    awayTeamId: '',
    venue: '',
    status: 'scheduled'
  });
  
  const [homeTeamMembers, setHomeTeamMembers] = useState<User[]>([]);
  const [awayTeamMembers, setAwayTeamMembers] = useState<User[]>([]);
  const [games, setGames] = useState<Partial<Game>[]>([]);
  const [numGames, setNumGames] = useState<number>(5); // Default to 5 games
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If home team is selected, pre-fill venue
    if (name === 'homeTeamId') {
      const selectedTeam = teams.find(team => team.id === value);
      if (selectedTeam?.venue) {
        setFormData(prev => ({ ...prev, venue: selectedTeam.venue || '' }));
      }
      
      // Fetch home team members
      fetchTeamMembers(value, 'home');
    }
    
    // If away team is selected, fetch members
    if (name === 'awayTeamId') {
      fetchTeamMembers(value, 'away');
    }
  };
  
  // Fetch team members
  const fetchTeamMembers = async (teamId: string, teamType: 'home' | 'away') => {
    if (!teamId) return;
    
    setIsLoadingMembers(true);
    try {
      const members = await teamApi.getTeamMembers(teamId);
      if (teamType === 'home') {
        setHomeTeamMembers(members);
      } else {
        setAwayTeamMembers(members);
      }
    } catch (error) {
      console.error(`Error fetching ${teamType} team members:`, error);
      setFormError(`Failed to load ${teamType} team members. Please try again.`);
    } finally {
      setIsLoadingMembers(false);
    }
  };
  
  // Update games array when number of games changes
  useEffect(() => {
    const newGames: Partial<Game>[] = [];
    for (let i = 0; i < numGames; i++) {
      newGames.push({
        gameNumber: i + 1,
        homePlayerId: '',
        awayPlayerId: '',
        gameType: '8-ball' // Default game type
      });
    }
    setGames(newGames);
  }, [numGames]);
  
  // Handle number of games change
  const handleNumGamesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNumGames(parseInt(e.target.value, 10));
  };
  
  // Handle game player selection
  const handleGamePlayerChange = (gameIndex: number, teamType: 'home' | 'away', playerId: string) => {
    const updatedGames = [...games];
    if (teamType === 'home') {
      updatedGames[gameIndex].homePlayerId = playerId;
    } else {
      updatedGames[gameIndex].awayPlayerId = playerId;
    }
    setGames(updatedGames);
  };
  
  // Handle game type change
  const handleGameTypeChange = (gameIndex: number, gameType: string) => {
    const updatedGames = [...games];
    updatedGames[gameIndex].gameType = gameType;
    setGames(updatedGames);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!formData.date || !formData.homeTeamId || !formData.awayTeamId || !formData.venue) {
      setFormError('Please fill in all required match fields');
      return;
    }
    
    // Validate teams are different
    if (formData.homeTeamId === formData.awayTeamId) {
      setFormError('Home team and away team must be different');
      return;
    }
    
    // Validate games
    const invalidGames = games.filter(game => !game.homePlayerId || !game.awayPlayerId);
    if (invalidGames.length > 0) {
      setFormError('Please select players for all games');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await onCreateMatch(formData, games);
      if (success) {
        // Reset form on success
        setFormData({
          date: new Date().toISOString().split('T')[0] + 'T19:00',
          homeTeamId: '',
          awayTeamId: '',
          venue: '',
          status: 'scheduled'
        });
        setHomeTeamMembers([]);
        setAwayTeamMembers([]);
        setGames([]);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError('Failed to create match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="enhanced-create-match-form">
      {formError && (
        <div className="form-error">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="match-details-section">
          <h3>Match Details</h3>
          
          <div className="form-group">
            <label htmlFor="date">Match Date & Time:</label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="homeTeamId">Home Team:</label>
            <select
              id="homeTeamId"
              name="homeTeamId"
              value={formData.homeTeamId}
              onChange={handleChange}
              required
            >
              <option value="">Select Home Team</option>
              {teams.map(team => (
                <option key={`home-${team.id}`} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="awayTeamId">Away Team:</label>
            <select
              id="awayTeamId"
              name="awayTeamId"
              value={formData.awayTeamId}
              onChange={handleChange}
              required
            >
              <option value="">Select Away Team</option>
              {teams.map(team => (
                <option 
                  key={`away-${team.id}`} 
                  value={team.id}
                  disabled={team.id === formData.homeTeamId}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="venue">Venue:</label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="numGames">Number of Games:</label>
            <select
              id="numGames"
              value={numGames}
              onChange={handleNumGamesChange}
            >
              {[1, 3, 5, 7, 9].map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {(formData.homeTeamId && formData.awayTeamId) && (
          <div className="games-section">
            <h3>Game Assignments</h3>
            
            {isLoadingMembers ? (
              <div>Loading team members...</div>
            ) : (
              <div className="games-list">
                {games.map((game, index) => (
                  <div key={index} className="game-item">
                    <div className="game-header">Game {game.gameNumber}</div>
                    
                    <div className="game-players">
                      <div className="player-select">
                        <label>Home Player:</label>
                        <select
                          value={game.homePlayerId}
                          onChange={(e) => handleGamePlayerChange(index, 'home', e.target.value)}
                          required
                        >
                          <option value="">Select Player</option>
                          {homeTeamMembers.map(player => (
                            <option key={player.id} value={player.id}>
                              {player.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="player-select">
                        <label>Away Player:</label>
                        <select
                          value={game.awayPlayerId}
                          onChange={(e) => handleGamePlayerChange(index, 'away', e.target.value)}
                          required
                        >
                          <option value="">Select Player</option>
                          {awayTeamMembers.map(player => (
                            <option key={player.id} value={player.id}>
                              {player.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="game-type-select">
                        <label>Game Type:</label>
                        <select
                          value={game.gameType}
                          onChange={(e) => handleGameTypeChange(index, e.target.value)}
                        >
                          <option value="8-ball">8-Ball</option>
                          <option value="9-ball">9-Ball</option>
                          <option value="10-ball">10-Ball</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting || isLoadingMembers}
          >
            {isSubmitting ? 'Creating...' : 'Create Match with Games'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedCreateMatchForm;
