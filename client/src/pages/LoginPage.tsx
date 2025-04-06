import React from 'react';

const LoginPage: React.FC = () => {
  const googleLoginUrl = 'http://localhost:3000/auth/google';

  return (
    <div>
      <h1>Pool League Login</h1>
      <p>Please log in to continue.</p>
      <a href={googleLoginUrl} style={{ padding: '10px 15px', backgroundColor: '#4285F4', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
        Login with Google
      </a>
    </div>
  );
}

export default LoginPage;