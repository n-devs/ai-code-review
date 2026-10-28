export type ApiType = "chat" | "responses" | "messages" | "text";
export type Provider =
  | "copilot"
  | "github-models"
  | "github-azure-models"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "ollama"
  | "xai"
  | "zai"
  | "qwencloud"
  | "qwencloud-plan"
  | "google"
  | "azure"
  | "aws"
  | "custom";

export const API_TYPE_PATHS: Record<ApiType, string> = {
  chat: "/chat/completions",
  responses: "/responses",
  messages: "/messages",
  text: "/completions",
};

export const PROVIDER_BASES: Partial<Record<Provider, string>> = {
  "github-azure-models": "https://models.inference.ai.azure.com",
  "github-models": "https://models.github.ai/inference",
  copilot: "https://api.githubcopilot.com",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434/v1",
  xai: "https://api.x.ai/v1",
  zai: "https://api.z.ai/api/coding/paas/v4",
  // Qwen Cloud — OpenAI-compatible endpoint (base สำหรับ chat/responses/text)
  qwencloud: "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1",
  "qwencloud-plan": "https://token-plan.maas.qwencloudapi.com/compatible-mode/v1",
  google: "https://generativelanguage.googleapis.com/v1beta/openai",
  // azure/aws/custom: must provide api_url
};

// Base URL แยกตาม api_type สำหรับ provider ที่มี endpoint ต่างกันในแต่ละโปรโตคอล
// (เช่น Qwen Cloud: OpenAI-compatible อยู่ที่ /compatible-mode/v1 แต่ Anthropic-compatible อยู่ที่ /apps/anthropic)
export const PROVIDER_TYPE_BASES: Partial<Record<Provider, Partial<Record<ApiType, string>>>> = {
  qwencloud: {
    messages: "https://ap-southeast-1.maas.qwencloudapi.com/apps/anthropic",
  },
  "qwencloud-plan": {
    messages: "https://token-plan.maas.qwencloudapi.com/apps/anthropic",
  },
};

export const PROVIDER_DEFAULT_TYPE: Partial<Record<Provider, ApiType>> = {
  anthropic: "messages",
};

export const REQUIRES_API_URL: Provider[] = ["custom", "azure", "aws"];

export function resolveApiType(
  provider: Provider | undefined,
  envApiType?: string
): ApiType {
  return (envApiType ?? (provider && PROVIDER_DEFAULT_TYPE[provider]) ?? "chat") as ApiType;
}

export function resolveApiUrl(
  provider: Provider | undefined,
  apiType: ApiType,
  override?: string
): string {
  if (override) return override;
  const base = (
    (provider && PROVIDER_TYPE_BASES[provider]?.[apiType]) ??
    (provider && PROVIDER_BASES[provider]) ??
    "https://api.githubcopilot.com"
  ).replace(/\/$/, "");
  return base + API_TYPE_PATHS[apiType];
}

export function isCopilotUrl(url: string): boolean {
  return url.includes("githubcopilot.com");
}

export function isAzureProvider(provider: Provider | undefined, url: string): boolean {
  return provider === "azure" || url.includes(".openai.azure.com");
}

export function isGithubModelsProvider(provider: Provider | undefined, url: string): boolean {
  return provider === "github-models" || url.includes(".inference.ai.azure.com");
}

export function requiresApiUrl(provider: Provider | undefined): boolean {
  return REQUIRES_API_URL.includes(provider as Provider);
}
