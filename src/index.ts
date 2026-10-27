import * as https from "https";
import {
  type ApiType,
  type Provider,
  resolveApiType,
  resolveApiUrl,
  isCopilotUrl,
  isAzureProvider,
  requiresApiUrl,
  isGithubModelsProvider,
} from "./config";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// ดึงค่าจาก Environment Variables (รองรับทั้ง GitHub Actions inputs และ env vars ตรง)
const GH_PAT = process.env.INPUT_GH_PAT ?? process.env.GH_PAT;
const PR_NUMBER = process.env.INPUT_PR_NUMBER ?? process.env.PR_NUMBER;
const REPO = process.env.INPUT_REPO ?? process.env.REPO; // format: owner/repo
const MODEL = process.env.INPUT_MODEL ?? process.env.INPUT_COPILOT_MODEL ?? process.env.MODEL ?? process.env.COPILOT_MODEL ?? "gpt-4o";
const MAX_DIFF_CHARS = parseInt(process.env.INPUT_MAX_DIFF_CHARS ?? process.env.MAX_DIFF_CHARS ?? "30000", 10);
const MAX_TOKENS = parseInt(process.env.INPUT_MAX_TOKENS ?? process.env.MAX_TOKENS ?? "4096", 10);
const LANGUAGE = process.env.INPUT_LANGUAGE ?? process.env.LANGUAGE ?? "English";
const TITLE = process.env.INPUT_TITLE ?? process.env.TITLE ?? "AI Code Review";
const FILES_CHANGED = (process.env.INPUT_FILES_CHANGED ?? process.env.FILES_CHANGED ?? "false").toLowerCase() === "true";
const MAX_INLINE_COMMENTS = 20;
// "all" = review การเปลี่ยนแปลงของทุกคน, ไม่ระบุ = ใช้ user ที่ run workflow (GITHUB_ACTOR)
const USERNAME = ((process.env.INPUT_USERNAME ?? "").trim() || process.env.GITHUB_ACTOR || "all").toLowerCase();

const PROVIDER = (process.env.INPUT_PROVIDER ?? process.env.PROVIDER) as Provider | undefined;
const API_TYPE: ApiType = resolveApiType(
  PROVIDER,
  process.env.INPUT_API_TYPE ?? process.env.INPUT_COMPLETION_TYPE ?? process.env.API_TYPE ?? process.env.COMPLETION_TYPE
);
const API_URL = resolveApiUrl(PROVIDER, API_TYPE, process.env.INPUT_API_URL ?? process.env.API_URL);

if (requiresApiUrl(PROVIDER) && !process.env.INPUT_API_URL && !process.env.API_URL) {
  console.error(`api_url is required when provider is '${PROVIDER}'.`);
  process.exit(1);
}
// EXPLICIT_API_KEY is the raw api_key input (personal PAT or provider key)
// For Copilot, api_key should be a personal GitHub PAT with Copilot subscription
// Use || (not ??) so empty strings (from unset GitHub Actions secrets) fall through
const EXPLICIT_API_KEY = process.env.INPUT_API_KEY || process.env.API_KEY || undefined;
let API_KEY = EXPLICIT_API_KEY ?? GH_PAT ?? "";

interface GitHubFile {
  filename: string;
  patch?: string;
}

interface FileInlineComment {
  path: string;
  line: number;
  body: string;
}

interface OpenAIResponse {
  choices?: Array<{
    message: {
      content: string;
    };
    text?: string;
  }>;
}

interface AnthropicResponse {
  content?: Array<{ type: string; text: string }>;
  error?: { message: string };
}

interface ResponsesAPIResponse {
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text: string }>;
  }>;
}

function fetchJson<T>(
  url: string,
  options: https.RequestOptions,
  body?: string
): Promise<{ status: number; data: T; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res: import("http").IncomingMessage) => {
      let raw = "";
      res.on("data", (chunk: Buffer | string) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw), text: raw });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: {} as T, text: raw });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function githubApiGet<T>(url: string): Promise<{ status: number; data: T; text: string }> {
  const options: https.RequestOptions = {
    method: "GET",
    headers: {
      Authorization: `token ${GH_PAT}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ai-code-review",
    },
  };
  return fetchJson<T>(url, options);
}

// 1. ดึงไฟล์ที่ถูกเปลี่ยนแปลง (Diff) จาก GitHub API
async function getPrFiles(): Promise<GitHubFile[]> {
  const { status, data, text } = await githubApiGet<GitHubFile[]>(
    `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/files`
  );

  if (status !== 200) {
    console.error(`GitHub API error: ${status} ${text.slice(0, 500)}`);
    return [];
  }

  if (!Array.isArray(data)) {
    console.error(`Unexpected GitHub API response: ${text.slice(0, 500)}`);
    return [];
  }

  return data;
}

// --- กรองไฟล์ตาม username ของ commit author ---

interface PrCommit {
  sha: string;
  author?: { login?: string } | null;
}

interface CommitDetail {
  files?: Array<{ filename: string }>;
}

// รวมชื่อไฟล์ทั้งหมดจาก commits ของ PR ที่ author ตรงกับ username ที่ระบุ
async function getFilenamesByCommitAuthor(username: string): Promise<Set<string>> {
  const filenames = new Set<string>();
  const target = username.toLowerCase();
  let page = 1;

  while (page <= 3) { // รองรับสูงสุด 300 commits
    const { status, data, text } = await githubApiGet<PrCommit[]>(
      `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/commits?per_page=100&page=${page}`
    );
    if (status !== 200 || !Array.isArray(data)) {
      console.error(`GitHub commits API error: ${status} ${text.slice(0, 500)}`);
      return filenames;
    }

    for (const commit of data) {
      if ((commit.author?.login ?? "").toLowerCase() !== target) continue;
      const detail = await githubApiGet<CommitDetail>(
        `https://api.github.com/repos/${REPO}/commits/${commit.sha}`
      );
      if (detail.status !== 200) {
        console.error(`Commit API error for ${commit.sha.slice(0, 7)}: ${detail.status}`);
        continue;
      }
      for (const file of detail.data.files ?? []) filenames.add(file.filename);
    }

    if (data.length < 100) break;
    page++;
  }

  return filenames;
}

async function filterFilesByUser(files: GitHubFile[]): Promise<GitHubFile[]> {
  if (USERNAME === "all") return files;

  console.log(`Filtering changed files by commit author: ${USERNAME}`);
  const filesByUser = await getFilenamesByCommitAuthor(USERNAME);
  if (!filesByUser.size) {
    console.log(`No commits authored by '${USERNAME}' found in this PR.`);
    return [];
  }

  const filtered = files.filter((f) => filesByUser.has(f.filename));
  console.log(`${filtered.length} file(s) changed by '${USERNAME}': ${filtered.map((f) => f.filename).join(", ") || "(none)"}`);
  return filtered;
}

// รวม diff ของทุกไฟล์เป็นข้อความเดียว (โหมด comment รวมทั้ง PR)
function buildDiffText(files: GitHubFile[]): string {
  let diffContent = "";

  for (const file of files) {
    if (file.patch) {
      diffContent += `File: ${file.filename}\n${file.patch}\n\n`;
      if (diffContent.length > MAX_DIFF_CHARS) {
        diffContent = diffContent.slice(0, MAX_DIFF_CHARS) + "\n\n... (diff truncated)";
        break;
      }
    }
  }

  return diffContent;
}

// --- โหมด files_changed: review ทีละไฟล์แล้วโพสต์ inline comment บน diff ---

// หมายเลขบรรทัดฝั่งไฟล์ใหม่ที่แปะ inline comment ได้ (เฉพาะบรรทัดที่อยู่ใน hunk ของ diff)
function commentableLines(patch: string): number[] {
  const lines: number[] = [];
  let newLine = 0; // 0 = ยังไม่เข้า hunk แรก (ข้ามส่วน header +++/---)

  for (const raw of patch.split("\n")) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(raw);
    if (hunk) {
      newLine = parseInt(hunk[1], 10);
      continue;
    }
    if (newLine === 0 || raw.startsWith("\\") || raw.startsWith("-")) continue;
    lines.push(newLine++);
  }

  return lines;
}

function snapToNearestLine(target: number, valid: number[]): number | null {
  if (!valid.length) return null;
  let best = valid[0];
  let bestDist = Math.abs(target - best);
  for (const line of valid) {
    const dist = Math.abs(target - line);
    if (dist < bestDist) {
      best = line;
      bestDist = dist;
    }
  }
  return best;
}

// คาดหวัง JSON array [{"line": 123, "comment": "..."}] — parseแบบยืดหยุ่น
function parseInlineComments(raw: string): Array<{ line: number; comment: string }> {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const items: Array<{ line: number; comment: string }> = [];
  for (const entry of parsed) {
    const record = entry as Record<string, unknown>;
    const line = parseInt(String(record?.line), 10);
    const comment = record?.comment;
    if (!Number.isFinite(line) || typeof comment !== "string" || !comment.trim()) continue;
    items.push({ line, comment: comment.trim() });
  }
  return items;
}

async function reviewFilesInline(files: GitHubFile[]): Promise<void> {
  const inline: FileInlineComment[] = [];

  for (const file of files) {
    let patch = file.patch ?? "";
    if (patch.length > MAX_DIFF_CHARS) {
      patch = patch.slice(0, MAX_DIFF_CHARS) + "\n... (patch truncated)";
    }

    const systemPrompt =
      `You are an expert Code Reviewer. You review one changed file and leave short, precise inline comments. ` +
      `Respond ONLY with a JSON array (no markdown fences, no extra text). Write comments in ${LANGUAGE}.`;
    const userPrompt =
      `Review the diff below and list problems or improvements worth flagging.\n` +
      `Return a JSON array; each item must be {"line": <line number in the NEW version of the file>, "comment": "<concise review comment>"}.\n` +
      `Anchor each comment to the most relevant changed line. If nothing needs a comment, return [].\n\n` +
      `File: ${file.filename}\n${patch}`;

    console.log(`Reviewing ${file.filename} (${patch.length} chars)...`);
    const result = await askAI(systemPrompt, userPrompt);
    const valid = commentableLines(patch);

    for (const item of parseInlineComments(result)) {
      const line = snapToNearestLine(item.line, valid);
      if (line === null) continue;
      inline.push({ path: file.filename, line, body: item.comment });
      if (inline.length >= MAX_INLINE_COMMENTS) break;
    }
    if (inline.length >= MAX_INLINE_COMMENTS) {
      console.log(`Reached inline comment cap (${MAX_INLINE_COMMENTS}); skipping remaining files.`);
      break;
    }
  }

  if (!inline.length) {
    console.log("AI left no inline comments.");
    return;
  }

  await postInlineReview(inline);
}

// สร้าง PR review พร้อม inline comments ผูกกับบรรทัดใน tab Files changed
async function postInlineReview(comments: FileInlineComment[]): Promise<void> {
  const url = `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/reviews`;
  const provider = PROVIDER ?? "copilot";
  const scope = USERNAME !== "all" ? ` — changes by @${USERNAME}` : "";
  const payload = JSON.stringify({
    body: `## ${TITLE} — \`${MODEL}\` via \`${provider}\`${scope}\n\nReviewed changed files: ${comments.length} inline comment(s).`,
    event: "COMMENT",
    comments: comments.map((c) => ({ path: c.path, line: c.line, body: c.body })),
  });

  const options: https.RequestOptions = {
    method: "POST",
    headers: {
      Authorization: `token ${GH_PAT}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "User-Agent": "ai-code-review",
    },
  };

  const { status, text } = await fetchJson<unknown>(url, options, payload);

  if (status >= 200 && status < 300) {
    console.log(`Inline review posted successfully (${comments.length} comment(s)).`);
    return;
  }

  console.error(`Failed to post inline review: ${status} ${text.slice(0, 300)}`);
  console.log("Falling back to a single PR comment...");
  const fallback = comments.map((c) => `**\`${c.path}:${c.line}\`**\n\n${c.body}`).join("\n\n");
  await postCommentToPr(fallback);
}

// 2. ส่งข้อมูลไปถาม AI
async function askAI(systemPrompt: string, userPrompt: string): Promise<string> {
  console.log(`Using api_type: ${API_TYPE} (${API_URL})`);
  if (isGithubModelsProvider(PROVIDER, API_URL) && API_TYPE === "chat") {
    return askGitHubModels(systemPrompt, userPrompt);
  }
  if (API_TYPE === "chat" || API_TYPE === "text") {
    return askOpenAICompat(systemPrompt, userPrompt);
  }
  if (API_TYPE === "messages") {
    return askAnthropic(systemPrompt, userPrompt);
  }
  if (API_TYPE === "responses") {
    return askResponses(systemPrompt, userPrompt);
  }
  return askOpenAICompat(systemPrompt, userPrompt);
}

// 2b. GitHub Models — ใช้ @azure-rest/ai-inference SDK อย่างเป็นทางการ
async function askGitHubModels(systemPrompt: string, userPrompt: string): Promise<string> {
  const endpoint = API_URL.replace(/\/chat\/completions\/?$/, "");
  const token = GH_PAT ?? API_KEY;
  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: MODEL,
      max_tokens: MAX_TOKENS,
    },
  });

  if (isUnexpected(response)) {
    const errText = JSON.stringify(response.body.error ?? response.body);
    console.error(`GitHub Models API error: ${response.status}`);
    console.error(`Response: ${errText.slice(0, 500)}`);
    return `⚠️ GitHub Models API returned status ${response.status}. Response: ${errText.slice(0, 200)}`;
  }

  return response.body.choices?.[0]?.message?.content ?? "";
}

async function askOpenAICompat(systemPrompt: string, userPrompt: string): Promise<string> {
  const isChat = API_TYPE !== "text";

  const payload = isChat
    ? JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      })
    : JSON.stringify({
        model: MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        max_tokens: MAX_TOKENS,
      });

  const headers: Record<string, string | number> = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "User-Agent": "ai-code-review",
  };

  // Azure uses api-key header instead of Bearer
  if (isAzureProvider(PROVIDER, API_URL)) {
    delete (headers as Record<string, unknown>)["Authorization"];
    headers["api-key"] = API_KEY;
  }

  if (isCopilotUrl(API_URL)) {
    headers["editor-version"] = "vscode/1.95.0";
    headers["editor-plugin-version"] = "copilot-chat/0.22.0";
    headers["openai-organization"] = "github-copilot";
    headers["openai-intent"] = "copilot-ghost";
  }

  const options: https.RequestOptions = { method: "POST", headers };
  const { status, data, text } = await fetchJson<OpenAIResponse>(API_URL, options, payload);

  if (status !== 200) {
    console.error(`AI API error: ${status}`);
    console.error(`Response: ${text.slice(0, 500)}`);
    return `⚠️ AI API returned status ${status}. Response: ${text.slice(0, 200)}`;
  }

  if (!data.choices?.length) {
    console.error(`Unexpected AI response: ${text.slice(0, 500)}`);
    return `⚠️ Unexpected AI API response format: ${text.slice(0, 200)}`;
  }

  return isChat
    ? (data.choices[0].message?.content ?? "")
    : (data.choices[0].text ?? "");
}

async function askAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const payload = JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const options: https.RequestOptions = {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "User-Agent": "ai-code-review",
    },
  };

  const { status, data, text } = await fetchJson<AnthropicResponse>(API_URL, options, payload);

  if (status !== 200) {
    console.error(`Anthropic API error: ${status}`);
    console.error(`Response: ${text.slice(0, 500)}`);
    return `⚠️ Anthropic API returned status ${status}. Response: ${text.slice(0, 200)}`;
  }

  const textBlock = data.content?.find((c) => c.type === "text");
  if (!textBlock) {
    console.error(`Unexpected Anthropic response: ${text.slice(0, 500)}`);
    return `⚠️ Unexpected Anthropic API response format: ${text.slice(0, 200)}`;
  }

  return textBlock.text;
}

async function askResponses(systemPrompt: string, userPrompt: string): Promise<string> {
  const payload = JSON.stringify({
    model: MODEL,
    instructions: systemPrompt,
    input: userPrompt,
  });

  const options: https.RequestOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "User-Agent": "ai-code-review",
    },
  };

  const { status, data, text } = await fetchJson<ResponsesAPIResponse>(API_URL, options, payload);

  if (status !== 200) {
    console.error(`Responses API error: ${status}`);
    console.error(`Response: ${text.slice(0, 500)}`);
    return `⚠️ Responses API returned status ${status}. Response: ${text.slice(0, 200)}`;
  }

  const message = data.output?.find((o) => o.type === "message");
  const textBlock = message?.content?.find((c) => c.type === "output_text");
  if (!textBlock) {
    console.error(`Unexpected Responses API response: ${text.slice(0, 500)}`);
    return `⚠️ Unexpected Responses API response format: ${text.slice(0, 200)}`;
  }

  return textBlock.text;
}

// 3. โพสต์คำตอบกลับลงใน GitHub PR
async function postCommentToPr(message: string): Promise<void> {
  const url = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`;
  const provider = PROVIDER ?? "copilot";
  const scope = USERNAME !== "all" ? ` — changes by @${USERNAME}` : "";
  const payload = JSON.stringify({
    body: `## ${TITLE} — \`${MODEL}\` via \`${provider}\`${scope}\n\n${message}`,
  });

  const options: https.RequestOptions = {
    method: "POST",
    headers: {
      Authorization: `token ${GH_PAT}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "User-Agent": "ai-code-review",
    },
  };

  const { status, text } = await fetchJson<unknown>(url, options, payload);

  if (status === 200 || status === 201) {
    console.log("Comment posted successfully.");
  } else {
    console.error(`Failed to post comment: ${status} ${text.slice(0, 300)}`);
  }
}

// --- Main Execution ---
async function getCopilotToken(ghPat: string): Promise<string> {
  const url = "https://api.github.com/copilot_internal/v2/token";
  const options: https.RequestOptions = {
    method: "GET",
    headers: {
      Authorization: `token ${ghPat}`,
      Accept: "application/json",
      "User-Agent": "ai-code-review",
    },
  };
  const { status, data, text } = await fetchJson<{ token?: string }>(url, options);
  if (status !== 200 || !data.token) {
    throw new Error(`Failed to get Copilot token: ${status} ${text.slice(0, 200)}`);
  }
  console.log("Copilot token obtained.");
  return data.token;
}

async function main(): Promise<void> {
  if (!GH_PAT || !PR_NUMBER || !REPO) {
    console.error("Missing required environment variables. Set GH_PAT, PR_NUMBER, REPO.");
    process.exit(1);
  }

  console.log("Fetching PR diff...");

  // Exchange PAT for Copilot session token when using Copilot API.
  // Uses api_key (personal PAT with Copilot subscription) if provided,
  // otherwise falls back to gh_pat. Note: GITHUB_TOKEN will fail here — use a personal PAT.
  if (isCopilotUrl(API_URL)) {
    const patForExchange = EXPLICIT_API_KEY ?? GH_PAT ?? "";
    if (!patForExchange) {
      console.error("Copilot requires a GitHub personal PAT with Copilot subscription. Set api_key (preferred) or gh_pat.");
      process.exit(1);
    }
    console.log("Exchanging GitHub PAT for Copilot session token...");
    API_KEY = await getCopilotToken(patForExchange);
  }

  const files = await filterFilesByUser(await getPrFiles());

  if (FILES_CHANGED) {
    const reviewable = files.filter((f) => f.patch);
    if (!reviewable.length) {
      console.log("No changed files with a diff to review.");
      return;
    }
    console.log(`files_changed mode: reviewing ${reviewable.length} changed file(s) inline...`);
    await reviewFilesInline(reviewable);
    console.log("Done!");
    return;
  }

  const diff = buildDiffText(files);

  if (!diff) {
    console.log("No diff found or diff is too large.");
  } else {
    console.log(`Diff size: ${diff.length} chars. Sending to AI...`);
    const systemPrompt = `You are an expert Code Reviewer. Review the code and respond in ${LANGUAGE}.`;
    const userPrompt = `Please review the following code diff and suggest improvements. Also point out any security vulnerabilities if present. Respond in ${LANGUAGE}.\n\n${diff}`;
    const reviewResult = await askAI(systemPrompt, userPrompt);

    console.log("Posting comment to GitHub...");
    await postCommentToPr(reviewResult);
    console.log("Done!");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
