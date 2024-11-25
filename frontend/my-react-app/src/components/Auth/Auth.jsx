/*
Artifact(s): Log in, Log Out
Description: React component that provides authentication functionality including login, register, and session management.
Name: Anil Thapa
Date: 11/24/2024
Preconditions: Backend API endpoints for authentication must be available
Postconditions: Provides authentication state and protected routes
Error and exception conditions: Network errors, invalid credentials
Side effects: Stores JWT token and user data in localStorage
*/

import React, { useState, useEffect, createContext, useContext } from 'react'
import './Auth.css'

/*
When creating the AuthContext, we will use it to provide authentication states throughout the application.
This context will share user data, token information, and authentication functions between components.
The context is initialized as null since it will be populated when the AuthProvider is initialized.
*/
const AuthContext = createContext(null);

/*
LoginForm component handles both the login and registration user interface. It manages form state and switches between login/register modes.
These variables will be passed into the AuthProvider component so it can update authentication state.
We store state of our login inside the browser so we can retrieve information easily about name and description of the user.
*/
function LoginForm({ onLogin, onRegister, error }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(username, password);
    } else {
      onRegister(username, password, name, description);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-card">
          <h3 className="auth-title"> {isLogin ? 'Sign In' : 'Create new account'} </h3>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input type="text" required className="input-field" placeholder="Username"
                value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <input type="password" required className="input-field"
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {!isLogin && (
              <>
                <div className="form-group">
                  <input type="text" className="input-field" placeholder="Name (optional)" value={name}
                    onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <textarea className="input-field" placeholder="Description (optional)"
                    value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </>
            )}
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="submit-button"> {isLogin ? 'Sign in' : 'Register'} </button>
          </form>
          <div className="toggle-form">
            <button className="toggle-button" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
AuthProvider serves as the main authentication context provider to keep states in check between Auth.jsx and ProfileModal.jsx.
It maintains the global authentication state and provides authentication functions to child components.
user --> stores user profile data (name, description, profile image)
token --> JWT token for API authentication
error --> tracks authentication errors
Also used to initialize state with any existing data in localStorage if there was a previous login.
*/
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('jwtToken'));
  const [error, setError] = useState('');

  /*
  Handle user login process by sending credentials to backend,
  storing the received token to fetch and store the user's profile
  then updates authentication state to reflect a sucessful login.
  */
  const login = async (username, password) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        const profileResponse = await fetch('http://127.0.0.1:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        const profileData = await profileResponse.json();

        const userData = { ...data.user, ...profileData };
        setUser(userData);
        setToken(data.token);
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setError('');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Connection error');
    }
  };

  /*
  Clear all authentication data and reset state by removing stored token and user data from localStorage.
  */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    setError('');
  };

  /*
  Handle new user registration by sending registration calls and automatically logs the user in when successful. 
  */
  const register = async (username, password, name, description) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, description })
      });

      const data = await response.json();

      if (response.ok) {
        await login(username, password);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Connection error');
    }
  };

  /*
  Whenever the token changes, fetch the correct user's profile. Also at the same time validate
  the token before updating the user data. If the token is expired, just log out. 
  */
  useEffect(() => {
    const fetchUserProfile = async () => {
      const savedToken = localStorage.getItem('jwtToken');
      if (savedToken) {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, logout }}>
      {token ? children : <LoginForm onLogin={login} onRegister={register} error={error} />}
    </AuthContext.Provider>
  );
}

/*
Ensure hook is used within an Authentication provider.
*/
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;