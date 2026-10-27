import * as https from "https";
import * as fs from "fs";
import * as path from "path";
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
// 0 หรือค่าว่าง (default) = ไม่จำกัดจำนวน inline comments — ตั้งเลข > 0 เพื่อกลับมามีโควตา
const MAX_INLINE_COMMENTS =
  parseInt(process.env.INPUT_MAX_COMMENTS ?? process.env.MAX_COMMENTS ?? "0", 10) || 0;
// agent รันพร้อมกัน (concurrent) — จำกัดจำนวน AI call พร้อมกันกันโดน rate limit
const MAX_CONCURRENT_AI_CALLS = 5;

// รัน task หลายตัวพร้อมกันแบบจำกัด concurrency — ผลลัพธ์คงลำดับเดิมตาม array
async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (next < tasks.length) {
      const idx = next++;
      results[idx] = await tasks[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}
// "all" = review การเปลี่ยนแปลงของทุกคน, ไม่ระบุ = ใช้ user ที่ run workflow (GITHUB_ACTOR)
const USERNAME = ((process.env.INPUT_USERNAME ?? "").trim() || process.env.GITHUB_ACTOR || "all").toLowerCase();
// โหมด thinking/reasoning ของโมเดล (ใช้ได้เฉพาะโมเดล/ผู้ให้บริการที่รองรับ)
const MODE = (process.env.INPUT_MODE ?? process.env.MODE ?? "normal").trim().toLowerCase();
// "none" = ไม่ส่ง (ใช้เป็น default ใน dropdown ของ workflow)
const EFFORT_RAW = (process.env.INPUT_EFFORT ?? process.env.EFFORT ?? "").trim().toLowerCase();
const EFFORT = EFFORT_RAW === "none" ? "" : EFFORT_RAW;
const VALID_EFFORTS = ["low", "medium", "high", "max"];
if (EFFORT && !VALID_EFFORTS.includes(EFFORT)) {
  console.warn(`Invalid effort '${EFFORT}' — ignored (valid: ${VALID_EFFORTS.join(", ")}).`);
}

// Multi-agent review: author (self-review) / primary (peer) / specialist (tech lead + security/DBA)
// นิยาม agent อยู่ในไฟล์ agents/<agent name>.md — บรรทัดแรก '# ชื่อที่แสดง' ที่เหลือคือ persona
type ReviewAgent = "author" | "primary" | "specialist" | "checklist";
const AGENT_ORDER: ReviewAgent[] = ["author", "primary", "specialist", "checklist"];

// โฟลเดอร์ built-in agents อยู่ข้าง dist (agents/ ที่ root ของ action repo)
const BUILT_IN_AGENTS_DIR = path.join(__dirname, "..", "agents");
const AGENTS_PATH_INPUT = (process.env.INPUT_AGENTS_PATH ?? "").trim();

function loadAgentFiles(dir: string): Map<string, { label: string; persona: string }> {
  const agents = new Map<string, { label: string; persona: string }>();
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    return agents;
  }
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8").trim();
      if (!raw) continue;
      const lines = raw.split("\n");
      const heading = /^#\s+(.*)$/.exec(lines[0] ?? "");
      const label = heading ? heading[1].trim() : file.replace(/\.md$/i, "");
      const persona = heading ? lines.slice(1).join("\n").trim() : raw;
      agents.set(file.replace(/\.md$/i, "").toLowerCase(), { label, persona });
    } catch (err) {
      console.warn(`agents: cannot read '${file}' — skipped (${(err as Error).message}).`);
    }
  }
  return agents;
}

// คำสั่ง format ตาราง checklist (ใช้ในโหมดรายงาน — ไม่ใส่ใน persona เพราะโหมด inline ต้องการ JSON)
const CHECKLIST_TABLE_INSTRUCTION =
  " Present the checklist result as a markdown table with columns | # | Item | Status | Note | " +
  "(✅ pass, ⚠️ needs attention, ❌ fail, ➖ not applicable). Structure the report with a clear section per responsibility.";
const AGENTS_RAW = (process.env.INPUT_AGENTS ?? process.env.AGENTS ?? "").trim().toLowerCase();

// --- Custom agents: override built-in หรือเพิ่ม agent ใหม่ผ่าน JSON array ---
// รูปแบบ: [{"name": "primary", "persona": "..."}] (override) หรือ [{"name": "db", "label": "🗄️ DBA", "persona": "..."}] (agent ใหม่)
interface CustomAgentDef {
  name?: unknown;
  label?: unknown;
  persona?: unknown;
}

function parseCustomAgents(raw: string): Array<{ name: string; label?: string; persona?: string }> {
  const cleaned = raw.trim().replace(/```(?:json)?/gi, "").trim();
  if (!cleaned) return [];
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) {
    console.warn("custom_agents: no JSON array found — ignored.");
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch (err) {
    console.warn(`custom_agents: invalid JSON — ignored (${(err as Error).message}).`);
    return [];
  }
  if (!Array.isArray(parsed)) {
    console.warn("custom_agents: expected a JSON array — ignored.");
    return [];
  }
  const defs: Array<{ name: string; label?: string; persona?: string }> = [];
  for (const entry of parsed) {
    const record = entry as CustomAgentDef;
    if (typeof record?.name !== "string" || !record.name.trim()) {
      console.warn("custom_agents: entry without a 'name' — skipped.");
      continue;
    }
    defs.push({
      name: record.name.trim(),
      label: typeof record.label === "string" && record.label.trim() ? record.label.trim() : undefined,
      persona: typeof record.persona === "string" && record.persona.trim() ? record.persona.trim() : undefined,
    });
  }
  return defs;
}

const CUSTOM_AGENTS = parseCustomAgents(process.env.INPUT_CUSTOM_AGENTS ?? process.env.CUSTOM_AGENTS ?? "");

// registry: built-in จาก agents/ ข้าง dist → agents_path ของ repo ผู้ใช้ → custom_agents (JSON)
// (ชื่อซ้ำ = override ตัวเดิม)
const AGENT_REGISTRY = new Map<string, { label: string; persona: string }>();
for (const [name, profile] of loadAgentFiles(BUILT_IN_AGENTS_DIR)) AGENT_REGISTRY.set(name, profile);
if (!AGENT_REGISTRY.size) {
  console.warn(`No agent files found in ${BUILT_IN_AGENTS_DIR} — only the combined single review will work.`);
}
if (AGENTS_PATH_INPUT) {
  const fromPath = loadAgentFiles(AGENTS_PATH_INPUT);
  for (const [name, profile] of fromPath) AGENT_REGISTRY.set(name, profile);
  console.log(`agents_path: loaded ${fromPath.size} agent file(s) from ${AGENTS_PATH_INPUT}`);
}
for (const def of CUSTOM_AGENTS) {
  const existing = AGENT_REGISTRY.get(def.name);
  AGENT_REGISTRY.set(def.name, {
    label: def.label ?? existing?.label ?? def.name,
    persona: def.persona ?? existing?.persona ?? "You are a code reviewer reviewing this pull request.",
  });
}
// agent รวม (default โหมดเดียว) — ไม่นับเป็น custom ที่เลือกผ่าน agents ได้
const COMBINED_PERSONA =
  AGENT_REGISTRY.get("combined")?.persona ??
  "You are an expert Code Reviewer combining the author, primary reviewer, and specialist perspectives.";
const CUSTOM_AGENT_NAMES = [...AGENT_REGISTRY.keys()].filter(
  (n) => !AGENT_ORDER.includes(n as ReviewAgent) && n !== "combined"
);

function resolveAgents(): string[] {
  const raw = AGENTS_RAW === "none" ? "" : AGENTS_RAW;
  const available = [...AGENT_ORDER.filter((a) => AGENT_REGISTRY.has(a)), ...CUSTOM_AGENT_NAMES];
  const lowerMap = new Map(available.map((n) => [n.toLowerCase(), n]));

  if (!raw) return CUSTOM_AGENT_NAMES; // ไม่ระบุ agents → รันเฉพาะ agent ใหม่จาก custom_agents (ถ้ามี)
  if (raw === "all") return available;

  const selected: string[] = [];
  const unknown: string[] = [];
  for (const name of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    const real = lowerMap.get(name);
    if (real) {
      if (!selected.includes(real)) selected.push(real);
    } else {
      unknown.push(name);
    }
  }
  if (unknown.length) console.warn(`Unknown agents ignored: ${unknown.join(", ")}`);
  return selected;
}
const AGENTS = resolveAgents();

// --- Skills: โมดูลความรู้ที่แทรกเข้า system prompt ของทุก agent เมื่อเปิดใช้ ---
interface SkillDef {
  name: string;
  description: string;
  content: string;
}

const BUILT_IN_SKILLS: SkillDef[] = [
  {
    name: "security",
    description: "OWASP-style security review of the changed code",
    content:
      "- Injection (SQL/NoSQL/command/template): flag string-concatenated queries and unescaped shell calls\n" +
      "- XSS: unescaped user input rendered in HTML/templates\n" +
      "- Auth: missing authorization checks on new endpoints; IDOR on user-scoped resources\n" +
      "- Secrets: hardcoded keys/tokens/passwords, secrets logged or sent to the client\n" +
      "- Validate input at trust boundaries; avoid unsafe deserialization and SSRF via user-controlled URLs",
  },
  {
    name: "testing",
    description: "Test coverage and test quality guidance",
    content:
      "- Identify behavior changed by this diff that lacks unit/integration coverage\n" +
      "- Tests should cover the happy path, key edge cases (empty/null/boundary), and error paths\n" +
      "- Flag tests that mock everything and assert nothing meaningful\n" +
      "- Non-deterministic tests (time, random, network) should be controlled or faked",
  },
  {
    name: "performance",
    description: "Performance and resource usage review",
    content:
      "- N+1 queries: queries or async calls inside loops\n" +
      "- Missing indexes for new query patterns; unbounded queries without LIMIT/pagination\n" +
      "- O(n^2) patterns and large in-memory payloads on hot paths\n" +
      "- Cache repeated expensive work; bound concurrency",
  },
  {
    name: "clean-code",
    description: "Readability and maintainability review",
    content:
      "- Names should reveal intent; flag abbreviations and misleading names\n" +
      "- Functions should do one thing; flag long functions and deep nesting (suggest guard clauses)\n" +
      "- DRY: duplicated logic to extract; dead code and commented-out blocks to remove\n" +
      "- Magic numbers/strings should become named constants",
  },
  {
    name: "error-handling",
    description: "Error handling and resilience review",
    content:
      "- Catch errors and handle them with meaningful messages; no silent swallowing\n" +
      "- External calls (HTTP/DB) need timeouts; retry with backoff where appropriate\n" +
      "- Distinguish expected failures (validation) from unexpected ones (bugs)\n" +
      "- Clean up resources on failure paths; keep error types consistent",
  },
  {
    name: "api-contract",
    description: "API design and backward compatibility review",
    content:
      "- REST conventions: resource naming, correct status codes, pagination\n" +
      "- Breaking changes (removed/renamed fields and endpoints) must be flagged loudly\n" +
      "- Validate request payloads; document new params/fields (e.g. OpenAPI) where applicable\n" +
      "- Use versioning for incompatible changes",
  },
];

const SKILLS_RAW = (process.env.INPUT_SKILLS ?? process.env.SKILLS ?? "").trim().toLowerCase();
const CUSTOM_SKILLS_RAW = (process.env.INPUT_CUSTOM_SKILLS ?? process.env.CUSTOM_SKILLS ?? "").trim();
const SKILLS_PATH = (process.env.INPUT_SKILLS_PATH ?? process.env.SKILLS_PATH ?? "").trim();

interface CustomSkillEntry {
  name?: unknown;
  description?: unknown;
  content?: unknown;
}

// custom_skills (JSON array) — name + content จำเป็น, description เป็นตัวเลือก
function parseCustomSkills(raw: string): SkillDef[] {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  if (!cleaned) return [];
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) {
    console.warn("custom_skills: no JSON array found — ignored.");
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch (err) {
    console.warn(`custom_skills: invalid JSON — ignored (${(err as Error).message}).`);
    return [];
  }
  if (!Array.isArray(parsed)) {
    console.warn("custom_skills: expected a JSON array — ignored.");
    return [];
  }
  const defs: SkillDef[] = [];
  for (const entry of parsed) {
    const record = entry as CustomSkillEntry;
    if (typeof record?.name !== "string" || !record.name.trim() || typeof record?.content !== "string" || !record.content.trim()) {
      console.warn("custom_skills: entry needs 'name' and 'content' — skipped.");
      continue;
    }
    defs.push({
      name: record.name.trim(),
      description: typeof record.description === "string" ? record.description.trim() : "",
      content: record.content.trim(),
    });
  }
  return defs;
}

// skills_path — import ไฟล์ *.md จากโฟลเดอร์ใน repo ทีละชุด (ชื่อ skill = ชื่อไฟล์,
// ถ้าบรรทัดแรกเป็น heading # จะใช้เป็น description)
function loadSkillsFromPath(dir: string): SkillDef[] {
  if (!dir) return [];
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".md"));
  } catch {
    console.warn(`skills_path: cannot read directory '${dir}' — skipped.`);
    return [];
  }
  const defs: SkillDef[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8").trim();
      if (!raw) continue;
      const lines = raw.split("\n");
      const heading = /^#\s+(.*)$/.exec(lines[0] ?? "");
      const description = heading ? heading[1].trim() : "";
      const content = heading ? lines.slice(1).join("\n").trim() : raw;
      defs.push({ name: file.replace(/\.md$/i, "").toLowerCase(), description, content });
    } catch (err) {
      console.warn(`skills_path: cannot read '${file}' — skipped (${(err as Error).message}).`);
    }
  }
  if (defs.length) console.log(`skills_path: imported ${defs.length} skill(s) from ${dir}`);
  return defs;
}

// registry: built-in + custom (JSON) + imported (folder) — ชื่อซ้ำ override ตัวเดิม
const SKILL_REGISTRY = new Map<string, SkillDef>();
for (const skill of BUILT_IN_SKILLS) SKILL_REGISTRY.set(skill.name, skill);
for (const skill of parseCustomSkills(CUSTOM_SKILLS_RAW)) SKILL_REGISTRY.set(skill.name, skill);
for (const skill of loadSkillsFromPath(SKILLS_PATH)) SKILL_REGISTRY.set(skill.name, skill);

// เลือก skill ตามค่า input: "", "auto", "all" หรือรายชื่อคั่น comma
function resolveSkillNames(files: GitHubFile[]): string[] {
  if (!SKILLS_RAW) return [];
  if (SKILLS_RAW === "all") return [...SKILL_REGISTRY.keys()];

  if (SKILLS_RAW === "auto") {
    // heuristics: เลือกตามเนื้อหาของ diff (ชื่อไฟล์ + patch)
    const paths = files.map((f) => f.filename).join("\n").toLowerCase();
    const text = files.map((f) => f.patch ?? "").join("\n").toLowerCase();
    const picked = new Set<string>(["security", "clean-code", "error-handling", "testing"]);
    if (/(select |insert |update |delete |sql|query|migration|schema|for\s*\(|while\s*\(|\.map\()/.test(text)) {
      picked.add("performance");
    }
    if (/(route|controller|api|endpoint|openapi|swagger|handler)/.test(paths)) {
      picked.add("api-contract");
    }
    return [...picked].filter((n) => SKILL_REGISTRY.has(n));
  }

  const lowerMap = new Map([...SKILL_REGISTRY.keys()].map((n) => [n.toLowerCase(), n]));
  const selected: string[] = [];
  const unknown: string[] = [];
  for (const name of SKILLS_RAW.split(",").map((s) => s.trim()).filter(Boolean)) {
    const real = lowerMap.get(name);
    if (real) {
      if (!selected.includes(real)) selected.push(real);
    } else {
      unknown.push(name);
    }
  }
  if (unknown.length) console.warn(`Unknown skills ignored: ${unknown.join(", ")}`);
  return selected;
}

// แปลงรายชื่อ skill เป็นบล็อกข้อความที่จะแทรกต่อท้าย system prompt ของ agent
function skillsBlock(skillNames: string[]): string {
  const parts = skillNames
    .map((n) => SKILL_REGISTRY.get(n))
    .filter((s): s is SkillDef => !!s)
    .map((s) => `### Skill: ${s.name}${s.description ? ` — ${s.description}` : ""}\n${s.content}`);
  if (!parts.length) return "";
  return `\n\n--- Skills (apply when relevant) ---\n${parts.join("\n\n")}`;
}
// ให้ agent ค้นหาข้อมูลจากเว็บเองได้ระหว่าง review (opt-in เพราะ provider ต้องรองรับ tools)
const WEB_SEARCH = (process.env.INPUT_WEB_SEARCH ?? process.env.WEB_SEARCH ?? "false").toLowerCase() === "true";
const MAX_SEARCH_ROUNDS = 3;

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
      tool_calls?: Array<{
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
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

// รวม mapping ชื่อไฟล์ → ชุด commit authors ของ PR นี้
// (ถ้าระบุ filterLogin จะดึงรายละเอียดเฉพาะ commits ของ user นั้นเพื่อประหยัด API calls)
async function getFileAuthors(filterLogin?: string): Promise<Map<string, Set<string>>> {
  const fileAuthors = new Map<string, Set<string>>();
  const target = filterLogin?.toLowerCase();
  let page = 1;

  while (page <= 3) { // รองรับสูงสุด 300 commits
    const { status, data, text } = await githubApiGet<PrCommit[]>(
      `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/commits?per_page=100&page=${page}`
    );
    if (status !== 200 || !Array.isArray(data)) {
      console.error(`GitHub commits API error: ${status} ${text.slice(0, 500)}`);
      return fileAuthors;
    }

    for (const commit of data) {
      const login = commit.author?.login;
      if (!login) continue; // commit ที่ไม่ได้ผูกกับ GitHub account
      if (target && login.toLowerCase() !== target) continue;
      const detail = await githubApiGet<CommitDetail>(
        `https://api.github.com/repos/${REPO}/commits/${commit.sha}`
      );
      if (detail.status !== 200) {
        console.error(`Commit API error for ${commit.sha.slice(0, 7)}: ${detail.status}`);
        continue;
      }
      for (const file of detail.data.files ?? []) {
        const authors = fileAuthors.get(file.filename) ?? new Set<string>();
        authors.add(login);
        fileAuthors.set(file.filename, authors);
      }
    }

    if (data.length < 100) break;
    page++;
  }

  return fileAuthors;
}

function filterFilesByUser(files: GitHubFile[], fileAuthors: Map<string, Set<string>>): GitHubFile[] {
  if (USERNAME === "all") return files;

  if (!fileAuthors.size) {
    console.log(`No commits authored by '${USERNAME}' found in this PR.`);
    return [];
  }

  const filtered = files.filter((f) => {
    const authors = [...(fileAuthors.get(f.filename) ?? [])];
    return authors.some((a) => a.toLowerCase() === USERNAME);
  });
  console.log(`${filtered.length} file(s) changed by '${USERNAME}': ${filtered.map((f) => f.filename).join(", ") || "(none)"}`);
  return filtered;
}

// สร้างบรรทัด scope พร้อม @mention:
// - ระบุ user  → "Reviewing changes by @user"
// - all        → "Reviewing changes by @a (file1, file2), @b (file3)" (tag เจ้าของ code เป็นรายคน)
function buildScopeLine(files: GitHubFile[], fileAuthors: Map<string, Set<string>>): string {
  if (USERNAME !== "all") return `Reviewing changes by @${USERNAME}\n\n`;

  const byAuthor = new Map<string, string[]>();
  for (const file of files) {
    for (const author of fileAuthors.get(file.filename) ?? []) {
      const list = byAuthor.get(author) ?? [];
      list.push(file.filename);
      byAuthor.set(author, list);
    }
  }
  if (!byAuthor.size) return "";

  const parts = [...byAuthor.entries()].map(([author, fileList]) => {
    const shown = fileList.slice(0, 3).map((f) => `\`${f}\``).join(", ");
    const more = fileList.length > 3 ? `, +${fileList.length - 3} more` : "";
    return `@${author} (${shown}${more})`;
  });
  return `Reviewing changes by ${parts.join(", ")}\n\n`;
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

// นับบรรทัด +/- ของ diff (สำหรับเช็คขนาด PR ของ agent "author")
function computeDiffStats(files: GitHubFile[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const file of files) {
    for (const line of (file.patch ?? "").split("\n")) {
      if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@") || line.startsWith("\\")) continue;
      if (line.startsWith("+")) added++;
      else if (line.startsWith("-")) removed++;
    }
  }
  return { added, removed };
}

// บรรทัดสรุปขนาด PR ตาม guideline 200–400 บรรทัด
function prSizeLine(files: GitHubFile[]): string {
  const { added, removed } = computeDiffStats(files);
  const total = added + removed;
  const verdict =
    total > 400
      ? " ⚠️ exceeds the 200–400 line guideline — consider splitting this PR"
      : " ✅ within the 200–400 line guideline";
  return `**PR size:** +${added} / -${removed} (${total} changed lines, ${files.length} files)${verdict}`;
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

// เจ้าของไฟล์: ระบุ user → user นั้น, all → เจ้าของตาม commit authorship
function fileOwners(filename: string, fileAuthors: Map<string, Set<string>>): string[] {
  if (USERNAME !== "all") return [USERNAME];
  return [...(fileAuthors.get(filename) ?? [])];
}

// link ไปหน้า profile GitHub — แสดงเป็น @username แต่ไม่ใช่ mention จริง
// (ไม่ส่ง notification ซ้ำทุก comment = ไม่ noise)
function ownerLinks(filename: string, fileAuthors: Map<string, Set<string>>): string {
  return fileOwners(filename, fileAuthors)
    .map((o) => `[@${o}](https://github.com/${o})`)
    .join(" ");
}

// link ชื่อเจ้าของงานขึ้นหน้า section ของทุก agent — แสดงเป็น @username คลิกได้ แต่ไม่ใช่ mention จริง
function ownerGreeting(files: GitHubFile[], fileAuthors: Map<string, Set<string>>): string {
  const owners: string[] = [];
  if (USERNAME !== "all") {
    owners.push(USERNAME);
  } else {
    for (const f of files) {
      for (const owner of fileAuthors.get(f.filename) ?? []) {
        if (!owners.includes(owner)) owners.push(owner);
      }
    }
  }
  return owners.length
    ? `${owners.map((o) => `[@${o}](https://github.com/${o})`).join(" ")} — `
    : "";
}

// คำสั่งให้ AI คุยกับเจ้าของโค้ดโดยตรง (แทนการพูดลอย ๆ)
// โหมดระบุ user → คุยกับ user เดี่ยว, โหมด all → แนบ mapping ไฟล์ → เจ้าของให้อ้างถูกคน
// (ใช้ชื่อล้วนไม่มี @ เพื่อไม่ให้เกิด mention จริงซ้ำในทุก section — link จริงอยู่ที่ prefix ของเรา)
function addresseePrompt(files: GitHubFile[], fileAuthors: Map<string, Set<string>>): string {
  if (USERNAME !== "all") {
    return `\n\nAddress the code owner ${USERNAME} directly in your response — talk to them by name (plain username, no @), not about them.`;
  }
  const lines = files
    .map((f) => {
      const owners = [...(fileAuthors.get(f.filename) ?? [])];
      return owners.length ? `${f.filename} → ${owners.join(", ")}` : null;
    })
    .filter((l): l is string => !!l)
    .slice(0, 30);
  if (!lines.length) return "";
  return (
    `\n\nFile owners — address the owner directly when commenting on their file ` +
    `(talk to them by name, plain username, no @):\n${lines.join("\n")}`
  );
}

interface CollectedComment {
  fi: number;
  ri: number;
  line: number;
  comment: FileInlineComment;
}

// แจกโควตาแบบ round-robin ต่อ agent — ให้ทุก agent มีส่วนแสดง (เรียงภายใน agent ตาม ไฟล์ → บรรทัด)
function collectWithQuota(collected: CollectedComment[], max: number): FileInlineComment[] {
  const byAgent = new Map<number, CollectedComment[]>();
  for (const c of collected) {
    const list = byAgent.get(c.ri) ?? [];
    list.push(c);
    byAgent.set(c.ri, list);
  }
  const agentOrder = [...byAgent.keys()].sort((x, y) => x - y);
  const result: FileInlineComment[] = [];
  while (result.length < max) {
    let added = false;
    for (const ri of agentOrder) {
      const item = byAgent.get(ri)!.shift();
      if (!item) continue;
      result.push(item.comment);
      added = true;
      if (result.length >= max) break;
    }
    if (!added) break; // ครบทุก agent แล้ว
  }
  return result;
}

async function reviewFilesInline(
  files: GitHubFile[],
  scopeLine = "",
  skillSuffix = "",
  fileAuthors: Map<string, Set<string>> = new Map()
): Promise<void> {
  // 📋 Checklist ไม่ทำ inline — สรุปตารางลง review summary (Conversation) และเริ่มรันขนานไปเลย
  let checklistSection = "";
  const checklistPromise =
    AGENTS.includes("checklist") && AGENT_REGISTRY.get("checklist")
      ? (async () => {
          const profile = AGENT_REGISTRY.get("checklist")!;
          const diff = buildDiffText(files);
          if (!diff) return;
          console.log(`${profile.label} summarizing to conversation...`);
          try {
            const userPrompt =
              `Run your code review checklist against the diff below.${CHECKLIST_TABLE_INSTRUCTION} Respond in ${LANGUAGE}.\n\n${diff}` +
              addresseePrompt(files, fileAuthors);
            const result = await askAI(profile.persona + skillSuffix, userPrompt);
            checklistSection =
              `### ${profile.label}\n\n${ownerGreeting(files, fileAuthors)}` +
              (closeUnbalancedFence(result.trim()) || "No findings.");
          } catch (err) {
            console.error(`${profile.label} failed: ${(err as Error).message}`);
          }
        })()
      : null;

  // agent ที่จะรันแบบ inline: ตาม input (built-in + custom) ยกเว้น checklist หรือโปรไฟล์เดี่ยวเมื่อไม่ได้ระบุ
  const inlineAgentNames = AGENTS.filter((a) => a !== "checklist");
  const reviewers: Array<{ label: string; system: string }> = [];
  for (const name of inlineAgentNames) {
    const p = AGENT_REGISTRY.get(name);
    if (!p) continue;
    reviewers.push({
      label: p.label,
      system:
        `${p.persona}${skillSuffix} ` +
        `Respond ONLY with a JSON array (no markdown fences, no extra text). Write comments in ${LANGUAGE}.`,
    });
  }
  if (!reviewers.length) {
    reviewers.push({
      label: "",
      system:
        `${COMBINED_PERSONA} ` +
        `You review one changed file and leave short, precise inline comments.${skillSuffix} ` +
        `Respond ONLY with a JSON array (no markdown fences, no extra text). Write comments in ${LANGUAGE}.`,
    });
  }

  // สร้าง job = (ไฟล์ × agent) แล้วรันพร้อมกันแบบจำกัด concurrency
  // เก็บลำดับ (ลำดับไฟล์, ลำดับ agent, เลขบรรทัด) ไว้จัดเรียงผลให้ deterministic หลังรันเสร็จ
  const fileIndex = new Map<GitHubFile, number>();
  files.forEach((f, i) => fileIndex.set(f, i));

  const collected: CollectedComment[] = [];

  const jobs: Array<() => Promise<void>> = [];
  for (const file of files) {
    let patch = file.patch ?? "";
    if (patch.length > MAX_DIFF_CHARS) {
      patch = patch.slice(0, MAX_DIFF_CHARS) + "\n... (patch truncated)";
    }
    const owners = fileOwners(file.filename, fileAuthors);
    const ownerLink = owners.length ? ownerLinks(file.filename, fileAuthors) : "";
    const valid = commentableLines(patch);

    const userPrompt =
      `Review the diff below and list problems or improvements worth flagging.\n` +
      `Return a JSON array; each item must be {"line": <line number in the NEW version of the file>, "comment": "<concise review comment>"}.\n` +
      `Anchor each comment to the most relevant changed line. If nothing needs a comment, return [].\n\n` +
      `File: ${file.filename}\n${patch}` +
      (owners.length
        ? `\n\nYou are talking directly to ${owners.join(", ")}, the owner(s) of this file — ` +
          `write your comment as if speaking to them by name (plain username, no @).`
        : "");

    reviewers.forEach((reviewer, ri) => {
      jobs.push(async () => {
        console.log(
          `Reviewing ${file.filename} (${patch.length} chars)${reviewer.label ? ` — ${reviewer.label}` : ""}...`
        );
        let result: string;
        try {
          result = await askAI(reviewer.system, userPrompt);
        } catch (err) {
          console.error(`  ${reviewer.label || "reviewer"} failed on ${file.filename}: ${(err as Error).message}`);
          return;
        }
        const items = parseInlineComments(result);
        if (!items.length) {
          console.log(`  ${reviewer.label || "reviewer"}: no inline comments parsed for ${file.filename}`);
          return;
        }
        for (const item of items) {
          const line = snapToNearestLine(item.line, valid);
          if (line === null) continue;
          collected.push({
            fi: fileIndex.get(file) ?? 0,
            ri,
            line,
            comment: {
              path: file.filename,
              line,
              // ทุก comment ขึ้นต้นด้วยชื่อเจ้าของไฟล์เป็น link ไป profile (แสดงเป็น @username แต่ไม่ใช่ mention จริง)
              body: closeUnbalancedFence(
                `${reviewer.label ? `**${reviewer.label}:** ` : ""}${ownerLink ? `${ownerLink} — ` : ""}${item.comment}`
              ),
            },
          });
        }
      });
    });
  }

  console.log(`Running ${jobs.length} inline review job(s) in parallel (concurrency ${MAX_CONCURRENT_AI_CALLS})...`);
  await runWithConcurrency(jobs, MAX_CONCURRENT_AI_CALLS);
  if (checklistPromise) await checklistPromise;

  // จัดลำดับให้ deterministic (ไฟล์ → agent → บรรทัด) แล้วเลือกตามโหมดโควตา:
  // - ไม่กำหนดโควตา (default) → โพสต์ทั้งหมด
  // - กำหนดโควตา → แจกแบบ round-robin ต่อ agent ให้ทุกตัวมีส่วนแสดง
  collected.sort((a, b) => a.fi - b.fi || a.ri - b.ri || a.line - b.line);
  const inline: FileInlineComment[] =
    MAX_INLINE_COMMENTS > 0 ? collectWithQuota(collected, MAX_INLINE_COMMENTS) : collected.map((c) => c.comment);
  if (MAX_INLINE_COMMENTS > 0 && collected.length > inline.length) {
    console.log(
      `Collected ${collected.length} inline comments — capped to ${MAX_INLINE_COMMENTS} (round-robin per agent).`
    );
  } else {
    console.log(`Collected ${inline.length} inline comment(s)${MAX_INLINE_COMMENTS > 0 ? "" : " — no cap"}.`);
  }

  if (!inline.length) {
    if (checklistSection) {
      // ไม่มี inline comment แต่ checklist มีผล — โพสต์เป็น comment ลง Conversation เลย
      console.log("No inline comments — posting checklist summary as a PR comment...");
      await postCommentToPr(checklistSection, scopeLine);
    } else {
      console.log("AI left no inline comments.");
    }
    return;
  }

  await postInlineReview(inline, scopeLine, checklistSection);
}

// สร้าง PR review พร้อม inline comments ผูกกับบรรทัดใน tab Files changed
// (checklistSection = สรุปตาราง checklist ที่จะแนบลง review body ใน tab Conversation)
async function postInlineReview(comments: FileInlineComment[], scopeLine = "", checklistSection = ""): Promise<void> {
  const url = `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/reviews`;
  const provider = PROVIDER ?? "copilot";
  const payload = JSON.stringify({
    body:
      `## ${TITLE} — \`${MODEL}\` via \`${provider}\`\n\n${scopeLine}` +
      `Reviewed changed files: ${comments.length} inline comment(s).` +
      (checklistSection ? `\n\n${checklistSection}` : ""),
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
  await postCommentToPr(`${checklistSection ? `${checklistSection}\n\n` : ""}${fallback}`, scopeLine);
}

// ปิด code fence ที่ไม่สมดุลในคำตอบของ AI — fence ที่เปิดโดยไม่ปิดจะกลืน markdown
// ของ section ถัดไป (ทำให้ heading ของ agent ตัวถัดไปหายไป)
// ตรวจทีละบรรทัดแบบ track เปิด/ปิด รองรับทั้ง ``` ~~~ และ fence ยาว 4+ backticks
function closeUnbalancedFence(text: string): string {
  const fenceRe = /^ {0,3}(`{3,}|~{3,})/gm;
  let openFence: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(text))) {
    if (!openFence) {
      openFence = m[1];
    } else if (m[1].charAt(0) === openFence.charAt(0) && m[1].length >= openFence.length) {
      openFence = null;
    }
  }
  return openFence ? `${text}\n${openFence}` : text;
}

// --- Web search tool (ใช้เมื่อ web_search=true) ---
const WEB_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the web for up-to-date information (docs, APIs, CVEs, best practices). Returns results with titles, URLs and snippets.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Search query" } },
      required: ["query"],
    },
  },
};

// ค้นหาผ่าน DuckDuckGo HTML endpoint (ไม่ต้องใช้ API key) — คืนผลลัพธ์แบบข้อความให้ model
async function duckDuckGoSearch(query: string): Promise<string> {
  const { status, text } = await fetchJson<unknown>(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ai-code-review-action/1.0)",
        Accept: "text/html",
      },
    }
  );
  if (status !== 200) return `(web search unavailable — HTTP ${status})`;

  const decode = (s: string) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/g, "/");
  const stripTags = (s: string) => decode(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  const realUrl = (href: string) => {
    const m = /[?&]uddg=([^&]+)/.exec(href);
    return m ? decodeURIComponent(m[1]) : href;
  };

  const results: Array<{ title: string; url: string }> = [];
  const snippets: string[] = [];
  const linkRe = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snipRe = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) && results.length < 5) {
    results.push({ title: stripTags(m[2]), url: realUrl(decode(m[1])) });
  }
  while ((m = snipRe.exec(text)) && snippets.length < 5) snippets.push(stripTags(m[1]));

  if (!results.length) return "(no results)";
  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}${snippets[i] ? `\n   ${snippets[i]}` : ""}`)
    .join("\n");
}

// ประมวลผล tool_calls ที่ได้จาก model — คืน messages ที่ต่อยอดแล้ว หรือ null ถ้าไม่มีการเรียก tool
async function handleWebSearchToolCalls(
  assistantMessage: { content?: string; tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }> },
  messages: Array<Record<string, unknown>>
): Promise<boolean> {
  const calls = WEB_SEARCH ? assistantMessage.tool_calls ?? [] : [];
  if (!calls.length) return false;

  messages.push({ role: "assistant", content: assistantMessage.content ?? "", tool_calls: calls });
  for (const call of calls) {
    if (call.function?.name !== "web_search") {
      messages.push({ role: "tool", tool_call_id: call.id, content: "unknown tool" });
      continue;
    }
    let query = "";
    try {
      query = String(JSON.parse(call.function?.arguments ?? "{}").query ?? "");
    } catch {
      // arguments ไม่ใช่ JSON ที่ถูกต้อง — ใช้ข้อความดิบไป search เลย
      query = call.function?.arguments ?? "";
    }
    console.log(`  🔎 agent web_search: ${query}`);
    const result = await duckDuckGoSearch(query);
    messages.push({ role: "tool", tool_call_id: call.id, content: result });
  }
  return true;
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

// พารามิเตอร์เสริมสำหรับโหมด thinking/effort — ส่งเฉพาะเมื่อผู้ใช้ระบุเท่านั้น
// (ค่าเริ่มต้น mode=normal, effort="" จะไม่ส่งอะไรเพิ่ม จึงไม่กระทบการใช้งานเดิม)

function isEffortValid(): boolean {
  return !!EFFORT && VALID_EFFORTS.includes(EFFORT);
}

// OpenAI-compatible chat: enable_thinking (Qwen-style) + reasoning_effort (OpenAI o-series/GPT-5)
function chatThinkingParams(): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  if (isEffortValid()) extras.reasoning_effort = EFFORT;
  if (MODE === "thinking") extras.enable_thinking = true;
  return extras;
}

// OpenAI Responses API: reasoning.effort
function responsesThinkingParams(): Record<string, unknown> {
  return isEffortValid() ? { reasoning: { effort: EFFORT } } : {};
}

// Anthropic Messages API: thinking ต้องมี budget_tokens และ max_tokens ต้องมากกว่า budget
function anthropicThinkingParams(): Record<string, unknown> {
  if (MODE !== "thinking") return {};
  const budgetByEffort: Record<string, number> = { low: 1024, medium: 2048, high: 4096, max: 16384 };
  let budget = (EFFORT && budgetByEffort[EFFORT]) || 1024;
  if (budget >= MAX_TOKENS) {
    budget = Math.max(1024, MAX_TOKENS - 1);
  }
  if (budget >= MAX_TOKENS) {
    console.warn(`Cannot enable thinking: max_tokens (${MAX_TOKENS}) must be greater than the thinking budget (min 1024).`);
    return {};
  }
  return { thinking: { type: "enabled", budget_tokens: budget } };
}

// 2b. GitHub Models — ใช้ @azure-rest/ai-inference SDK อย่างเป็นทางการ
async function askGitHubModels(systemPrompt: string, userPrompt: string): Promise<string> {
  const endpoint = API_URL.replace(/\/chat\/completions\/?$/, "");
  const token = GH_PAT ?? API_KEY;
  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  for (let round = 0; round <= MAX_SEARCH_ROUNDS; round++) {
    const body: Record<string, unknown> = {
      messages,
      model: MODEL,
      max_tokens: MAX_TOKENS,
      ...chatThinkingParams(),
    };
    if (WEB_SEARCH) body.tools = [WEB_SEARCH_TOOL];

    // body มี fields แบบ dynamic (tools/thinking) จึงต้อง cast ให้ผ่าน type ของ SDK
    const response = await client.path("/chat/completions").post({ body: body as never });

    if (isUnexpected(response)) {
      const errText = JSON.stringify(response.body.error ?? response.body);
      console.error(`GitHub Models API error: ${response.status}`);
      console.error(`Response: ${errText.slice(0, 500)}`);
      return `⚠️ GitHub Models API returned status ${response.status}. Response: ${errText.slice(0, 200)}`;
    }

    const choice = (response.body as unknown as { choices?: Array<Record<string, unknown>> }).choices?.[0];
    const msg = (choice?.message ?? {}) as {
      content?: string;
      tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }>;
    };

    if (await handleWebSearchToolCalls(msg, messages)) continue;
    return msg.content ?? "";
  }
  return "⚠️ Reached the web-search round limit without a final answer.";
}

async function askOpenAICompat(systemPrompt: string, userPrompt: string): Promise<string> {
  const isChat = API_TYPE !== "text";

  const buildOptions = (payload: string): https.RequestOptions => {
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

    return { method: "POST", headers };
  };

  if (isChat) {
    // web_search=true: วน function-calling loop — model เรียก web_search เราไปหาผลให้แล้วส่งกลับ
    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    for (let round = 0; round <= MAX_SEARCH_ROUNDS; round++) {
      const body: Record<string, unknown> = { model: MODEL, messages, ...chatThinkingParams() };
      if (WEB_SEARCH) body.tools = [WEB_SEARCH_TOOL];
      const payload = JSON.stringify(body);
      const { status, data, text } = await fetchJson<OpenAIResponse>(API_URL, buildOptions(payload), payload);

      if (status !== 200) {
        console.error(`AI API error: ${status}`);
        console.error(`Response: ${text.slice(0, 500)}`);
        return `⚠️ AI API returned status ${status}. Response: ${text.slice(0, 200)}`;
      }

      if (!data.choices?.length) {
        console.error(`Unexpected AI response: ${text.slice(0, 500)}`);
        return `⚠️ Unexpected AI API response format: ${text.slice(0, 200)}`;
      }

      const msg = data.choices[0].message;
      if (await handleWebSearchToolCalls(msg, messages)) continue;
      return msg.content ?? "";
    }
    return "⚠️ Reached the web-search round limit without a final answer.";
  }

  const payload = JSON.stringify({
    model: MODEL,
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    max_tokens: MAX_TOKENS,
  });

  const { status, data, text } = await fetchJson<OpenAIResponse>(API_URL, buildOptions(payload), payload);

  if (status !== 200) {
    console.error(`AI API error: ${status}`);
    console.error(`Response: ${text.slice(0, 500)}`);
    return `⚠️ AI API returned status ${status}. Response: ${text.slice(0, 200)}`;
  }

  if (!data.choices?.length) {
    console.error(`Unexpected AI response: ${text.slice(0, 500)}`);
    return `⚠️ Unexpected AI API response format: ${text.slice(0, 200)}`;
  }

  return data.choices[0].text ?? "";
}

async function askAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const payload = JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    ...anthropicThinkingParams(),
    // web_search=true: native server-side web search ของ Anthropic (model ค้นเอง)
    ...(WEB_SEARCH ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] } : {}),
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

  const textBlocks = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text);
  if (!textBlocks.length) {
    console.error(`Unexpected Anthropic response: ${text.slice(0, 500)}`);
    return `⚠️ Unexpected Anthropic API response format: ${text.slice(0, 200)}`;
  }

  return textBlocks.join("\n\n");
}

async function askResponses(systemPrompt: string, userPrompt: string): Promise<string> {
  const payload = JSON.stringify({
    model: MODEL,
    instructions: systemPrompt,
    input: userPrompt,
    ...responsesThinkingParams(),
    // web_search=true: native web search tool ของ OpenAI Responses API
    ...(WEB_SEARCH ? { tools: [{ type: "web_search" }] } : {}),
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

// 3. โพสต์คำตอบกลับลงใน GitHub PR (scopeLine = บรรทัด @mention ผู้เกี่ยวข้อง)
async function postCommentToPr(message: string, scopeLine = ""): Promise<void> {
  const url = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`;
  const provider = PROVIDER ?? "copilot";
  const payload = JSON.stringify({
    body: `## ${TITLE} — \`${MODEL}\` via \`${provider}\`\n\n${scopeLine}${message}`,
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

  // mapping ไฟล์ → commit authors (โหมด all ต้องใช้ทั้งหมดเพื่อ tag รายคน,
  // โหมดระบุ user ดึงเฉพาะ commits ของ user นั้น)
  const fileAuthors = await getFileAuthors(USERNAME === "all" ? undefined : USERNAME);
  const files = filterFilesByUser(await getPrFiles(), fileAuthors);

  // เลือก skills ครั้งเดียวแล้วใช้กับทุก agent / ทุกโหมด
  const skillNames = resolveSkillNames(files);
  const skillSuffix = skillsBlock(skillNames);
  console.log(`Skills: ${skillNames.join(", ") || "(none)"}`);

  if (FILES_CHANGED) {
    const reviewable = files.filter((f) => f.patch);
    if (!reviewable.length) {
      console.log("No changed files with a diff to review.");
      return;
    }
    console.log(`files_changed mode: reviewing ${reviewable.length} changed file(s) inline...`);
    await reviewFilesInline(reviewable, buildScopeLine(reviewable, fileAuthors), skillSuffix, fileAuthors);
    console.log("Done!");
    return;
  }

  const diff = buildDiffText(files);

  if (!diff) {
    console.log("No diff found or diff is too large.");
    return;
  }

  const scopeLine = buildScopeLine(files.filter((f) => f.patch), fileAuthors);
  const addressee = addresseePrompt(files, fileAuthors);
  const ownerGreet = ownerGreeting(files, fileAuthors);

  if (AGENTS.length) {
    console.log(`Diff size: ${diff.length} chars. Multi-agent review (parallel): ${AGENTS.join(", ")}...`);

    // รันทุก agent พร้อมกัน — Promise.all คงลำดับ section ตามลำดับใน AGENTS
    const agentResults = await Promise.all(
      AGENTS.map(async (agent) => {
        const profile = AGENT_REGISTRY.get(agent);
        if (!profile) return null;
        console.log(`${profile.label} reviewing...`);
        try {
          let agentUserPrompt = `Please review the following code diff and suggest improvements. Respond in ${LANGUAGE}.\n\n${diff}`;
          if (agent === "author") {
            agentUserPrompt = `This is your own code. Explain how it works (what each part does and why), self-review it, and point out any leftover debug code. Respond in ${LANGUAGE}.\n\n${diff}`;
            const stats = computeDiffStats(files);
            agentUserPrompt +=
              `\n\nContext: PR size +${stats.added} / -${stats.removed} across ${files.length} files. ` +
              `Guideline: keep PRs within 200–400 changed lines — if this exceeds the guideline, suggest how to split it.`;
          }
          if (agent === "checklist") {
            // สั่ง format ตรงนี้แทนใน persona — เพราะโหมด inline ต้องการ JSON (สั่งซ้อนใน persona จะชนกันแล้ว parser อ่านไม่ออก)
            agentUserPrompt =
              `Run your code review checklist against the diff below.${CHECKLIST_TABLE_INSTRUCTION} Respond in ${LANGUAGE}.\n\n${diff}`;
          }
          agentUserPrompt += addressee;
          const result = await askAI(profile.persona + skillSuffix, agentUserPrompt);
          return { agent, profile, text: closeUnbalancedFence(result.trim()) };
        } catch (err) {
          console.error(`${profile.label} failed: ${(err as Error).message}`);
          return { agent, profile, text: `⚠️ ${profile.label} could not complete: ${(err as Error).message}` };
        }
      })
    );

    const sections: string[] = [];
    for (const r of agentResults) {
      if (!r) continue;
      let section = `### ${r.profile.label}\n\n`;
      if (r.agent === "author") section += `${prSizeLine(files)}\n\n`;
      section += ownerGreet;
      sections.push(section + (r.text || "No findings."));
    }

    console.log("Posting comment to GitHub...");
    await postCommentToPr(sections.join("\n\n"), scopeLine);
    console.log("Done!");
    return;
  }

  console.log(`Diff size: ${diff.length} chars. Sending to AI (combined agent)...`);
  const userPrompt = `Please review the following code diff and suggest improvements. Also point out any security vulnerabilities if present. Respond in ${LANGUAGE}.\n\n${diff}${addressee}`;
  const reviewResult = await askAI(COMBINED_PERSONA + CHECKLIST_TABLE_INSTRUCTION + skillSuffix, userPrompt);

  console.log("Posting comment to GitHub...");
  await postCommentToPr(ownerGreet + closeUnbalancedFence(reviewResult), scopeLine);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
