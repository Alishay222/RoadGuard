import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { AuthUser, LoginRequest, RegisterRequest, TokenResponse } from '@/app/types';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (payload: LoginRequest) => Promise<TokenResponse>;
  register: (payload: RegisterRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Initialize auth on app start
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Initialize API client
      await apiClient.init();

      // Try to load user from storage
      const userJson = await SecureStore.getItemAsync('roadguard_user');
      if (userJson) {
        const savedUser = JSON.parse(userJson);
        setUser(savedUser);
        setIsSignedIn(true);
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (payload: LoginRequest): Promise<TokenResponse> => {
    try {
      const response = await apiClient.login(payload);
      const newUser: AuthUser = {
        email: response.email,
        name: response.name,
        token: response.access_token,
      };
      setUser(newUser);
      setIsSignedIn(true);
      await SecureStore.setItemAsync('roadguard_user', JSON.stringify(newUser));
      return response;
    } catch (err) {
      setIsSignedIn(false);
      throw err;
    }
  };

  const register = async (payload: RegisterRequest): Promise<TokenResponse> => {
    try {
      const response = await apiClient.register(payload);
      const newUser: AuthUser = {
        email: response.email,
        name: response.name,
        token: response.access_token,
      };
      setUser(newUser);
      setIsSignedIn(true);
      await SecureStore.setItemAsync('roadguard_user', JSON.stringify(newUser));
      return response;
    } catch (err) {
      setIsSignedIn(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
      setIsSignedIn(false);
      await SecureStore.deleteItemAsync('roadguard_user');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
