"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  activeWorkspaceId: string | null;
  setActive: (id: string | null) => void;
}

export const useActiveWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActive: (id) => set({ activeWorkspaceId: id }),
    }),
    { name: "zebvo:active-workspace" },
  ),
);
