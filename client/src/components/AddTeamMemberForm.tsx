import React, { useState, useEffect } from 'react';
import { User, Team } from '../types';
import { teamApi, userApi } from '../services/api';

interface AddTeamMemberFormProps {
  team: Team;
  onMemberAdded: () => void;
}

const AddTeamMemberForm: React.FC<AddTeamMemberFormProps> = ({ team, onMemberAdded }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isCaptain, setIsCaptain] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await userApi.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setFormError('Failed to load users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle user selection
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
  };

  // Handle captain checkbox
  const handleCaptainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCaptain(e.target.checked);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!selectedUserId) {
      setFormError('Please select a user');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await teamApi.addUserToTeam(team.id, selectedUserId, isCaptain);
      onMemberAdded();
      
      // Reset form on success
      setSelectedUserId('');
      setIsCaptain(false);
    } catch (error) {
      console.error('Error adding team member:', error);
      setFormError('Failed to add team member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="add-team-member-form">
      {formError && (
        <div className="form-error">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId">Select User:</label>
          <select
            id="userId"
            value={selectedUserId}
            onChange={handleUserChange}
            required
          >
            <option value="">-- Select a user --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.displayName} ({user.email || 'No email'})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={isCaptain}
              onChange={handleCaptainChange}
            />
            Team Captain
          </label>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add to Team'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeamMemberForm;
