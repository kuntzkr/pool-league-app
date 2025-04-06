import React from 'react';
import { Team } from '../types';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ teams, selectedTeamId, onSelectTeam }) => {
  return (
    <div className="team-selector">
      <div className="team-tabs">
        {teams.map(team => (
          <button
            key={team.id}
            className={`team-tab ${selectedTeamId === team.id ? 'active' : ''}`}
            onClick={() => onSelectTeam(team.id)}
          >
            {team.name}
          </button>
        ))}
      </div>
      
      {/* Display selected team details */}
      {selectedTeamId && (
        <div className="selected-team-details">
          {teams
            .filter(team => team.id === selectedTeamId)
            .map(team => (
              <div key={team.id} className="team-detail-card">
                <h3>{team.name}</h3>
                {team.division && <p><strong>Division:</strong> {team.division}</p>}
                {team.venue && <p><strong>Home Venue:</strong> {team.venue}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TeamSelector;
