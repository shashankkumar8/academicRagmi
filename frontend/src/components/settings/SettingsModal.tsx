import React, { useEffect, useState } from "react";
import { X, Cpu, CheckCircle2, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import type { AppSettings } from "../../lib/api";
import { fetchSettings, updateSettings, testLLM } from "../../lib/api";

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen } = useWorkspaceStore();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [provider, setProvider] = useState<"ollama" | "openai" | "gemini">("ollama");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.2:3b");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o-mini");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-flash");
  const [lowMemory, setLowMemory] = useState(false);
  const [relevanceThreshold, setRelevanceThreshold] = useState(0.35);

  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      load();
    }
  }, [isSettingsOpen]);

  const load = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
      setProvider(data.default_llm_provider);
      setOllamaUrl(data.ollama_base_url);
      setOllamaModel(data.ollama_model);
      setOpenaiModel(data.openai_model);
      setGeminiModel(data.gemini_model);
      setLowMemory(data.low_memory_mode);
      setRelevanceThreshold(data.relevance_score_threshold);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isSettingsOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testLLM({
        provider,
        base_url: ollamaUrl,
        api_key: provider === "openai" ? openaiKey : provider === "gemini" ? geminiKey : undefined,
        model: provider === "ollama" ? ollamaModel : provider === "openai" ? openaiModel : geminiModel,
      });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ status: "error", message: err.message || "Failed to reach provider" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await updateSettings({
        default_llm_provider: provider,
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        openai_api_key: openaiKey || undefined,
        openai_model: openaiModel,
        gemini_api_key: geminiKey || undefined,
        gemini_model: geminiModel,
        low_memory_mode: lowMemory,
        relevance_score_threshold: relevanceThreshold,
      });
      setSuccessMsg("Settings saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-card bg-bg-surface border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/10 text-brand-violet flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-heading font-bold text-lg text-fg">System & LLM Settings</h3>
              <p className="text-xs text-fg-subtle">Manage local LLaMA, cloud fallback providers, and memory budgets</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {successMsg && (
            <div className="p-3 rounded-btn bg-brand-mint/10 border border-brand-mint/20 text-brand-mint text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Provider Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-fg">Active LLM Provider</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => { setProvider("ollama"); setTestResult(null); }}
                className={`p-3 rounded-btn border text-left transition-all ${
                  provider === "ollama"
                    ? "border-brand-violet bg-brand-violet/10 text-fg"
                    : "border-border bg-bg-surface-2 text-fg-muted hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Ollama (Local)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-mint/20 text-brand-mint font-semibold">Offline</span>
                </div>
                <p className="text-[10px] text-fg-subtle mt-1">Llama 3.2 / 3.1 Q4 (No API cost)</p>
              </button>

              <button
                type="button"
                onClick={() => { setProvider("gemini"); setTestResult(null); }}
                className={`p-3 rounded-btn border text-left transition-all ${
                  provider === "gemini"
                    ? "border-brand-violet bg-brand-violet/10 text-fg"
                    : "border-border bg-bg-surface-2 text-fg-muted hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Google Gemini</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-sky/20 text-brand-sky font-semibold">Cloud</span>
                </div>
                <p className="text-[10px] text-fg-subtle mt-1">Gemini 1.5 Flash / Pro</p>
              </button>

              <button
                type="button"
                onClick={() => { setProvider("openai"); setTestResult(null); }}
                className={`p-3 rounded-btn border text-left transition-all ${
                  provider === "openai"
                    ? "border-brand-violet bg-brand-violet/10 text-fg"
                    : "border-border bg-bg-surface-2 text-fg-muted hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">OpenAI</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-amber/20 text-brand-amber font-semibold">Cloud</span>
                </div>
                <p className="text-[10px] text-fg-subtle mt-1">GPT-4o / GPT-4o-mini</p>
              </button>
            </div>
          </div>

          {/* Provider Specific Inputs */}
          <div className="p-4 rounded-xl bg-bg-surface-2 border border-border space-y-4">
            {provider === "ollama" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Ollama Base URL</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-btn bg-bg border border-border text-xs text-fg focus:outline-none focus:border-brand-violet font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Ollama Model Name</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="llama3.2:3b"
                    className="w-full px-3 py-1.5 rounded-btn bg-bg border border-border text-xs text-fg focus:outline-none focus:border-brand-violet font-mono"
                  />
                  <p className="text-[10px] text-fg-subtle">Recommended for 8 GB RAM laptops: <code className="text-brand-violet font-mono">llama3.2:3b</code> or <code className="text-brand-violet font-mono">llama3.1:8b-instruct-q4_K_M</code></p>
                </div>
              </>
            )}

            {provider === "gemini" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Gemini API Key</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={settings?.gemini_configured ? "• • • • • • • • (Configured in .env)" : "AIzaSy..."}
                    className="w-full px-3 py-1.5 rounded-btn bg-bg border border-border text-xs text-fg focus:outline-none focus:border-brand-violet font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">Gemini Model</label>
                  <input
                    type="text"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-btn bg-bg border border-border text-xs text-fg focus:outline-none focus:border-brand-violet font-mono"
                  />
                </div>
              </>
            )}

            {provider === "openai" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">OpenAI API Key</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={settings?.openai_configured ? "• • • • • • • • (Configured in .env)" : "sk-..."}
                    className="w-full px-3 py-1.5 rounded-btn bg-bg border border-border text-xs text-fg focus:outline-none focus:border-brand-violet font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg">OpenAI Model</label>
                  <input
                    type="text"
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-btn bg-bg border border-border text-xs text-fg focus:outline-none focus:border-brand-violet font-mono"
                  />
                </div>
              </>
            )}

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-bg hover:bg-bg-surface-3 border border-border text-xs font-semibold text-fg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-brand-violet" : ""}`} />
                <span>{isTesting ? "Testing Provider..." : "Test Connection"}</span>
              </button>

              {testResult && (
                <div className={`text-xs flex items-center gap-1.5 ${
                  testResult.status === "connected" ? "text-brand-mint" : "text-brand-coral"
                }`}>
                  {testResult.status === "connected" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Low-Memory Mode (8 GB RAM optimization) */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-bg-surface-2 border border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-amber" />
                <span className="text-xs font-bold text-fg">Low-Memory Mode (8 GB RAM Budget)</span>
              </div>
              <p className="text-[11px] text-fg-subtle">
                Bypasses the Cross-Encoder reranker, limits retrieval to top 10 chunks, and enforces shorter context to keep RAM under 1.5 GB.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={lowMemory}
                onChange={(e) => setLowMemory(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-violet"></div>
            </label>
          </div>

          {/* Relevance Threshold Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-bg-surface-2 border border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-fg">Relevance Abstention Threshold</label>
              <span className="font-mono text-xs text-brand-violet font-bold">{relevanceThreshold}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={relevanceThreshold}
              onChange={(e) => setRelevanceThreshold(parseFloat(e.target.value))}
              className="w-full accent-brand-violet"
            />
            <p className="text-[10px] text-fg-subtle">
              If the highest retrieved chunk score is below this value, ScholarRAG abstains ("Not covered in material") instead of hallucinating.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 rounded-btn bg-bg-surface-2 hover:bg-bg-surface-3 text-xs font-semibold text-fg-muted transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-btn bg-gradient-to-r from-brand-violet to-brand-sky text-white text-xs font-semibold shadow-glow-violet hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
