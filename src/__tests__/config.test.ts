import { describe, it, expect } from "vitest";
import {
  API_TYPE_PATHS,
  PROVIDER_BASES,
  PROVIDER_DEFAULT_TYPE,
  resolveApiType,
  resolveApiUrl,
  isCopilotUrl,
  isAzureProvider,
  requiresApiUrl,
} from "../config";

// ---------------------------------------------------------------------------
// API_TYPE_PATHS
// ---------------------------------------------------------------------------
describe("API_TYPE_PATHS", () => {
  it("chat → /chat/completions", () => {
    expect(API_TYPE_PATHS.chat).toBe("/chat/completions");
  });
  it("responses → /responses", () => {
    expect(API_TYPE_PATHS.responses).toBe("/responses");
  });
  it("messages → /messages", () => {
    expect(API_TYPE_PATHS.messages).toBe("/messages");
  });
  it("text → /completions", () => {
    expect(API_TYPE_PATHS.text).toBe("/completions");
  });
});

// ---------------------------------------------------------------------------
// PROVIDER_BASES
// ---------------------------------------------------------------------------
describe("PROVIDER_BASES", () => {
  it("copilot base URL", () => {
    expect(PROVIDER_BASES.copilot).toBe("https://api.githubcopilot.com");
  });
  it("openai base URL", () => {
    expect(PROVIDER_BASES.openai).toBe("https://api.openai.com/v1");
  });
  it("anthropic base URL", () => {
    expect(PROVIDER_BASES.anthropic).toBe("https://api.anthropic.com/v1");
  });
  it("openrouter base URL", () => {
    expect(PROVIDER_BASES.openrouter).toBe("https://openrouter.ai/api/v1");
  });
  it("ollama base URL", () => {
    expect(PROVIDER_BASES.ollama).toBe("http://localhost:11434/v1");
  });
  it("xai base URL", () => {
    expect(PROVIDER_BASES.xai).toBe("https://api.x.ai/v1");
  });
  it("qwencloud base URL", () => {
    expect(PROVIDER_BASES.qwencloud).toBe(
      "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1"
    );
  });
  it("qwencloud-plan base URL", () => {
    expect(PROVIDER_BASES["qwencloud-plan"]).toBe(
      "https://token-plan.maas.qwencloudapi.com/compatible-mode/v1"
    );
  });
  it("google base URL", () => {
    expect(PROVIDER_BASES.google).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
  });
  it("github-models base URL", () => {
    expect(PROVIDER_BASES["github-models"]).toBe("https://models.github.ai/inference");
  });
  it("azure/aws/custom have no base URL", () => {
    expect(PROVIDER_BASES.azure).toBeUndefined();
    expect(PROVIDER_BASES.aws).toBeUndefined();
    expect(PROVIDER_BASES.custom).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PROVIDER_DEFAULT_TYPE
// ---------------------------------------------------------------------------
describe("PROVIDER_DEFAULT_TYPE", () => {
  it("anthropic defaults to messages", () => {
    expect(PROVIDER_DEFAULT_TYPE.anthropic).toBe("messages");
  });
  it("other providers have no default type override", () => {
    expect(PROVIDER_DEFAULT_TYPE.openai).toBeUndefined();
    expect(PROVIDER_DEFAULT_TYPE.copilot).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// resolveApiType
// ---------------------------------------------------------------------------
describe("resolveApiType", () => {
  it("returns explicit env value when provided", () => {
    expect(resolveApiType("openai", "responses")).toBe("responses");
  });
  it("returns provider default when no env value", () => {
    expect(resolveApiType("anthropic", undefined)).toBe("messages");
  });
  it("falls back to chat when no env value and no provider default", () => {
    expect(resolveApiType("openai", undefined)).toBe("chat");
    expect(resolveApiType(undefined, undefined)).toBe("chat");
  });
});

// ---------------------------------------------------------------------------
// resolveApiUrl
// ---------------------------------------------------------------------------
describe("resolveApiUrl", () => {
  it("constructs URL from provider + api_type", () => {
    expect(resolveApiUrl("openai", "chat")).toBe(
      "https://api.openai.com/v1/chat/completions"
    );
  });
  it("constructs Anthropic messages URL", () => {
    expect(resolveApiUrl("anthropic", "messages")).toBe(
      "https://api.anthropic.com/v1/messages"
    );
  });
  it("constructs Copilot chat URL", () => {
    expect(resolveApiUrl("copilot", "chat")).toBe(
      "https://api.githubcopilot.com/chat/completions"
    );
  });
  it("constructs Ollama chat URL", () => {
    expect(resolveApiUrl("ollama", "chat")).toBe(
      "http://localhost:11434/v1/chat/completions"
    );
  });
  it("constructs OpenRouter responses URL", () => {
    expect(resolveApiUrl("openrouter", "responses")).toBe(
      "https://openrouter.ai/api/v1/responses"
    );
  });
  it("constructs GitHub Models chat URL", () => {
    expect(resolveApiUrl("github-models", "chat")).toBe(
      "https://models.github.ai/inference/chat/completions"
    );
  });
  it("constructs Qwen Cloud chat URL (OpenAI-compatible)", () => {
    expect(resolveApiUrl("qwencloud", "chat")).toBe(
      "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1/chat/completions"
    );
  });
  it("constructs Qwen Cloud messages URL (Anthropic-compatible)", () => {
    expect(resolveApiUrl("qwencloud", "messages")).toBe(
      "https://ap-southeast-1.maas.qwencloudapi.com/apps/anthropic/messages"
    );
  });
  it("constructs qwencloud-plan chat and messages URLs", () => {
    expect(resolveApiUrl("qwencloud-plan", "chat")).toBe(
      "https://token-plan.maas.qwencloudapi.com/compatible-mode/v1/chat/completions"
    );
    expect(resolveApiUrl("qwencloud-plan", "messages")).toBe(
      "https://token-plan.maas.qwencloudapi.com/apps/anthropic/messages"
    );
  });
  it("uses override URL when provided, ignoring provider+type", () => {
    expect(
      resolveApiUrl("custom", "chat", "https://my-proxy.internal/v1/chat/completions")
    ).toBe("https://my-proxy.internal/v1/chat/completions");
  });
  it("falls back to copilot URL when provider is undefined", () => {
    expect(resolveApiUrl(undefined, "chat")).toBe(
      "https://api.githubcopilot.com/chat/completions"
    );
  });
  it("strips trailing slash from base URL", () => {
    expect(resolveApiUrl("openai", "chat")).not.toContain("//chat");
  });
});

// ---------------------------------------------------------------------------
// isCopilotUrl
// ---------------------------------------------------------------------------
describe("isCopilotUrl", () => {
  it("returns true for githubcopilot.com URL", () => {
    expect(isCopilotUrl("https://api.githubcopilot.com/chat/completions")).toBe(true);
  });
  it("returns false for non-Copilot URL", () => {
    expect(isCopilotUrl("https://api.openai.com/v1/chat/completions")).toBe(false);
  });
  it("returns false for GitHub Models URL", () => {
    expect(isCopilotUrl("https://models.inference.ai.azure.com/chat/completions")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAzureProvider
// ---------------------------------------------------------------------------
describe("isAzureProvider", () => {
  it("returns true when provider is azure", () => {
    expect(isAzureProvider("azure", "https://my-resource.openai.azure.com/...")).toBe(true);
  });
  it("returns true when URL contains .openai.azure.com", () => {
    expect(isAzureProvider("custom", "https://my-resource.openai.azure.com/...")).toBe(true);
  });
  it("returns false for non-Azure provider and URL", () => {
    expect(isAzureProvider("openai", "https://api.openai.com/v1/chat/completions")).toBe(false);
  });
  it("returns false when provider is undefined and URL is not Azure", () => {
    expect(isAzureProvider(undefined, "https://api.openai.com/v1/chat/completions")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// requiresApiUrl
// ---------------------------------------------------------------------------
describe("requiresApiUrl", () => {
  it("returns true for custom", () => expect(requiresApiUrl("custom")).toBe(true));
  it("returns true for azure", () => expect(requiresApiUrl("azure")).toBe(true));
  it("returns true for aws", () => expect(requiresApiUrl("aws")).toBe(true));
  it("returns false for copilot", () => expect(requiresApiUrl("copilot")).toBe(false));
  it("returns false for openai", () => expect(requiresApiUrl("openai")).toBe(false));
  it("returns false for undefined", () => expect(requiresApiUrl(undefined)).toBe(false));
});
