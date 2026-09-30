import React, { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Sparkles, 
  GraduationCap, 
  BarChart3, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { API_BASE_URL } from "../../lib/constants";
import { DocumentUploadZone } from "./DocumentUploadZone";
import { DocumentListRail } from "./DocumentListRail";
import type { WorkspaceDocument } from "./DocumentListRail";
import { LivingPipelineVisualizer } from "../ingestion/LivingPipelineVisualizer";
import { AskNotesView } from "./AskNotesView";

export const WorkspaceView: React.FC = () => {
  const { activeWorkspaceId, setActiveWorkspaceId, workspaces, loadWorkspaces } = useWorkspaceStore();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "study" | "eval">("chat");
  const [activeJobs, setActiveJobs] = useState<Array<{ job_id: string; filename: string }>>([]);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const loadDocs = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/workspaces/${activeWorkspaceId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to load documents", e);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [activeWorkspaceId]);

  if (!activeWorkspace) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-fg-muted">Workspace not found.</p>
        <button
          onClick={() => setActiveWorkspaceId(null)}
          className="mt-3 px-3 py-1.5 rounded-btn bg-brand-violet text-white text-xs font-semibold"
        >
          Return to Bookshelf
        </button>
      </div>
    );
  }

  const handleUploadStarted = (jobs: Array<{ job_id: string; filename: string }>) => {
    setActiveJobs(jobs);
    loadDocs();
  };

  const handlePipelineComplete = (jobId: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    loadDocs();
    loadWorkspaces();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Workspace Sub-Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-surface border border-border shadow-dark-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveWorkspaceId(null)}
            className="p-2 rounded-xl bg-bg-surface-2 hover:bg-bg-surface-3 text-fg-muted hover:text-fg border border-border transition-colors"
            title="Back to All Subjects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-heading font-bold text-lg text-fg">{activeWorkspace.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-violet/15 text-brand-violet font-semibold border border-brand-violet/20">
                {activeWorkspace.mode === "multilingual" ? "Hindi / Eng" : "English Mode"}
              </span>
            </div>
            <p className="text-xs text-fg-subtle line-clamp-1">{activeWorkspace.description || "Course study workspace"}</p>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-surface-2 border border-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-brand-violet text-white shadow-glow-violet"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Notes (RAG)</span>
          </button>

          <button
            onClick={() => setActiveTab("study")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "study"
                ? "bg-brand-violet text-white shadow-glow-violet"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Study Hub</span>
          </button>

          <button
            onClick={() => setActiveTab("eval")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "eval"
                ? "bg-brand-violet text-white shadow-glow-violet"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Evaluation</span>
          </button>
        </div>
      </div>

      {/* Main 3-Pane Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Document Management Rail (4 cols on lg) */}
        <div className={`space-y-6 transition-all duration-200 ${isRailCollapsed ? "hidden lg:block lg:col-span-1" : "lg:col-span-4"}`}>
          {isRailCollapsed ? (
            <div className="p-3 rounded-2xl bg-bg-surface border border-border text-center">
              <button
                onClick={() => setIsRailCollapsed(false)}
                className="p-2 rounded-lg hover:bg-bg-surface-2 text-fg-subtle hover:text-fg"
                title="Expand Documents Rail"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-dark-card space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold font-serif-heading text-fg flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-brand-violet" />
                  <span>Syllabus Material</span>
                </span>
                <button
                  onClick={() => setIsRailCollapsed(true)}
                  className="hidden lg:block p-1 rounded hover:bg-bg-surface-2 text-fg-subtle hover:text-fg"
                  title="Collapse Rail"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Drop Zone */}
              <DocumentUploadZone
                workspaceId={activeWorkspace.id}
                onUploadStarted={handleUploadStarted}
              />

              {/* Document List Tree */}
              <DocumentListRail
                workspaceId={activeWorkspace.id}
                documents={documents}
                onDocumentDeleted={loadDocs}
                selectedDocId={selectedDocId}
                onSelectDoc={(id) => setSelectedDocId(id)}
              />
            </div>
          )}
        </div>

        {/* Center Main Stage (8 cols on lg) */}
        <div className={`space-y-6 ${isRailCollapsed ? "lg:col-span-11" : "lg:col-span-8"}`}>
          
          {/* Active Ingestion Pipeline Visualizers */}
          {activeJobs.length > 0 && (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <LivingPipelineVisualizer
                  key={job.job_id}
                  jobId={job.job_id}
                  documentName={job.filename}
                  onComplete={() => handlePipelineComplete(job.job_id)}
                />
              ))}
            </div>
          )}

          {/* Main Content Stage */}
          {activeTab === "chat" ? (
            <AskNotesView
              workspaceId={activeWorkspace.id}
              workspaceName={activeWorkspace.name}
              documents={documents}
            />
          ) : (
            <div className="p-8 rounded-2xl bg-bg-surface border border-border shadow-dark-card min-h-[460px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-violet/10 text-brand-violet flex items-center justify-center shadow-glow-violet">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="font-serif-heading font-bold text-xl text-fg">
                  {activeTab === "study" ? "Study Hub" : "Evaluation"}
                </h3>
                <p className="text-xs text-fg-muted leading-relaxed">
                  {activeTab === "study"
                    ? "Flashcards, quizzes, and spaced repetition study tools — coming soon."
                    : "RAG pipeline evaluation metrics and answer quality scoring — coming soon."}
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
