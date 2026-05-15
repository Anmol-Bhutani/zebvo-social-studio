"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setToken } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        setToken(token);
        set({ user, token });
      },
      clear: () => {
        setToken(null);
        set({ user: null, token: null });
      },
    }),
    { name: "zebvo:auth" },
  ),
);
