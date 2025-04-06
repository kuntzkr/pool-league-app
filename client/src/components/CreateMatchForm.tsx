import React, { useState } from 'react';
import { Team, Match } from '../types';

interface CreateMatchFormProps {
  teams: Team[];
  onCreateMatch: (match: Partial<Match>) => Promise<boolean>;
}

const CreateMatchForm: React.FC<CreateMatchFormProps> = ({ teams, onCreateMatch }) => {
  const [formData, setFormData] = useState<Partial<Match>>({
    date: new Date().toISOString().split('T')[0] + 'T19:00',
    homeTeamId: '',
    awayTeamId: '',
    venue: '',
    status: 'scheduled'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!formData.date || !formData.homeTeamId || !formData.awayTeamId || !formData.venue) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    // Validate teams are different
    if (formData.homeTeamId === formData.awayTeamId) {
      setFormError('Home team and away team must be different');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await onCreateMatch(formData);
      if (success) {
        // Reset form on success
        setFormData({
          date: new Date().toISOString().split('T')[0] + 'T19:00',
          homeTeamId: '',
          awayTeamId: '',
          venue: '',
          status: 'scheduled'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError('Failed to create match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-match-form">
      {formError && (
        <div className="form-error">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
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
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Match'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMatchForm;
