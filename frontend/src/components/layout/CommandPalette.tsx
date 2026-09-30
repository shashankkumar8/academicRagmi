import React, { useEffect, useState } from "react";
import { Search, BookOpen, Plus, Sun, Moon, Settings as SettingsIcon, ArrowRight } from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    setCommandPaletteOpen, 
    workspaces, 
    setActiveWorkspaceId, 
    setNewWorkspaceOpen, 
    setSettingsOpen, 
    toggleTheme, 
    theme 
  } = useWorkspaceStore();

  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    {
      id: "new-ws",
      title: "Create New Subject Bookshelf",
      icon: Plus,
      category: "Actions",
      run: () => {
        setCommandPaletteOpen(false);
        setNewWorkspaceOpen(true);
      },
    },
    {
      id: "toggle-theme",
      title: `Switch Theme to ${theme === "dark" ? "Warm Paper Light" : "Midnight Dark"}`,
      icon: theme === "dark" ? Sun : Moon,
      category: "Preferences",
      run: () => {
        toggleTheme();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "settings",
      title: "Open Model & System Settings",
      icon: SettingsIcon,
      category: "Preferences",
      run: () => {
        setCommandPaletteOpen(false);
        setSettingsOpen(true);
      },
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-xl rounded-card bg-bg-surface border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-brand-violet" />
          <input
            type="text"
            placeholder="Type a command or search subjects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface-2 border border-border text-fg-subtle">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Workspaces list */}
          {filteredWorkspaces.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase text-fg-subtle">Subjects</div>
              {filteredWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspaceId(ws.id);
                    setCommandPaletteOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-btn hover:bg-bg-surface-2 cursor-pointer transition-colors text-xs text-fg group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-brand-violet" />
                    <span className="font-semibold">{ws.name}</span>
                    <span className="text-[10px] text-fg-subtle">({ws.document_count} docs)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-fg-subtle group-hover:text-brand-violet transition-colors" />
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-1 pt-2">
            <div className="px-3 py-1 text-[10px] font-mono uppercase text-fg-subtle">Quick Actions</div>
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={act.run}
                  className="flex items-center justify-between px-3 py-2 rounded-btn hover:bg-bg-surface-2 cursor-pointer transition-colors text-xs text-fg group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-brand-sky" />
                    <span>{act.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-fg-subtle">{act.category}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
