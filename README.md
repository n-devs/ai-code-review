# AI Code Review Action

Automated PR code review powered by AI — supports GitHub Models, GitHub Copilot, OpenAI, Anthropic, Google Gemini, xAI, OpenRouter, Ollama, Azure, AWS, and more.

## Quick Start

Zero-config setup using **GitHub Models** — works with `GITHUB_TOKEN`, no extra secrets needed:

```yaml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  pull-requests: write
  contents: read
  models: read

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: n-devs/ai-code-review@v2
        with:
          gh_pat: ${{ secrets.GITHUB_TOKEN }}
          repo: ${{ github.repository }}
          pr_number: ${{ github.event.pull_request.number }}
          api_key: ${{ secrets.GITHUB_TOKEN }}
```

## Manual Run

Trigger the review manually from the **Actions** tab and choose the provider, model, API key, and PR number yourself:

```yaml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      pr_number:
        description: "Pull request number to review"
        required: true
        type: string
      provider:
        description: "AI provider"
        required: false
        type: choice
        default: "github-azure-models"
        options:
          - github-azure-models
          - github-models
          - copilot
          - openai
          - anthropic
          - openrouter
          - ollama
          - xai
          - zai
          - google
          - azure
          - aws
          - custom
      model:
        description: "AI model name (e.g. gpt-4o, openai/gpt-4o-mini, claude-3-5-sonnet-20241022)"
        required: false
        default: "gpt-4o"
        type: string
      api_key:
        description: "AI API key (leave empty to use GITHUB_TOKEN)"
        required: false
        default: ""
        type: string
      files_changed:
        description: "Post inline review comments on changed files (Files changed tab)"
        required: false
        default: false
        type: boolean
      username:
        description: "Review only changes by this GitHub username ('all' = everyone, empty = you)"
        required: false
        default: ""
        type: string
      mode:
        description: "Model mode (thinking enables reasoning mode)"
        required: false
        default: "normal"
        type: choice
        options:
          - normal
          - thinking
      effort:
        description: "Reasoning effort (none = don't send)"
        required: false
        default: "none"
        type: choice
        options:
          - none
          - low
          - medium
          - high
          - max

permissions:
  pull-requests: write
  contents: read
  models: read

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Mask API key in logs
        if: ${{ inputs.api_key != '' }}
        run: |
          key=$(jq -r '.inputs.api_key // empty' "$GITHUB_EVENT_PATH")
          if [ -n "$key" ]; then
            echo "::add-mask::$key"
          fi
      - uses: actions/checkout@v4
      - uses: n-devs/ai-code-review@v2
        with:
          gh_pat: ${{ secrets.GITHUB_TOKEN }}
          repo: ${{ github.repository }}
          pr_number: ${{ github.event.inputs.pr_number || github.event.pull_request.number }}
          provider: ${{ github.event.inputs.provider || 'github-azure-models' }}
          model: ${{ github.event.inputs.model || 'gpt-4o' }}
          api_key: ${{ github.event.inputs.api_key || secrets.GITHUB_TOKEN }}
          files_changed: ${{ github.event.inputs.files_changed || 'false' }}
          username: ${{ github.event.inputs.username || github.actor }}
          mode: ${{ github.event.inputs.mode || 'normal' }}
          effort: ${{ inputs.effort != 'none' && inputs.effort || '' }}
```

With this setup the workflow runs automatically on PR activity, and you can also go to **Actions → AI Code Review → Run workflow** to review any PR on demand with any provider/model. Enable **files_changed** to have the AI leave inline comments on the changed lines instead of one combined comment, and use **username** to scope the review to a single author's changes (`all` = everyone, leave empty = the user who runs the workflow).

To make the workflow **manual-only** (no automatic run when a PR is created), remove the `pull_request` trigger and keep only `workflow_dispatch` — inputs can then be referenced directly as `${{ inputs.<name> }}`.

> ⚠️ **Security note:** GitHub has no secret/password input type for `workflow_dispatch` — the form field is plain text, and a manually entered key stays visible in the run's event payload. The `::add-mask::` step above masks the key as `***` in the run logs (it reads the key from `$GITHUB_EVENT_PATH` at runtime, because values passed via `env:` are printed in the step's log header before masking takes effect). Prefer leaving `api_key` empty (falls back to `GITHUB_TOKEN`) or wiring it to a repository secret (e.g. `secrets.OPENAI_API_KEY`) instead of pasting a raw key.

## Skills

Skills are knowledge modules injected into **every agent's** system prompt when enabled — each one focuses the review on a specific area.

**Built-in skills:**

| Skill | Focus |
|---|---|
| `security` | Injection, XSS, auth checks, IDOR, secrets, input validation, SSRF |
| `testing` | Coverage of changed behavior, edge cases, meaningful assertions, deterministic tests |
| `performance` | N+1 queries, missing indexes, unbounded queries, O(n²) hot paths, caching |
| `clean-code` | Naming, small functions, guard clauses, DRY, dead code, magic numbers |
| `error-handling` | No silent swallowing, timeouts, retries, resource cleanup |
| `api-contract` | REST conventions, breaking changes, payload validation, versioning |

**Selecting skills** — the `skills` input:
- `auto` — picked from the diff content (always security/clean-code/error-handling/testing; adds `performance` for query/loop-heavy diffs and `api-contract` when routes/handlers change)
- `all` — every registered skill
- comma-separated names, e.g. `security,performance` — includes custom skills
- empty (default) — disabled

**Adding / importing your own skills:**

```yaml
# 1) Inline JSON
custom_skills: |
  [{"name": "k8s", "description": "Kubernetes review", "content": "- Check resource limits...\n- Check liveness/readiness probes"}]

# 2) Import a folder of markdown files from the repo
skills_path: .github/ai-skills
```

Each `*.md` file in the folder becomes a skill named after the file (an optional first-line `# Title` becomes its description). Later definitions override earlier ones with the same name.

## Multi-Agent Review

Set `agents: all` (or a comma-separated subset) to run the review as four AI agents with different roles. Each agent reviews independently and its findings are posted in its own section (or prefixed inline comments in `files_changed` mode).

| Agent | Role | Focus |
|---|---|---|
| `author` | 🧑‍💻 Author (Self-Review) | Self-reviews their own code: explains how the code works (what each part does and why) and flags leftover debug code — plus a deterministic **PR size check** against the 200–400 changed-lines guideline |
| `primary` | 🔍 Primary Reviewer | Business logic and correctness, edge cases, error handling, readability, and whether unit/integration tests cover the real behavior |
| `specialist` | 🛡️ Specialist Reviewer | System architecture, scalability, overall impact, security vulnerabilities (injection, auth, secrets), and database performance in critical paths — holds final approval for core/production systems |
| `checklist` | 📋 Code Review Checklist | Walks through a standard 12-item review checklist (correctness, readability, error handling, edge cases, security, performance, tests, docs, debug leftovers, compatibility, dependencies, logging) and reports ✅/⚠️/❌ per item as a table |

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    api_key: ${{ secrets.GITHUB_TOKEN }}
    agents: all                  # or e.g. "primary,specialist"
    files_changed: true          # optional: inline comments prefixed with the agent name
```

> Note: each agent is a separate AI call per diff (or per file in `files_changed` mode), so runtime and token usage grow with the number of agents.

### Custom Agents

Use `custom_agents` (a JSON array) to **override a built-in agent** or **add your own agent**:

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    api_key: ${{ secrets.GITHUB_TOKEN }}
    agents: primary,db          # run the (overridden) primary + the custom "db" agent
    custom_agents: |
      [
        {
          "name": "primary",
          "persona": "You are a strict Primary Reviewer for a fintech team. Check business logic, edge cases, error handling, readability, and test coverage. Flag anything that could affect money movement."
        },
        {
          "name": "db",
          "label": "🗄️ DBA Reviewer",
          "persona": "You are a DBA reviewing this change. Check schema changes, query performance (N+1, missing indexes), transaction usage, and migration safety."
        }
      ]
```

Rules:
- **`name` matching a built-in** (`author`, `primary`, `specialist`, `checklist`) → overrides its `persona`/`label`; anything you don't set keeps the default
- **New `name`** → adds a new agent; `label` is optional (defaults to the name), `persona` is the agent's role prompt
- Custom names can be used in the `agents` list, and `agents: all` runs built-ins **plus** customs
- If `agents` is empty, only the new custom agents run (overrides alone need the agent to be selected)
- Every agent (built-in or custom) supports `web_search`, `mode`/`effort`, and both review modes

### Web Search

Set `web_search: true` to let **every agent** look things up on the web while reviewing (docs, APIs, CVEs, best practices). How it works depends on the API type:

| `api_type` | Mechanism |
|---|---|
| `messages` (Anthropic) | Native server-side `web_search` tool — the model searches by itself |
| `responses` (OpenAI) | Native `web_search` tool |
| `chat` / GitHub Models | Function-calling loop: the model calls a `web_search` tool and the action searches DuckDuckGo (no API key needed, up to 3 rounds) and feeds results back |

> Requires a model/provider that supports tools — providers without tool support may reject the request. Combined with `agents: all`, each agent can search independently.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `gh_pat` | ✅ | — | GitHub PAT for GitHub API (fetching diff, posting comments) |
| `repo` | ✅ | — | Repository in `owner/repo` format |
| `pr_number` | ✅ | — | Pull request number to review |
| `api_key` | ✅ | — | API key for the provider. For `github-models`: use `GITHUB_TOKEN`. For `copilot`: use a personal PAT with Copilot subscription |
| `provider` | | `github-azure-models` | AI provider shorthand (see [Providers](#providers)) |
| `model` | | `gpt-4o` | Model name (see [Providers](#providers) for naming convention per provider) |
| `title` | | `AI Code Review` | Title shown in the PR comment header |
| `api_url` | | — | Full endpoint URL — overrides provider + api_type defaults |
| `api_type` | | `chat` | API format: `chat`, `responses`, or `messages` |
| `max_tokens` | | `2048` | Maximum tokens in AI response |
| `max_diff_chars` | | `10000` | Maximum characters of diff sent to AI |
| `language` | | `English` | Language for the review response |
| `files_changed` | | `false` | `true` = AI reviews each changed file and posts inline review comments on the diff (Files changed tab) instead of one combined PR comment |
| `username` | | run actor | GitHub username whose changes to review — only files changed in commits authored by this user, who is @mentioned in the comment. `all` = everyone, with each author @mentioned next to their files |
| `mode` | | `normal` | `thinking` = enable thinking/reasoning mode where supported (`enable_thinking` for OpenAI-compatible chat, `thinking` block for Anthropic messages). `normal` sends nothing extra |
| `effort` | | — | Reasoning effort: `low`, `medium`, `high`, `max` — adds `reasoning_effort` (chat), `reasoning.effort` (responses), or maps to the thinking budget (messages). Empty or `none` sends nothing |
| `agents` | | — | Multi-agent review: `all` or comma-separated (see [Multi-Agent Review](#multi-agent-review)). Empty = custom agents only, or single review if none |
| `custom_agents` | | — | JSON array to override built-in agents or add new ones (see [Custom Agents](#custom-agents)) |
| `skills` | | — | Skills injected into every agent's prompt: `auto`, `all`, comma-separated names, or empty (see [Skills](#skills)) |
| `custom_skills` | | — | Add your own skills as a JSON array (see [Skills](#skills)) |
| `skills_path` | | — | Import skills from a folder of `*.md` files in the repo, e.g. `.github/ai-skills` |
| `web_search` | | `false` | `true` = let the AI search the web during review (native tool for Anthropic messages / OpenAI responses; function-calling loop via DuckDuckGo for chat / GitHub Models — model must support tools) |

## Providers

| `provider` | `api_type` default | Base URL | Auth | Model naming |
|---|---|---|---|---|
| `github-azure-models` (default) | `chat` | `https://models.inference.ai.azure.com` | `GITHUB_TOKEN` ✅ | Plain name, e.g. `gpt-4o` |
| `github-models` | `chat` | `https://models.github.ai/inference` | `GITHUB_TOKEN` ✅ | Publisher-prefixed, e.g. `openai/gpt-4o-mini` |
| `copilot` | `chat` | `https://api.githubcopilot.com` | Personal PAT with Copilot subscription | Plain name, e.g. `gpt-4o` |
| `openai` | `chat` | `https://api.openai.com/v1` | API key | Plain name, e.g. `gpt-4o` |
| `anthropic` | `messages` | `https://api.anthropic.com/v1` | API key | e.g. `claude-3-5-sonnet-20241022` |
| `openrouter` | `chat` | `https://openrouter.ai/api/v1` | API key | e.g. `meta-llama/llama-3.3-70b-instruct` |
| `ollama` | `chat` | `http://localhost:11434/v1` | — | e.g. `llama3` |
| `xai` | `chat` | `https://api.x.ai/v1` | API key (Grok) | e.g. `grok-3` |
| `zai` | `chat` | `https://api.z.ai/api/coding/paas/v4` | API key (GLM) | provider-specific |
| `qwencloud` | `chat` | `https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1` | API key (Qwen Cloud) | e.g. `qwen-plus`, `qwen-max` |
| `qwencloud-plan` | `chat` | `https://token-plan.maas.qwencloudapi.com/compatible-mode/v1` | API key (Qwen Cloud plan) | e.g. `qwen-plus`, `qwen-max` |
| `google` | `chat` | `https://generativelanguage.googleapis.com/v1beta/openai` | API key | e.g. `gemini-2.0-flash` |
| `azure` | `chat` | ⚠️ requires `api_url` | `api-key` header | your deployment name |
| `aws` | `chat` | ⚠️ requires `api_url` | API key | provider-specific |
| `custom` | `chat` | ⚠️ requires `api_url` | API key | provider-specific |

> **Note:** `copilot` provider exchanges a personal PAT for a short-lived session token automatically. `GITHUB_TOKEN` from GitHub Actions will not work for Copilot — use `github-azure-models`/`github-models` instead for zero-config setups.
>
> **Qwen Cloud** has two shorthands: `qwencloud` (regional endpoint `ap-southeast-1.maas.qwencloudapi.com`) and `qwencloud-plan` (token-plan endpoint `token-plan.maas.qwencloudapi.com`). Both default to the OpenAI-compatible endpoint — set `api_type: messages` to use their Anthropic-compatible endpoint instead (`…/apps/anthropic/messages`).
>
> **GitHub Models has two provider shorthands:**
> - `github-azure-models` (default) uses the legacy `models.inference.ai.azure.com` endpoint with plain model names (`gpt-4o`).
> - `github-models` uses the current `models.github.ai/inference` endpoint documented in [GitHub's Quickstart](https://docs.github.com/en/github-models/quickstart), which requires publisher-prefixed model names (`openai/gpt-4o-mini`, `openai/gpt-5-mini`, etc.).
>
> If `github-azure-models` ever stops responding, switch to `provider: github-models` with a publisher-prefixed `model`.

## API Types

| `api_type` | Path appended | Compatible with |
|---|---|---|
| `chat` | `/chat/completions` | GitHub Models, Copilot, OpenAI, OpenRouter, Ollama, xAI, Google, Azure |
| `responses` | `/responses` | OpenAI Responses API |
| `messages` | `/messages` | Anthropic Claude |
| `text` | `/completions` | Legacy completions endpoint |

## Examples

### GitHub Models (default — zero config)

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    api_key: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Models (current endpoint, publisher-prefixed model)

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: github-models
    api_key: ${{ secrets.GITHUB_TOKEN }}
    model: openai/gpt-4o-mini
```

### GitHub Copilot

> Requires a personal PAT with Copilot subscription stored as `COPILOT_PAT` secret.

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: copilot
    api_key: ${{ secrets.COPILOT_PAT }}
    model: gpt-4o
```

### OpenAI GPT-4o

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: openai
    api_key: ${{ secrets.OPENAI_API_KEY }}
    model: gpt-4o
```

### Anthropic Claude

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: anthropic
    api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    model: claude-3-5-sonnet-20241022
    max_tokens: "8192"
```

### Google Gemini

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: google
    api_key: ${{ secrets.GOOGLE_API_KEY }}
    model: gemini-2.0-flash
```

### xAI Grok

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: xai
    api_key: ${{ secrets.XAI_API_KEY }}
    model: grok-3
```

### Qwen Cloud (OpenAI-compatible)

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: qwencloud
    api_key: ${{ secrets.QWEN_API_KEY }}
    model: qwen-plus
```

### Qwen Cloud (Anthropic-compatible, token-plan)

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: qwencloud-plan
    api_key: ${{ secrets.QWEN_API_KEY }}
    model: qwen-plus
    api_type: messages
```

### OpenRouter

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: openrouter
    api_key: ${{ secrets.OPENROUTER_API_KEY }}
    model: meta-llama/llama-3.3-70b-instruct
```

### Ollama (self-hosted)

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: ollama
    api_key: ""
    api_url: http://my-server:11434/v1/chat/completions
    model: llama3
```

### Azure OpenAI

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: azure
    api_key: ${{ secrets.AZURE_OPENAI_API_KEY }}
    api_url: https://my-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01
    model: gpt-4o
```

### OpenAI Responses API

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: openai
    api_key: ${{ secrets.OPENAI_API_KEY }}
    api_type: responses
    model: gpt-4o
```

### Custom Provider

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    provider: custom
    api_key: ${{ secrets.MY_API_KEY }}
    api_url: https://my-llm-proxy.internal/v1/chat/completions
    model: my-model
```

### Review in Thai

```yaml
- uses: n-devs/ai-code-review@v2
  with:
    gh_pat: ${{ secrets.GITHUB_TOKEN }}
    repo: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    api_key: ${{ secrets.GITHUB_TOKEN }}
    language: Thai
```

## Build

```bash
npm install
npm run build   # outputs dist/index.js via @vercel/ncc
npm test        # runs unit tests via vitest
```

## Deploy a release

Releases are deployed manually via **Actions → Deploy Release → Run workflow** with a `version` input (e.g. `v2.1.0`). Pick the branch to release from in GitHub's **Use workflow from** dropdown at the top of the Run workflow form — the branch list is filled in automatically. The release notes file is read from the selected branch and the release tag points at its head commit.

The workflow only deploys when the specified version matches a release notes file at `docs/release/v<version>.md` (see [TEMPLATE.md](docs/release/TEMPLATE.md)) on the selected branch. If that file does not exist (or is empty, or the tag was already released), validation fails and nothing is deployed.

What the deploy does:

1. Validates the version format and the existence of `docs/release/v<version>.md`
2. Rebuilds `dist/` and fails if the committed `dist/` is out of date with `src/`
3. Creates the `v<version>` tag and a GitHub Release whose body is the release notes file
4. Moves the major version tag (e.g. `v2`) to this release, so `n-devs/ai-code-review@v2` users get the update
