import React, { useState, useRef } from "react";
import { UploadCloud, AlertTriangle, Layers } from "lucide-react";
import { API_BASE_URL } from "../../lib/constants";

interface Props {
  workspaceId: string;
  onUploadStarted: (jobs: Array<{ job_id: string; filename: string }>) => void;
}

export const DocumentUploadZone: React.FC<Props> = ({ workspaceId, onUploadStarted }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [unitName, setUnitName] = useState("Unit 1");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Filter PDF only
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setError("Please select valid PDF documents.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("unit", unitName.trim() || "General");
    pdfFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Upload failed");
      }

      const data = await res.json();
      if (data.jobs) {
        onUploadStarted(data.jobs);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center p-8 rounded-card border-2 border-dashed transition-all duration-200 cursor-pointer text-center ${
          isDragging
            ? "border-brand-violet bg-brand-violet/10 scale-[0.99]"
            : "border-border hover:border-brand-violet/50 bg-bg-surface-2/40 hover:bg-bg-surface-2/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-brand-violet/10 group-hover:bg-brand-violet/20 text-brand-violet flex items-center justify-center transition-colors mb-3 shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h4 className="text-sm font-semibold text-fg">
          {isUploading ? "Uploading course material..." : "Drag & drop study PDFs here"}
        </h4>
        <p className="text-xs text-fg-subtle mt-1 max-w-sm">
          Textbooks, lecture slides, unit notes, and past papers (up to 100 MB per file).
        </p>

        <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Layers className="w-3.5 h-3.5 text-brand-violet shrink-0" />
          <span className="text-xs text-fg-muted">Tag Unit:</span>
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder="e.g. Unit 1: Wave Mechanics"
            className="px-2.5 py-1 rounded-btn bg-bg border border-border text-xs text-fg focus:outline-none focus:border-brand-violet font-medium w-48"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-btn bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
