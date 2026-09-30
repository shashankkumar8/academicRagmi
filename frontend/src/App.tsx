import React, { useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { BookshelfView } from "./components/workspace/BookshelfView";
import { WorkspaceView } from "./components/workspace/WorkspaceView";
import { NewWorkspaceModal } from "./components/workspace/NewWorkspaceModal";
import { SettingsModal } from "./components/settings/SettingsModal";
import { CommandPalette } from "./components/layout/CommandPalette";
import { useWorkspaceStore } from "./store/workspaceStore";

export const App: React.FC = () => {
  const { loadWorkspaces, activeWorkspaceId, theme } = useWorkspaceStore();

  useEffect(() => {
    // Initial sync of theme and workspaces
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    loadWorkspaces();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg transition-colors duration-200 paper-texture">
      {/* Header Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {!activeWorkspaceId ? (
          <BookshelfView />
        ) : (
          <WorkspaceView />
        )}
      </main>

      {/* Modals & Overlays */}
      <NewWorkspaceModal />
      <SettingsModal />
      <CommandPalette />
    </div>
  );
};

export default App;
