import React, { useEffect, useState } from "react";
import { 
  UploadCloud, 
  FileSearch, 
  Eye, 
  Scissors, 
  Binary, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";

export interface PipelineStageEvent {
  job_id: string;
  stage: "upload" | "parse" | "ocr" | "chunk" | "embed" | "index" | "indexed" | "failed";
  progress: number;
  label: string;
  timestamp: string;
  data?: {
    document_id?: string;
    total_pages?: number;
    total_chunks?: number;
    tables_count?: number;
    ocr_pages_count?: number;
    warnings?: string[];
  };
}

interface Props {
  jobId: string;
  documentName: string;
  onComplete?: () => void;
}

const STAGES = [
  { id: "upload", label: "Upload", icon: UploadCloud, desc: "Validating file" },
  { id: "parse", label: "Parse", icon: FileSearch, desc: "Layout & tables" },
  { id: "ocr", label: "OCR", icon: Eye, desc: "Scan detector" },
  { id: "chunk", label: "Chunk", icon: Scissors, desc: "Parent-child splits" },
  { id: "embed", label: "Embed", icon: Binary, desc: "BGE on CPU" },
  { id: "index", label: "Index", icon: Database, desc: "Chroma & BM25" },
];

export const LivingPipelineVisualizer: React.FC<Props> = ({ jobId, documentName, onComplete }) => {
  const [currentEvent, setCurrentEvent] = useState<PipelineStageEvent | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/jobs/${jobId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const parsed: PipelineStageEvent = JSON.parse(event.data);
        setCurrentEvent(parsed);

        if (parsed.stage === "indexed") {
          setIsCompleted(true);
          eventSource.close();
          if (onComplete) {
            setTimeout(onComplete, 1200);
          }
        } else if (parsed.stage === "failed") {
          setError(parsed.label);
          eventSource.close();
        }
      } catch (e) {
        console.error("SSE JSON decode error:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE connection closed/errored:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  const activeStageId = currentEvent?.stage || "upload";
  const progressPercent = currentEvent?.progress || 10;
  const currentStageIndex = STAGES.findIndex((s) => s.id === (activeStageId === "indexed" ? "index" : activeStageId));

  return (
    <div className="p-6 rounded-card bg-bg-surface border border-brand-violet/30 shadow-dark-card space-y-6 animate-fade-in">
      {/* Header with Document Name & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-violet/15 text-brand-violet font-semibold uppercase">
              Living Ingestion Pipeline
            </span>
            <span className="text-xs text-fg-subtle">•</span>
            <span className="text-xs font-bold text-fg truncate max-w-xs">{documentName}</span>
          </div>
          <p className="text-xs text-fg-muted mt-1 flex items-center gap-1.5">
            {!isCompleted && !error && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-violet" />}
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-brand-mint" />}
            {error && <AlertTriangle className="w-3.5 h-3.5 text-brand-coral" />}
            <span>{currentEvent?.label || "Preparing ingestion pipeline..."}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-lg font-bold text-brand-violet">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Animated Pipeline Ribbon Nodes */}
      <div className="relative pt-2 pb-4">
        {/* Progress connecting background track */}
        <div className="absolute top-7 left-6 right-6 h-1 bg-bg-surface-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-violet via-brand-sky to-brand-mint transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Pipeline Nodes */}
        <div className="relative z-10 grid grid-cols-6 gap-2">
          {STAGES.map((st, idx) => {
            const Icon = st.icon;
            const isDone = idx < currentStageIndex || isCompleted;
            const isActive = idx === currentStageIndex && !isCompleted;

            return (
              <div key={st.id} className="flex flex-col items-center text-center group">
                <div 
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                    isDone
                      ? "bg-brand-mint/15 text-brand-mint border-brand-mint/40 shadow-glow-mint"
                      : isActive
                      ? "bg-brand-violet/20 text-brand-violet border-brand-violet shadow-glow-violet scale-110 animate-pulse-glow"
                      : "bg-bg-surface-2 text-fg-subtle border-border"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="mt-2 space-y-0.5">
                  <p className={`text-xs font-semibold ${isActive || isDone ? "text-fg" : "text-fg-subtle"}`}>
                    {st.label}
                  </p>
                  <p className="hidden md:block text-[10px] text-fg-subtle truncate max-w-[80px]">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parse Quality Metrics Report (Appears upon indexing completion) */}
      {currentEvent?.data && isCompleted && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-bg-surface-2 border border-border text-xs">
          <div>
            <p className="text-fg-subtle text-[11px]">Pages Parsed</p>
            <p className="font-mono font-bold text-fg text-sm">{currentEvent.data.total_pages || 0}</p>
          </div>
          <div>
            <p className="text-fg-subtle text-[11px]">Chunks Created</p>
            <p className="font-mono font-bold text-brand-violet text-sm">{currentEvent.data.total_chunks || 0}</p>
          </div>
          <div>
            <p className="text-fg-subtle text-[11px]">Tables Extracted</p>
            <p className="font-mono font-bold text-fg text-sm">{currentEvent.data.tables_count || 0}</p>
          </div>
          <div>
            <p className="text-fg-subtle text-[11px]">OCR Scans</p>
            <p className="font-mono font-bold text-brand-amber text-sm">{currentEvent.data.ocr_pages_count || 0}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-btn bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Ingestion failed: {error}</span>
        </div>
      )}
    </div>
  );
};
