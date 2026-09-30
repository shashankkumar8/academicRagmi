import React, { useState } from "react";
import { X, BookOpen, Check } from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { createWorkspace } from "../../lib/api";
import { THEME_COLORS } from "../../lib/constants";

export const NewWorkspaceModal: React.FC = () => {
  const { isNewWorkspaceOpen, setNewWorkspaceOpen, loadWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"standard" | "multilingual">("standard");
  const [colorTheme, setColorTheme] = useState("violet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isNewWorkspaceOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workspace name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createWorkspace({
        name: name.trim(),
        description: description.trim(),
        mode,
        color_theme: colorTheme,
      });
      await loadWorkspaces();
      setActiveWorkspaceId(created.id);
      setNewWorkspaceOpen(false);
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-card bg-bg-surface border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/10 text-brand-violet flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-heading font-bold text-lg text-fg">Create Subject Bookshelf</h3>
              <p className="text-xs text-fg-subtle">Set up a new workspace for your course material</p>
            </div>
          </div>
          <button
            onClick={() => setNewWorkspaceOpen(false)}
            className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-btn bg-brand-coral/10 border border-brand-coral/20 text-brand-coral text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">Subject / Course Name *</label>
            <input
              type="text"
              placeholder="e.g. Operating Systems & Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-btn bg-bg-surface-2 border border-border text-sm text-fg focus:outline-none focus:border-brand-violet"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Sem 5 notes, lecture slides, mid-term syllabus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-btn bg-bg-surface-2 border border-border text-sm text-fg focus:outline-none focus:border-brand-violet resize-none"
            />
          </div>

          {/* Language Mode Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">Language & Embedding Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setMode("standard")}
                className={`p-3 rounded-btn border cursor-pointer transition-all ${
                  mode === "standard"
                    ? "border-brand-violet bg-brand-violet/10 text-fg"
                    : "border-border bg-bg-surface-2 text-fg-muted hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Standard (English)</span>
                  {mode === "standard" && <Check className="w-3.5 h-3.5 text-brand-violet" />}
                </div>
                <p className="text-[10px] text-fg-subtle mt-1">bge-small-en-v1.5 (High speed)</p>
              </div>

              <div
                onClick={() => setMode("multilingual")}
                className={`p-3 rounded-btn border cursor-pointer transition-all ${
                  mode === "multilingual"
                    ? "border-brand-violet bg-brand-violet/10 text-fg"
                    : "border-border bg-bg-surface-2 text-fg-muted hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Hindi / Hinglish</span>
                  {mode === "multilingual" && <Check className="w-3.5 h-3.5 text-brand-violet" />}
                </div>
                <p className="text-[10px] text-fg-subtle mt-1">multilingual-e5-small</p>
              </div>
            </div>
          </div>

          {/* Color Palette Cover Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg">Book Spine Color Theme</label>
            <div className="flex items-center gap-2">
              {THEME_COLORS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setColorTheme(col.id)}
                  style={{ backgroundColor: col.bg }}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    colorTheme === col.id ? "scale-110 ring-2 ring-white" : "opacity-75 hover:opacity-100"
                  }`}
                  title={col.name}
                >
                  {colorTheme === col.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setNewWorkspaceOpen(false)}
              className="px-4 py-2 rounded-btn bg-bg-surface-2 hover:bg-bg-surface-3 text-xs font-semibold text-fg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-btn bg-gradient-to-r from-brand-violet to-brand-sky text-white text-xs font-semibold shadow-glow-violet hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
