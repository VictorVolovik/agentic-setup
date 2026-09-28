# Replicate my Pi setup

Tested snapshot: NVM-managed Node `24.15.0`, npm `11.12.1`, Pi `0.87.1`; Fireworks-first model access; `xhigh` thinking; dark theme; install telemetry off; Pi MCP, web access, Plannotator, and Caveman integrations.

> [!CAUTION]
> **Never copy secrets, credentials, caches, or sessions between machines.** Do not copy `~/.pi/agent/auth.json`, `sessions/`, `trust.json`, `models-store.json`, `mcp-*.json`, `~/.pi/agent/web-search-cache/` (legacy `~/.pi/web-search-cache/`), `~/.plannotator/`, browser profiles/cookies, shell history, or `.env*`. Re-authenticate on the new machine. A GitHub **secret gist is unlisted, not access-controlled**: anyone with its URL can read it.

## Manual TODOs

### Before handing off to an agent

- [ ] Install Apple's command-line tools if needed: `xcode-select --install`.
- [ ] Install NVM from its official repository (review the script first):

  ```bash
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh -o /tmp/install-nvm.sh
  less /tmp/install-nvm.sh
  bash /tmp/install-nvm.sh
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  ```

- [ ] Install the tested Node/Pi versions:

  ```bash
  nvm install 24.15.0
  nvm alias default 24.15.0
  nvm use 24.15.0
  npm install -g --ignore-scripts @earendil-works/pi-coding-agent@0.87.1
  ```

- [ ] Create a Fireworks API key in the Fireworks dashboard. **Do not paste it into chat, an agent prompt, a shell command, or this gist.**
- [ ] Authenticate Fireworks first: run `pi`, enter `/login`, choose **Fireworks**, and paste the key only into Pi's hidden login prompt. Pi stores it in mode-`0600` `~/.pi/agent/auth.json`.
- [ ] Run `pi update --models`, then `pi --list-models fireworks`. In Pi, use `/model` to choose the strongest suitable Fireworks coding/tool-use model available at that time. Do not hardcode the old machine's default.
- [ ] Clone this repo where it will stay (e.g. `~/Projects/agentic-setup`); shared skills link into the clone.
- [ ] Give the agent this gist and ask it to complete **Agent TODOs**. Never provide the Fireworks key.

### After the agent finishes

- [ ] Perform one live provider check:

  ```text
  pi
  /reload
  /model
  Use bash to print only "$PI_PROVIDER/$PI_MODEL" and "$PI_REASONING_LEVEL", then reply "Pi setup works". Do not inspect credential files.
  ```

- [ ] Confirm the response uses Fireworks, the selected model, and `xhigh` reasoning. Hold further config edits while doing this live test.
- [ ] Confirm each skill in `skills/` completes as `/skill:<name>` in the editor.
- [ ] Open <https://gist.github.com> while signed into GitHub, create a gist named `pi-setup-private-gist.md`, paste this file, and click **Create secret gist**. Recheck that no key/token/session/cache content appears. GitHub has no truly private gist; a secret gist is only unlisted.

## Agent TODOs

- [ ] Treat this as a fresh-machine setup. Do not read, print, copy, or replace credential/session/cache files. Do not ask for the Fireworks key.
- [ ] Confirm `node`, `npm`, and `pi` resolve through NVM before changing config.

### Pi packages

- [ ] Review each package's source, then install it through Pi (not `npm install -g`):

  ```bash
  pi install npm:pi-mcp-adapter
  pi install npm:pi-web-access
  pi install npm:@plannotator/pi-extension
  ```

  Tested package snapshot: `pi-mcp-adapter` `2.37.0`, `pi-web-access` `0.31.0`, `@plannotator/pi-extension` `0.27.20`. Sources intentionally remain unpinned so `pi update --extensions` can update them.

### Model-neutral global settings

- [ ] Create `~/.pi/agent/settings.json` with this fresh-install config. Do not add `defaultProvider`, `defaultModel`, or `enabledModels`; Fireworks/model selection stays manual and current.

  ```json
  {
    "defaultThinkingLevel": "xhigh",
    "enableInstallTelemetry": false,
    "skills": [
      "~/.agents/skills/caveman",
      "-skills/plannotator/SKILL.md",
      "-skills/plannotator-review/SKILL.md",
      "-skills/plannotator-annotate/SKILL.md",
      "-skills/plannotator-last/SKILL.md"
    ],
    "packages": [
      "npm:pi-mcp-adapter",
      "npm:pi-web-access",
      "npm:@plannotator/pi-extension"
    ],
    "hideThinkingBlock": false,
    "theme": "dark"
  }
  ```

  The four `-skills/…` entries hide the shared copies in `~/.agents/skills` that the Plannotator Pi extension already provides: its bundled `plannotator` skill and its `/plannotator-review`, `/plannotator-annotate`, and `/plannotator-last` commands. Without them Pi reports a `[Skill conflicts]` collision and lists every command twice. `-path` is an exact match against each auto-discovery root, and package resources use their own filter, so the extension's copies stay. The Plannotator installer rewrites the shared files but never this file, so installer reruns need no fixup. The shared extras (`plannotator-compound`, `-setup-goal`, `-visual-explainer`) have no extension equivalent and stay.

### Global workflow rules

- [ ] Create `~/.pi/agent/AGENTS.md` exactly as follows:

  ```markdown
  # Global preferences

  ## Git

  - Never run `git commit` or `git push` unless directly ordered. Statements such as “let's commit” describe the user's next action, not an instruction.
  - Leave changes in the working tree. Staging, stashing, and suggesting a commit message are allowed.

  ## Workflow

  - Answer questions without editing files.
  - Do not edit files until the user approves a plan.
  - Any plan awaiting approval goes through Plannotator planning, whether or not the user said "plan": as soon as a plan is needed, use the `plannotator_workflow` tool with action `plan` before drafting it; never present it only in chat or imitate plan mode in chat. In a git repo, write the plan file to `plans/<type>/<slug>.md` at the repo root (start Pi there: plan mode writes only `.md` files inside the working directory); `/plans/` is in the global git excludes file. Elsewhere, any path the extension accepts. The plan file is the only write allowed before approval.
  - Plan `<type>`: the branch prefix when it is a type below (`chore/<name>` gives `chore`), else pick from the task. Don't ask. `<slug>` is a short kebab-case name of the change. A revised plan keeps its path. Types:
    - `chore` — housekeeping, tech and infrastructure
    - `copy` — copy / text changes
    - `feature` — feature development
    - `fix` — bug fixes
    - `hotfix` — critical hotfix
    - `improvement` — small improvements
    - `refactor` — code refactoring and small adjustments
  - Before calling `plannotator_submit_plan`, present alternatives with trade-offs in chat.
  - At every phase boundary and after executing an approved plan: finish project checks, then use `plannotator_workflow` with action `review` once over the uncommitted diff. Give each finding a verdict and wait for the user to pick which to fix; fix only those, then re-run the checks.
  - Multi-phase work: stop at each phase boundary. After the review, report verification, suggest a commit message, and wait for an explicit “go”.
  - Recheck Git state and HEAD in the turn where a plan is written.
  - Plans touching CI, external APIs, or authentication end with a dedicated "Access key needed or not" section, verdict first.
  - Hold edits while the user performs a live test.
  - Disclose browser automation, screenshots, and visual inspection in plans before using them. Configure browser tools first; prefer browser MCP tools over ad-hoc scripts.

  ## Plannotator

  - Use Plannotator plan mode for every plan awaiting approval, and Plannotator code review at every phase boundary and after plan execution.
  - Use the installed Pi integration/event workflow; do not manually run duplicate `plannotator` CLI sessions.
  - One `review` call per review. If it has not returned, say so and wait; never call it again to retry.
  - Plan feedback requires revision and resubmission until the plan is approved or dismissed; `dismissed` is not approval — do not implement, ask. Code-review feedback gets a verdict per finding; the user picks which to fix.
  - A review closed without approval or feedback is not approval: stop and ask why before reporting or continuing.
  - Approval notes are non-blocking guidance, not a request to revise or reopen reviewed changes unless the user explicitly asks.

  ## Code

  - Do not add fallbacks for impossible states or restate library defaults.
  - Avoid speculative abstractions, routes, and APIs without real callers.
  - Comments should be one line and describe present behavior only.
  - Match existing project idioms. Ask before reorganizing code.
  - Verify library behavior against official documentation or installed sources; cite the source when answering.
  - Measure before and after performance- or build-affecting changes using the same method.

  ## Output

  - Put copyable translations and config values one per line, not in tables.
  - Support “best practice” claims with official sources or concrete implementations.
  - Link local file references in user-facing output using Markdown with an absolute `file://` URL; keep any `:line` suffix outside the link. Example: `[settings.md](file:///home/.../settings.md):218`, not `file:///home/.../settings.md:218`.
  ```

### Global git ignore for plan files

- [ ] Ignore plan files once, globally, in the file named by `core.excludesFile` (git's default when unset: `~/.config/git/ignore`). Same block as `../claude/claude-code-setup-transfer.md` §1; either guide may run it first:

  ```bash
  f=$(git config --global --path core.excludesFile || echo "${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore")
  mkdir -p "$(dirname "$f")"
  grep -qxF '/plans/' "$f" 2>/dev/null || { echo; echo '/plans/'; } >> "$f"
  ```

  The leading `/` anchors `plans/` to each repo root; nested `plans/` directories stay tracked. The bare `echo` ends a last line that lacks a newline; git skips blank lines.

### Plannotator workflow bridge

- [ ] Create `~/.pi/agent/extensions/plannotator-workflow.ts` exactly as follows:

  ```typescript
  import { randomUUID } from "node:crypto";
  import { StringEnum } from "@earendil-works/pi-ai";
  import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
  import { Type } from "typebox";

  const PLANNOTATOR_REQUEST_CHANNEL = "plannotator:request";

  const Params = Type.Object({
    action: StringEnum(["plan", "review"] as const, {
      description:
        "Enter Plannotator plan mode or open code review for the current worktree",
    }),
  });

  type WorkflowResponse =
    | { status: "handled"; result: unknown }
    | { status: "unavailable" | "error"; error?: string };

  export default function (pi: ExtensionAPI) {
    pi.registerTool({
      name: "plannotator_workflow",
      label: "Plannotator Workflow",
      description:
        "Use Plannotator's official Pi integration. Action 'plan' enters restricted planning mode. Action 'review' opens code review for the current worktree and waits for the user's decision.",
      parameters: Params,

      async execute(_toolCallId, params, signal, _onUpdate, ctx) {
        const requiredCommand =
          params.action === "plan"
            ? "plannotator-plan-mode"
            : "plannotator-review";
        const commandNames = new Set(
          pi.getCommands().map((command) => command.name),
        );
        if (!commandNames.has(requiredCommand)) {
          throw new Error(
            "Plannotator Pi integration is not loaded. Run /reload and retry.",
          );
        }

        const response = await new Promise<WorkflowResponse>((resolve) => {
          let settled = false;
          const finish = (value: WorkflowResponse) => {
            if (settled) return;
            settled = true;
            signal?.removeEventListener("abort", onAbort);
            resolve(value);
          };
          const onAbort = () =>
            finish({ status: "error", error: "Plannotator workflow cancelled." });
          signal?.addEventListener("abort", onAbort, { once: true });

          pi.events.emit(PLANNOTATOR_REQUEST_CHANNEL, {
            requestId: randomUUID(),
            action: params.action === "plan" ? "plan-mode" : "code-review",
            payload:
              params.action === "plan" ? { mode: "enter" } : { cwd: ctx.cwd },
            respond: finish,
          });
        });

        if (response.status !== "handled") {
          throw new Error(response.error ?? "Plannotator workflow is unavailable.");
        }

        if (params.action === "plan") {
          const phase =
            (response.result as { phase?: string })?.phase ?? "unknown";
          return {
            content: [
              {
                type: "text",
                text: `Plannotator phase: ${phase}. Continue using the active planning workflow.`,
              },
            ],
            details: { action: params.action, phase },
          };
        }

        const review = response.result as {
          approved?: boolean;
          feedback?: string;
          annotations?: unknown[];
        };
        const text = review.approved
          ? review.feedback
            ? `Code review approved with notes:\n${review.feedback}`
            : "Code review approved."
          : review.feedback
            ? `Code review requested changes:\n${review.feedback}`
            : "Code review closed without approval or feedback.";

        return {
          content: [{ type: "text", text }],
          details: { action: params.action, ...review },
        };
      },
    });
  }
  ```

### Caveman skills

- [ ] Review the repository, pin the clone to the tested release tag `v2.7.0`, and link only the basic skills. Upstream `skills/` also holds Caveman Cloud and workflow skills (`caveman-setup`, `surgical-patch`, …) that this setup leaves out:

  ```bash
  git clone https://github.com/JuliusBrussee/caveman.git "$HOME/.caveman"
  git -C "$HOME/.caveman" checkout v2.7.0
  less "$HOME/.caveman/INSTALL.md"
  mkdir -p "$HOME/.agents/skills"
  for skill in cavecrew caveman caveman-commit caveman-compress caveman-help caveman-review caveman-stats; do
    ln -sfn "$HOME/.caveman/skills/$skill" "$HOME/.agents/skills/$skill"
  done
  ```

  If `~/.caveman` already exists, inspect it, then run `git -C ~/.caveman fetch --tags origin` and `git -C ~/.caveman checkout v2.7.0` instead of cloning. The detached HEAD is intended: `../claude/claude-code-setup-transfer.md` §8 pins the same tag. Pi auto-discovers `~/.agents/skills`; the explicit `caveman` setting mirrors this setup.

### Caveman `/caveman` command and session auto-invoke

- [ ] Create `~/.pi/agent/extensions/caveman-command.ts` exactly as follows. It registers a `/caveman` slash command and auto-activates caveman on every session start. The command accepts an optional level argument (`lite`, `full`, `ultra`, `wenyan-lite`, `wenyan-full`, `wenyan-ultra`, `off`); with no argument it resets to the default (`full`). Auto-on defaults are hardcoded (`AUTO_ON_START = true`, `DEFAULT_LEVEL = "full"`). The extension reads `~/.agents/skills/caveman/SKILL.md` once at load and appends the full skill plus the active level to the system prompt via `before_agent_start` (rebuilt each turn, survives compaction), so no `AGENTS.md` rule is needed to load the skill. `/caveman off`, or typing `stop caveman` or `normal mode` as a whole message, disables it for the current session only; the next session start re-applies the default. The existing `/skill:caveman` skill command remains available; this extension adds the cleaner `/caveman` slash command and the auto-on behavior.

  ```typescript
  import { readFileSync } from "node:fs";
  import { homedir } from "node:os";
  import { join } from "node:path";
  import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
  import type { AutocompleteItem } from "@earendil-works/pi-tui";

  const AUTO_ON_START = true;
  const LEVELS = [
    "lite",
    "full",
    "ultra",
    "wenyan-lite",
    "wenyan-full",
    "wenyan-ultra",
    "off",
  ] as const;

  type Level = (typeof LEVELS)[number];
  type ActiveLevel = Exclude<Level, "off">;

  const DEFAULT_LEVEL: ActiveLevel = "full";
  const SKILL_RULES = readFileSync(
    join(homedir(), ".agents", "skills", "caveman", "SKILL.md"),
    "utf8",
  );

  let level: Level = AUTO_ON_START ? DEFAULT_LEVEL : "off";

  function isLevel(value: string): value is Level {
    return (LEVELS as readonly string[]).includes(value);
  }

  function activationPrompt(activeLevel: ActiveLevel): string {
    return `<skill name="caveman">
  ${SKILL_RULES}
  </skill>

  [caveman active — level: ${activeLevel}] Apply caveman rules at "${activeLevel}" intensity. Active every response until /caveman off, "stop caveman", or "normal mode".`;
  }

  export default function (pi: ExtensionAPI) {
    pi.on("session_start", () => {
      level = AUTO_ON_START ? DEFAULT_LEVEL : "off";
    });

    pi.on("input", async (event, ctx) => {
      const input = event.text.trim().toLowerCase();
      if (input !== "stop caveman" && input !== "normal mode") return;

      level = "off";
      ctx.ui.notify("caveman: off (normal mode)", "info");
    });

    pi.on("before_agent_start", async (event) => {
      if (level === "off") return;

      return {
        systemPrompt: `${event.systemPrompt}\n\n${activationPrompt(level)}`,
      };
    });

    pi.registerCommand("caveman", {
      description:
        "Set compressed-output mode. Usage: /caveman [lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra|off]",
      getArgumentCompletions(prefix: string): AutocompleteItem[] | null {
        const items = LEVELS.map((value) => ({ value, label: value }));
        const filtered = items.filter((item) => item.value.startsWith(prefix));
        return filtered.length > 0 ? filtered : null;
      },
      handler: async (args, ctx) => {
        const arg = args.trim().toLowerCase();
        if (!arg) {
          level = DEFAULT_LEVEL;
          ctx.ui.notify(`caveman: ${level}`, "info");
          return;
        }
        if (!isLevel(arg)) {
          ctx.ui.notify(
            `Unknown level: ${arg}. Valid: ${LEVELS.join(", ")}`,
            "warning",
          );
          return;
        }

        level = arg;
        ctx.ui.notify(
          arg === "off" ? "caveman: off (normal mode)" : `caveman: ${arg}`,
          "info",
        );
      },
    });
  }
  ```

### Shared skills

- [ ] Link each folder in this repo's `skills/` into `~/.agents/skills`. These are the same folders that `../claude/claude-code-setup-transfer.md` §7 links into `~/.claude/skills`. Pi follows symlinked skill directories. The links point into this clone, so set `repo` to where it stays:

  ```bash
  repo=~/Projects/agentic-setup
  mkdir -p "$HOME/.agents/skills"
  for d in "$repo"/skills/*/; do
    ln -sfn "${d%/}" "$HOME/.agents/skills/$(basename "$d")"
  done
  ```

  Pi runs a skill as `/skill:<name>`, e.g. `/skill:tutor Rust programming`. Reruns are safe. A skill deleted from the repo leaves a dangling link, which pi skips; remove it by hand.

### Plannotator CLI and skills

- [ ] Download and review the official installer, then install the current CLI, core skills, and Pi extension. The flags match `../claude/claude-code-setup-transfer.md` §5 on purpose: both setups run this installer and share `~/.plannotator/install-prefs`, so either order ends in the same state. `--model-invocable plannotator-review` is for Claude Code; Pi never loads the shared review skill because the `settings.json` exclusions above hide it. The full installer can also update integrations for other detected agents; inspect its output before accepting that scope.

  ```bash
  curl -fsSL https://plannotator.ai/install.sh -o /tmp/install-plannotator.sh
  less /tmp/install-plannotator.sh
  bash /tmp/install-plannotator.sh --extras --model-invocable plannotator-review --non-interactive
  ```

  The installer runs `pi install npm:@plannotator/pi-extension` itself when `pi` is on `PATH`.

  Tested snapshot: Plannotator CLI `0.27.20`; Pi extension `0.27.20`. Prefer matching current CLI/extension releases unless exact historical behavior is required.

  The installer also writes `plannotator`, `plannotator-review`, `plannotator-annotate`, and `plannotator-last` into `~/.agents/skills` and unlocks `plannotator-review` there. Leave those files alone: the `settings.json` exclusions keep Pi on the extension's own skill and commands.

- [ ] Install the extras unless `~/.agents/skills/plannotator-compound` already exists. `--extras` alone does not install them without a terminal; the installer only prints the command:

  ```bash
  npx -y skills@latest add backnotprop/plannotator/apps/skills/extra --global --agent pi claude-code -y
  ```

- [ ] Run `pi update --models` and `pi update --extensions`, then stop editing while the user performs the live check.

## Verification

- [ ] Run these checks; none prints credentials:

  ```bash
  command -v node npm pi plannotator
  node --version
  npm --version
  pi --version
  plannotator --version

  python3 -m json.tool "$HOME/.pi/agent/settings.json" >/dev/null

  pi list
  pi --list-models fireworks

  test -f "$HOME/.pi/agent/AGENTS.md"
  test -f "$HOME/.pi/agent/extensions/plannotator-workflow.ts"
  test -d "$HOME/.pi/agent/npm/node_modules/pi-mcp-adapter"
  test -d "$HOME/.pi/agent/npm/node_modules/pi-web-access"
  test -d "$HOME/.pi/agent/npm/node_modules/@plannotator/pi-extension"
  grep -qx 'model_invocable=plannotator-review' "$HOME/.plannotator/install-prefs"
  test "$(grep -c '"-skills/plannotator' "$HOME/.pi/agent/settings.json")" -eq 4
  test "$(git -C "$HOME/.caveman" describe --tags)" = v2.7.0
  grep -qxF '/plans/' "$(git config --global --path core.excludesFile || echo "${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore")"
  find -L "$HOME/.agents/skills" -mindepth 2 -maxdepth 2 -name SKILL.md -print | sort
  for d in "$HOME/Projects/agentic-setup/skills"/*/; do test -f "$HOME/.agents/skills/$(basename "$d")/SKILL.md" || echo "missing $(basename "$d")"; done
  ```

- [ ] Run `pi --no-session`, confirm the startup header discovers global `AGENTS.md`, expected skills, package extensions, and `plannotator-workflow`, with no `[Skill conflicts]` block; then quit without inspecting `auth.json`.
- [ ] In a trusted project containing `.mcp.json`, run `/reload` and `/mcp` to confirm MCP server discovery. Do not copy `mcp-cache.json`; let Pi rebuild it.

## Optional tools

### Optional video tooling for `pi-web-access`

- [ ] Install `ffmpeg` for local-video metadata/thumbnails and frame extraction. Install `yt-dlp` only when YouTube frame extraction is needed:

  ```bash
  brew install ffmpeg
  brew install yt-dlp
  ```

  Observed machine had `ffmpeg 8.1` and no `yt-dlp`; ordinary web search/content fetch does not require either.
