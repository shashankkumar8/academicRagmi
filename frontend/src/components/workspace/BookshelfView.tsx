import React, { useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Clock, 
  Trash2, 
  Search, 
  Zap, 
  ShieldCheck, 
  ArrowRight
} from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { deleteWorkspace } from "../../lib/api";
import { THEME_COLORS } from "../../lib/constants";
import { formatDate } from "../../lib/utils";

export const BookshelfView: React.FC = () => {
  const { workspaces, setActiveWorkspaceId, setNewWorkspaceOpen, loadWorkspaces } = useWorkspaceStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "standard" | "multilingual">("all");

  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch = ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ws.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = filterMode === "all" || ws.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this workspace and all its indexed materials?")) {
      await deleteWorkspace(id);
      await loadWorkspaces();
    }
  };

  const getGradientForTheme = (themeName: string) => {
    const found = THEME_COLORS.find((c) => c.id === themeName);
    return found ? found.gradient : THEME_COLORS[0].gradient;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Hero Atmosphere Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-bg-surface-2/60 to-bg-surface p-8 sm:p-12 shadow-dark-card">
        {/* Subtle decorative aurora glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-sky/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-brand-violet/15 border border-brand-violet/30 text-brand-violet text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic RAG & Verification Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif-heading font-extrabold tracking-tight text-fg leading-tight">
            Ask your syllabus anything. <br />
            <span className="bg-gradient-to-r from-brand-violet via-brand-sky to-brand-amber bg-clip-text text-transparent">
              Verify it in one click.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-fg-muted max-w-2xl leading-relaxed">
            Upload textbooks, lecture slides, notes, and past papers. ScholarRAG answers solely from your course material, highlights the exact source passage in the PDF, and never hallucinates facts.
          </p>

          {/* Value Props Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-surface/80 border border-border">
              <ShieldCheck className="w-5 h-5 text-brand-mint shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-fg">Grounded Citations</p>
                <p className="text-fg-subtle">Page-level verified jump</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-surface/80 border border-border">
              <Zap className="w-5 h-5 text-brand-amber shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-fg">8 GB RAM Optimized</p>
                <p className="text-fg-subtle">Runs fully local & offline</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-surface/80 border border-border">
              <BookOpen className="w-5 h-5 text-brand-violet shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-fg">Exam Prep Hub</p>
                <p className="text-fg-subtle">Quizzes, cards & past papers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bookshelf Workspace Grid Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif-heading font-bold text-fg flex items-center gap-2">
              <span>Your Subject Workspaces</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-pill bg-bg-surface-2 text-fg-muted border border-border">
                {workspaces.length}
              </span>
            </h2>
            <p className="text-xs text-fg-subtle">Select a subject bookshelf to study, ask questions, or upload study notes.</p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-btn bg-bg-surface-2 border border-border text-xs text-fg focus:outline-none focus:border-brand-violet"
              />
            </div>

            <select
              value={filterMode}
              onChange={(e: any) => setFilterMode(e.target.value)}
              className="px-3 py-1.5 rounded-btn bg-bg-surface-2 border border-border text-xs text-fg focus:outline-none focus:border-brand-violet"
            >
              <option value="all">All Modes</option>
              <option value="standard">English</option>
              <option value="multilingual">Hindi / Hinglish</option>
            </select>
          </div>
        </div>

        {/* Bookshelf Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Create New Workspace Card */}
          <div
            onClick={() => setNewWorkspaceOpen(true)}
            className="group relative flex flex-col items-center justify-center min-h-[260px] p-6 rounded-card border-2 border-dashed border-border hover:border-brand-violet/60 bg-bg-surface/40 hover:bg-bg-surface-2/60 cursor-pointer transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-violet/10 group-hover:bg-brand-violet/20 text-brand-violet flex items-center justify-center transition-colors mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-sm text-fg group-hover:text-brand-violet transition-colors">Create New Subject</h3>
            <p className="text-xs text-fg-subtle text-center mt-1 max-w-[200px]">Add course syllabus, lecture PDFs, and notes</p>
          </div>

          {/* Workspace Book Spine Cards */}
          {filteredWorkspaces.map((ws) => {
            const gradientClass = getGradientForTheme(ws.color_theme);
            return (
              <div
                key={ws.id}
                onClick={() => setActiveWorkspaceId(ws.id)}
                className="group relative flex flex-col justify-between p-6 rounded-card bg-bg-surface border border-border hover:border-brand-violet/40 shadow-dark-card hover:shadow-glow-violet transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
              >
                {/* Book Cover Gradient Spine Bar */}
                <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${gradientClass}`}></div>

                {/* Top Info */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-bg-surface-2 flex items-center justify-center text-brand-violet border border-border">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-bg-surface-2 text-fg-subtle border border-border">
                        {ws.mode === "multilingual" ? "Hindi / Eng" : "English"}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, ws.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-fg-subtle hover:text-brand-coral hover:bg-brand-coral/10 transition-all"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif-heading font-bold text-fg group-hover:text-brand-violet transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-fg-muted line-clamp-2 mt-1">
                      {ws.description || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Bottom Stats & Progress */}
                <div className="pt-6 space-y-4 border-t border-border/50">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-bg-surface-2/60">
                      <p className="text-xs font-mono font-bold text-fg">{ws.document_count}</p>
                      <p className="text-[10px] text-fg-subtle">Docs</p>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-surface-2/60">
                      <p className="text-xs font-mono font-bold text-fg">{ws.total_pages}</p>
                      <p className="text-[10px] text-fg-subtle">Pages</p>
                    </div>
                    <div className="p-2 rounded-lg bg-bg-surface-2/60">
                      <p className="text-xs font-mono font-bold text-fg">{ws.total_chunks}</p>
                      <p className="text-[10px] text-fg-subtle">Chunks</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-fg-subtle pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(ws.updated_at)}
                    </span>
                    <span className="flex items-center gap-1 text-brand-violet font-semibold group-hover:translate-x-0.5 transition-transform">
                      Open Study <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredWorkspaces.length === 0 && workspaces.length > 0 && (
          <div className="p-12 text-center rounded-card bg-bg-surface border border-border">
            <p className="text-sm text-fg-muted">No workspaces matching "{searchQuery}".</p>
          </div>
        )}
      </div>

    </div>
  );
};
