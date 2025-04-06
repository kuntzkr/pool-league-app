import React, { useState } from 'react';
import { Team } from '../types';
import { teamApi } from '../services/api';

interface CreateTeamFormProps {
  onTeamCreated: (team: Team) => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({ onTeamCreated }) => {
  const [formData, setFormData] = useState<Partial<Team>>({
    name: '',
    venue: '',
    division: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!formData.name) {
      setFormError('Team name is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newTeam = await teamApi.createTeam(formData);
      onTeamCreated(newTeam);
      
      // Reset form on success
      setFormData({
        name: '',
        venue: '',
        division: ''
      });
    } catch (error) {
      console.error('Error creating team:', error);
      setFormError('Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-team-form">
      {formError && (
        <div className="form-error">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Team Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="venue">Venue:</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="division">Division:</label>
          <input
            type="text"
            id="division"
            name="division"
            value={formData.division}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeamForm;
