import React from 'react';
import { Match } from '../types';

interface UpcomingMatchesProps {
  matches: Match[];
  teamId: string;
}

const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({ matches, teamId }) => {
  // Sort matches by date (earliest first)
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format date for display
  const formatMatchDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine if the team is home or away
  const isHomeTeam = (match: Match): boolean => {
    return match.homeTeamId === teamId;
  };

  return (
    <div className="upcoming-matches">
      {sortedMatches.map(match => (
        <div key={match.id} className="match-card">
          <div className="match-date">
            {formatMatchDate(match.date)}
          </div>
          
          <div className="match-teams">
            <div className={`team ${isHomeTeam(match) ? 'home-team highlight' : 'home-team'}`}>
              {match.homeTeamName}
              {isHomeTeam(match) && <span className="team-indicator"> (Your Team)</span>}
            </div>
            <div className="vs">vs</div>
            <div className={`team ${!isHomeTeam(match) ? 'away-team highlight' : 'away-team'}`}>
              {match.awayTeamName}
              {!isHomeTeam(match) && <span className="team-indicator"> (Your Team)</span>}
            </div>
          </div>
          
          <div className="match-venue">
            <strong>Venue:</strong> {match.venue}
          </div>
          
          {match.status === 'completed' && match.score && (
            <div className="match-score">
              <strong>Final Score:</strong> {match.homeTeamName} {match.score.home} - {match.score.away} {match.awayTeamName}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UpcomingMatches;
