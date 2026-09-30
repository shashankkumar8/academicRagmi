import { create } from "zustand";
import type { Workspace } from "../lib/api";
import { fetchWorkspaces } from "../lib/api";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;
  theme: "dark" | "light";
  isSettingsOpen: boolean;
  isNewWorkspaceOpen: boolean;
  isCommandPaletteOpen: boolean;
  
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  toggleTheme: () => void;
  setSettingsOpen: (open: boolean) => void;
  setNewWorkspaceOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  loadWorkspaces: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,
  error: null,
  theme: (localStorage.getItem("scholarrag-theme") as "dark" | "light") || "dark",
  isSettingsOpen: false,
  isNewWorkspaceOpen: false,
  isCommandPaletteOpen: false,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  
  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("scholarrag-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    set({ theme: nextTheme });
  },

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setNewWorkspaceOpen: (open) => set({ isNewWorkspaceOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  loadWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchWorkspaces();
      set({ workspaces: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load workspaces", isLoading: false });
    }
  },
}));
