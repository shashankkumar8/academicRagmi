import { API_BASE_URL } from "./constants";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  mode: string;
  color_theme: string;
  icon: string;
  document_count: number;
  total_pages: number;
  total_chunks: number;
  total_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  memory: {
    process_rss_mb: number;
    system_total_gb: number;
    system_available_gb: number;
    system_percent_used: number;
  };
  low_memory_mode: boolean;
  llm_provider: string;
  llm_connection: {
    status: string;
    provider: string;
    model?: string;
    model_present?: boolean;
    available_models?: string[];
    message: string;
  };
}

export interface AppSettings {
  app_name: string;
  app_version: string;
  default_llm_provider: "ollama" | "openai" | "gemini";
  ollama_base_url: string;
  ollama_model: string;
  openai_model: string;
  openai_configured: boolean;
  openai_api_key?: string;
  gemini_model: string;
  gemini_configured: boolean;
  gemini_api_key?: string;
  low_memory_mode: boolean;
  relevance_score_threshold: number;
  embedding_model_default: string;
  embedding_model_multilingual: string;
  reranker_model: string;
  data_dir: string;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Failed to fetch system health");
  return res.json();
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE_URL}/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<{ message: string; settings: AppSettings }> {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function testLLM(payload: {
  provider: "ollama" | "openai" | "gemini";
  base_url?: string;
  api_key?: string;
  model?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/settings/test-llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("LLM connection test failed");
  return res.json();
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await fetch(`${API_BASE_URL}/workspaces`);
  if (!res.ok) throw new Error("Failed to fetch workspaces");
  return res.json();
}

export async function createWorkspace(data: {
  name: string;
  description?: string;
  mode?: string;
  color_theme?: string;
  icon?: string;
}): Promise<Workspace> {
  const res = await fetch(`${API_BASE_URL}/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create workspace");
  return res.json();
}

export async function deleteWorkspace(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete workspace");
}
