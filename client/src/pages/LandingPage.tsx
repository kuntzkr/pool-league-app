import React from 'react';
import { User } from '../types';

interface LandingPageProps {
  user: User;
}

const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  // Direct link to backend logout route
  // Using relative path for proxy or full path if proxy isn't used for this
  const logoutUrl = '/api/auth/logout'; // Relies on Vite proxy

  return (
    <div>
      <h1>Welcome to the Pool League!</h1>
      {/* No need for conditional check on user here, routing guarantees it */}
      <>
        <p>Hello, {user.displayName || user.email || 'User'}!</p> {/* Added fallback */}
        <p>Your Google ID is: {user.id}</p>
        <a href={logoutUrl} style={{ padding: '8px 12px', backgroundColor: '#dddddd', color: 'black', textDecoration: 'none', borderRadius: '4px' }}>
          Logout
        </a>
        {/* Add other content for authenticated users here */}
      </>
    </div>
  );
}

export default LandingPage;