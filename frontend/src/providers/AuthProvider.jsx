import React, { useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const [isGM, setIsGM] = useState(false);
  const [isACM, setIsACM] = useState(false);
  const [isTL, setIsTL] = useState(false);
  const [isATL, setIsATL] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userData = authService.getCurrentUser();
      const userType = localStorage.getItem('userType');
      const role = localStorage.getItem('role');

      if (token && userData) {
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userType === 'admin');
        setIsHR(role === 'hr');
        setIsManager(role === 'manager');
        setIsCEO(role === 'ceo');
        setIsGM(role === 'gm');
        setIsACM(role === 'acm');
        setIsTL(role === 'tl');
        setIsATL(role === 'atl');
      } else {
        // Clear everything if state is inconsistent
        if (token || userData || userType) {
          authService.logout();
        }
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsHR(false);
        setIsManager(false);
        setIsCEO(false);
        setIsGM(false);
        setIsACM(false);
        setIsTL(false);
        setIsATL(false);
      }
      setLoading(false);
    };

    const timer = setTimeout(initializeAuth, 0);
    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setIsAuthenticated(true);
    setIsAdmin(false);
    setIsHR(response.user.role_type === 'hr');
    setIsManager(response.user.role_type === 'manager');
    setIsCEO(response.user.role_type === 'ceo');
    setIsGM(response.user.role_type === 'gm');
    setIsACM(response.user.role_type === 'acm');
    setIsTL(response.user.role_type === 'tl');
    setIsATL(response.user.role_type === 'atl');
    return response;
  };

  const adminLogin = async (credentials) => {
    const response = await authService.adminLogin(credentials);
    setUser(response.admin);
    setIsAuthenticated(true);
    setIsAdmin(true);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsHR(false);
    setIsManager(false);
    setIsCEO(false);
    setIsGM(false);
    setIsACM(false);
    setIsTL(false);
    setIsATL(false);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const value = React.useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isHR,
    isManager,
    isCEO,
    isGM,
    isACM,
    isTL,
    isATL,
    login,
    adminLogin,
    logout,
    updateUser,
  }), [user, loading, isAuthenticated, isAdmin, isHR, isManager, isCEO, isGM, isACM, isTL, isATL]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};