"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { User } from "@/types/auth";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");

    try {
      if (token) {
        await axios.post(
          `${process.env.API_URL}/users/logout/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Something went wrong with logout", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const response = await axios.get<User>(`${process.env.API_URL}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        await fetchUser(token);
      } else {
        setLoading(false);
      }
    });
  }, [fetchUser]);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    try {
      const response = await axios.post<{ access: string; refresh: string }>(
        `${process.env.API_URL}/users/login/`,
        { email, password }
      );
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      await fetchUser(response.data.access);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
