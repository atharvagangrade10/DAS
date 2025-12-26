"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthTokenResponse, LoginRequest, RegisterRequest } from '@/types/auth';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: AuthUser) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'das_auth_token';
const USER_STORAGE_KEY = 'das_auth_user';

// --- Global Unauthorized Handler Mechanism ---
let onUnauthorizedHandler: (() => void) | null = null;

export const registerUnauthorizedHandler = (handler: () => void) => {
  onUnauthorizedHandler = handler;
};

export const handleUnauthorized = () => {
  if (onUnauthorizedHandler) {
    onUnauthorizedHandler();
  }
};
// ---------------------------------------------

const fetchAuth = async <T, R>(endpoint: string, data: T): Promise<R> => {
  const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Failed to call ${endpoint}`);
  }
  return response.json();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedToken && storedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (response: AuthTokenResponse) => {
    const { access_token, token_type, ...userData } = response;
    
    setToken(access_token);
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, access_token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    toast.info("Logged out successfully.");
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  // Register the logout function globally
  useEffect(() => {
    registerUnauthorizedHandler(logout);
    // Cleanup is not strictly necessary here as AuthProvider is root, but good practice
    return () => {
      registerUnauthorizedHandler(() => {});
    };
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await fetchAuth<LoginRequest, AuthTokenResponse>('login', data);
      handleAuthSuccess(response);
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error("Login failed", { description: error.message });
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await fetchAuth<RegisterRequest, any>('create-account', data);
      toast.success("Account created successfully! Please log in.");
    } catch (error: any) {
      toast.error("Registration failed", { description: error.message });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};