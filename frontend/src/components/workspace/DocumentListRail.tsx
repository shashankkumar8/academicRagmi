import React, { useState } from "react";
import { 
  FileText, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Table, 
  Eye,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";

export interface WorkspaceDocument {
  id: string;
  filename: string;
  original_filename: string;
  file_size_bytes: number;
  page_count: number;
  unit: string;
  status: string;
  chunk_count: number;
  ocr_pages_count: number;
  tables_count: number;
  low_confidence_pages: number[];
  warnings: string[];
  created_at: string;
}

interface Props {
  workspaceId: string;
  documents: WorkspaceDocument[];
  onDocumentDeleted: () => void;
  selectedDocId?: string | null;
  onSelectDoc?: (docId: string) => void;
}

export const DocumentListRail: React.FC<Props> = ({
  workspaceId,
  documents,
  onDocumentDeleted,
  selectedDocId,
  onSelectDoc
}) => {
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});

  const toggleUnit = (unit: string) => {
    setCollapsedUnits((prev) => ({ ...prev, [unit]: !prev[unit] }));
  };

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (confirm("Delete this document and all its indexed vector chunks?")) {
      try {
        await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/documents/${docId}`, {
          method: "DELETE",
        });
        onDocumentDeleted();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Group by unit
  const groupedDocs: Record<string, WorkspaceDocument[]> = {};
  documents.forEach((doc) => {
    const u = doc.unit || "General";
    if (!groupedDocs[u]) groupedDocs[u] = [];
    groupedDocs[u].push(doc);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-fg-subtle flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-violet" />
          <span>Course Material ({documents.length})</span>
        </h3>
      </div>

      {documents.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-bg-surface-2 border border-border">
          <FileText className="w-8 h-8 text-fg-subtle mx-auto mb-2 opacity-50" />
          <p className="text-xs text-fg-muted font-medium">No documents uploaded yet.</p>
          <p className="text-[10px] text-fg-subtle mt-0.5">Upload syllabus PDFs to begin asking questions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedDocs).map(([unitName, unitDocs]) => {
            const isCollapsed = collapsedUnits[unitName];
            return (
              <div key={unitName} className="space-y-1.5">
                {/* Unit Header Accordion */}
                <div 
                  onClick={() => toggleUnit(unitName)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-bg-surface-2 cursor-pointer transition-colors text-xs font-semibold text-fg"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-fg-subtle" /> : <ChevronDown className="w-3.5 h-3.5 text-fg-subtle" />}
                    <span className="truncate">{unitName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-fg-subtle px-1.5 py-0.5 rounded bg-bg-surface-2">
                    {unitDocs.length}
                  </span>
                </div>

                {/* Unit Document Items */}
                {!isCollapsed && (
                  <div className="space-y-1.5 pl-2">
                    {unitDocs.map((doc) => {
                      const isSelected = selectedDocId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => onSelectDoc && onSelectDoc(doc.id)}
                          className={`group relative flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-brand-violet/10 border-brand-violet shadow-sm"
                              : "bg-bg-surface hover:bg-bg-surface-2 border-border hover:border-border-strong"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 truncate">
                              <FileText className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
                              <span className="text-xs font-semibold text-fg truncate">
                                {doc.original_filename}
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleDelete(e, doc.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-brand-coral/10 hover:text-brand-coral text-fg-subtle transition-all"
                              title="Delete PDF"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quality badges and metadata */}
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[10px] text-fg-subtle">
                            <span className="font-mono">{doc.page_count} pgs</span>
                            <span>•</span>
                            <span className="font-mono">{doc.chunk_count} chunks</span>
                            
                            {doc.tables_count > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-brand-sky/15 text-brand-sky font-semibold">
                                <Table className="w-2.5 h-2.5" /> {doc.tables_count} tbls
                              </span>
                            )}

                            {doc.ocr_pages_count > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-brand-amber/15 text-brand-amber font-semibold">
                                <Eye className="w-2.5 h-2.5" /> {doc.ocr_pages_count} OCR
                              </span>
                            )}

                            {doc.status === "indexed" && (
                              <span className="ml-auto inline-flex items-center gap-1 text-brand-mint font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Indexed
                              </span>
                            )}

                            {doc.status === "failed" && (
                              <span className="ml-auto inline-flex items-center gap-1 text-brand-coral font-semibold">
                                <AlertTriangle className="w-3 h-3" /> Failed
                              </span>
                            )}

                            {["queued", "upload", "parse", "ocr", "chunk", "embed", "index"].includes(doc.status) && (
                              <span className="ml-auto inline-flex items-center gap-1 text-brand-violet font-semibold">
                                <Loader2 className="w-3 h-3 animate-spin" /> Ingesting
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
