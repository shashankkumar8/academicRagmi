import React, { useEffect, useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Moon, 
  Sun, 
  Settings as SettingsIcon, 
  Plus, 
  Search, 
  Cpu
} from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import type { HealthStatus } from "../../lib/api";
import { fetchHealth } from "../../lib/api";

export const Navbar: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    setSettingsOpen, 
    setNewWorkspaceOpen, 
    setCommandPaletteOpen, 
    activeWorkspaceId, 
    setActiveWorkspaceId,
    workspaces
  } = useWorkspaceStore();

  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await fetchHealth();
        setHealth(data);
      } catch (e) {
        // Backend offline or loading
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg-surface/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveWorkspaceId(null)}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-sky text-white shadow-glow-violet">
            <BookOpen className="w-5 h-5" />
            <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1 text-brand-amber animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-heading font-bold text-xl tracking-tight text-fg">ScholarRAG</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-brand-violet/15 text-brand-violet font-semibold border border-brand-violet/20">v1.0</span>
            </div>
            <p className="hidden sm:block text-xs text-fg-subtle">Ask your syllabus anything</p>
          </div>
        </div>

        {/* Workspace Selector Breadcrumb */}
        {activeWorkspace && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-pill bg-bg-surface-2 border border-border text-sm">
            <span className="text-fg-subtle">Workspace:</span>
            <span className="font-semibold text-fg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-mint"></span>
              {activeWorkspace.name}
            </span>
            <button 
              onClick={() => setActiveWorkspaceId(null)}
              className="text-xs text-brand-violet hover:underline ml-1"
            >
              (Switch)
            </button>
          </div>
        )}

        {/* Action Controls & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Command Palette Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-btn bg-bg-surface-2 hover:bg-bg-surface-3 border border-border text-xs text-fg-muted transition-colors"
            title="Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-fg-subtle" />
            <span>Search / Commands</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg border border-border text-fg-subtle">Ctrl K</kbd>
          </button>

          {/* System Memory / LLM Indicator */}
          {health && (
            <div 
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-btn bg-bg-surface-2 border border-border text-xs text-fg-muted cursor-pointer"
              onClick={() => setSettingsOpen(true)}
              title={`RAM: ${health.memory?.process_rss_mb ?? 0} MB | LLM: ${health.llm_provider?.toUpperCase()} (${health.llm_connection?.status ?? 'unknown'})`}
            >
              <Cpu className="w-3.5 h-3.5 text-brand-sky" />
              <span>{health.memory?.process_rss_mb ?? 0} MB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-mint"></span>
              <span className="capitalize">{health.llm_provider}</span>
            </div>
          )}

          {/* New Workspace CTA */}
          <button
            onClick={() => setNewWorkspaceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-gradient-to-r from-brand-violet to-brand-sky text-white text-xs font-semibold shadow-glow-violet hover:opacity-95 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Subject</span>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-btn bg-bg-surface-2 hover:bg-bg-surface-3 border border-border text-fg-muted hover:text-fg transition-colors"
            title={`Switch to ${theme === "dark" ? "Paper Light" : "Midnight Dark"} Theme`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-brand-amber" /> : <Moon className="w-4 h-4 text-brand-violet" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-btn bg-bg-surface-2 hover:bg-bg-surface-3 border border-border text-fg-muted hover:text-fg transition-colors"
            title="Model & System Settings"
            aria-label="Open Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
