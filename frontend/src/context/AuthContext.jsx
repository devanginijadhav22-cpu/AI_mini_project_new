import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session verification failed", err);
          logout();
        }
      }
      setLoading(false);
    };
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user_id, full_name, role, profile_is_complete, profile_completion_percentage } = res.data;
    const userData = { 
      id: user_id, 
      email, 
      full_name, 
      role,
      profile_is_complete: Boolean(profile_is_complete),
      profile_completion_percentage: profile_completion_percentage ?? 0
    };

    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (fullName, email, password) => {
    const res = await authAPI.register({
      full_name: fullName,
      email,
      password,
      role: 'STUDENT'
    });
    const { access_token, user_id, role, profile_is_complete, profile_completion_percentage } = res.data;
    const userData = { 
      id: user_id, 
      email, 
      full_name: fullName, 
      role,
      profile_is_complete: Boolean(profile_is_complete),
      profile_completion_percentage: profile_completion_percentage ?? 0
    };

    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const updateProfileCompletion = (completionData) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        profile_is_complete: completionData.profile_is_complete ?? prev.profile_is_complete,
        profile_completion_percentage: completionData.profile_completion_percentage ?? prev.profile_completion_percentage
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfileCompletion }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
