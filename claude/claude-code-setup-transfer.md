# Claude Code — setup transfer

Rebuild this setup on macOS or Linux. Written for a Claude Code agent to execute;
every config block is verbatim.

Source: macOS · Claude Code 2.1.280 · plannotator 0.25.0 · caveman `25d22f8` · captured 2026-09-23

Updated 2026-09-25 on Linux (plannotator 0.27.20); synced the same day on macOS
(Claude Code 2.1.282, caveman `v2.7.0`). An already set-up machine syncs by:

1. Rewriting `~/.claude/CLAUDE.md` from §3 (Workflow: review at every phase boundary,
   user picks which findings to fix, plans go to `plans/<type>/<slug>.md` at the git
   repo root — kept out of git by the global excludes file — and through annotate;
   Plannotator: review never in Bash, annotate user-only, a closed or hidden review is
   not approval).
2. Adding `"plansDirectory": "./plans"` to `~/.claude/settings.json` (§2).
3. Adding `/plans/` to the global git excludes file (§1).
4. Re-running the §5 installer with the new `--model-invocable` value; with pi
   installed, merging the §5 Pi exclusions once.
5. Updating the plannotator plugin to match the binary (§4, plannotator block).
6. Re-pinning the caveman plugin to `v2.7.0` (§4, caveman block), and the standalone
   clone if present (§8).
7. Adding the `tutor` permission rules to `~/.claude/settings.json` (§2).
8. Linking this repo's skills (§7).
9. Running the §9 checks.

## Human steps — the agent can't do these

Before:

1. Install Claude Code: `curl -fsSL https://claude.ai/install.sh | bash`
2. Clone this repo where it will stay (e.g. `~/Projects/agentic-setup`); §7 links its
   skills into the clone.
3. On the **source** machine, pack memory with the source home path, and copy the
   archive to `~` on the target:

   ```bash
   cd ~/.claude && printf '%s\n' "$HOME" > source-home &&
     tar czf ~/claude-memory.tgz source-home projects/*/memory && rm source-home
   ```
4. Launch `claude` on the target and give it:

   ```
   Read <path>/claude-code-setup-transfer.md and do §1–§8 in order. Stop and tell me
   before anything that needs sudo or a browser.
   ```

During: answer `sudo` prompts (system packages).

After:

5. Quit and relaunch `claude` — settings, `CLAUDE.md` and plugins load at session start.
6. First `/plannotator-review` opens a setup dialog in the browser → pick **Uncommitted** (§5).
7. Run the §9 checklist.

## 1. Prerequisites

Required: `curl`, `git`, `jq` (status line is blank without it), `node` ≥ 18 + `npm`
(caveman hooks, plannotator extras via `npx`). Use the system package manager, and drop
`node` / `nodejs npm` from the line when `node -v` already prints 18 or later (e.g. NVM
for pi) — a second Node on `PATH` shadows one of them:

```bash
brew install git jq node                        # macOS
sudo apt install -y curl git jq nodejs npm      # Debian/Ubuntu
sudo dnf install -y git jq nodejs npm           # Fedora
sudo pacman -S --needed git jq nodejs npm       # Arch
```

`node -v` below 18 → install a newer one via nvm or NodeSource.

Optional — the LSP plugins do nothing without their servers:

```bash
npm install -g typescript-language-server typescript   # typescript-lsp; system npm may need `npm config set prefix ~/.local`
go install golang.org/x/tools/gopls@latest             # gopls-lsp; needs Go, ~/go/bin on PATH
```

`~/.local/bin` (claude, plannotator) must be on `PATH`. If missing, append to the
login shell's rc file (`~/.bashrc` or `~/.zshrc`):

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Plan files live in `plans/<type>/` at each git repo root (§3 Workflow, §2
`plansDirectory`). Ignore them once, globally, in the file named by
`core.excludesFile` (git's default when unset: `~/.config/git/ignore`):

```bash
f=$(git config --global --path core.excludesFile || echo "${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore")
mkdir -p "$(dirname "$f")"
grep -qxF '/plans/' "$f" 2>/dev/null || { echo; echo '/plans/'; } >> "$f"
```

The leading `/` anchors `plans/` to each repo root; nested `plans/` directories stay
tracked. The bare `echo` ends a last line that lacks a newline; git skips blank lines.

## 2. `~/.claude/settings.json`

Status line is POSIX `sh` — runs under dash (Debian/Ubuntu `/bin/sh`), bash and zsh.

```bash
cat > ~/.claude/settings.json <<'SETTINGS_EOF'
{
  "statusLine": {
    "type": "command",
    "command": "input=$(cat); u=$(whoami); cwd=$(printf '%s' \"$input\" | jq -r '.cwd'); m=$(printf '%s' \"$input\" | jq -r '.model.display_name'); p=$(printf '%s' \"$input\" | jq -r '.context_window.used_percentage // 0'); b=$(cd \"$cwd\" 2>/dev/null && git -c core.useBuiltinFSMonitor=false rev-parse --abbrev-ref HEAD 2>/dev/null); d=$cwd; case $cwd in \"$HOME\"*) d=\"~${cwd#\"$HOME\"}\";; esac; printf '\\033[38;2;126;156;216m%s\\033[0m in \\033[38;2;230;195;132m%s\\033[0m' \"$u\" \"$d\"; [ -n \"$b\" ] && printf ' on \\033[38;2;118;148;106m%s\\033[0m' \"$b\"; printf '\\n\\033[38;2;149;127;184m%s\\033[0m | \\033[38;2;122;168;159mContext:\\033[0m \\033[38;2;255;160;102m%s%%\\033[0m' \"$m\" \"$p\"; f=\"$HOME/.claude/.caveman-active\"; if [ -f \"$f\" ]; then mode=$(cat \"$f\" 2>/dev/null); if [ -z \"$mode\" ] || [ \"$mode\" = \"full\" ]; then printf ' | \\033[38;5;172m[CAVEMAN]\\033[0m'; else printf ' | \\033[38;5;172m[CAVEMAN:%s]\\033[0m' \"$(echo \"$mode\" | tr '[:lower:]' '[:upper:]')\"; fi; fi"
  },
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": true,
    "caveman@caveman": true,
    "gopls-lsp@claude-plugins-official": true,
    "plannotator@plannotator": true
  },
  "extraKnownMarketplaces": {
    "caveman": {
      "source": {
        "source": "github",
        "repo": "JuliusBrussee/caveman",
        "ref": "v2.7.0"
      }
    },
    "plannotator": {
      "source": {
        "source": "github",
        "repo": "backnotprop/plannotator"
      }
    }
  },
  "outputStyle": "Explanatory",
  "effortLevel": "xhigh",
  "tui": "fullscreen",
  "editorMode": "vim",
  "preferredNotifChannel": "notifications_disabled",
  "autoScrollEnabled": true,
  "agentPushNotifEnabled": true,
  "plansDirectory": "./plans",
  "permissions": {
    "allow": [
      "Read(~/.local/share/tutor/**)",
      "Edit(~/.local/share/tutor/**)"
    ]
  },
  "modelSettings": {
    "claude-opus-5-5": {
      "effortLevel": "xhigh"
    }
  }
}
SETTINGS_EOF
```

The `permissions` rules let the `tutor` skill (§7) keep its progress files outside the
project without a prompt.

## 3. `~/.claude/CLAUDE.md`

````bash
cat > ~/.claude/CLAUDE.md <<'CLAUDEMD_EOF'
# Global preferences

## Git

- Never run `git commit` or `git push`. The user commits everything himself.
- "let's commit X" / "commit phase Y" / "we'll commit" = the user describing THEIR
  next action, not an instruction to me. Only commit on a direct order ("you commit
  it", "run git commit now"). When in doubt, stage and stop.
- Leave changes in the working tree. Staging, stashing, and handing over a suggested
  commit message are welcome.

## Workflow

- Questions get answered, not acted on. No file edits until a plan is approved.
- Outside plan mode, a plan awaiting approval never lives only in chat: write it to
  `plans/<type>/<slug>.md` at the git repo root (outside a repo, the session
  scratchpad) and put it through manual annotate (Plannotator, below). Chat gets the
  path and a short summary. `/plans/` is in the global git excludes file; the plan
  file is the only write allowed before approval.
- Plan `<type>`: the branch prefix when it is a type below (`chore/<name>` gives
  `chore`), else pick from the task. Don't ask. `<slug>` is a short kebab-case name
  of the change. A revised plan keeps its path. Native plan mode writes to the path
  it assigns; use it as given. Types:
  - `chore` — housekeeping, tech and infrastructure
  - `copy` — copy / text changes
  - `feature` — feature development
  - `fix` — bug fixes
  - `hotfix` — critical hotfix
  - `improvement` — small improvements
  - `refactor` — code refactoring and small adjustments
- Multi-phase work: stop at every phase boundary. After the phase's gate, run
  `plannotator-review` once over the uncommitted diff (no args — config default is
  `uncommitted`; if the phase is already committed, `--diff-type last-commit`). Give
  each finding a verdict and wait for the user to pick which to fix; fix only those,
  re-run the gate. Then report the gate, hand over a commit message, wait for an
  explicit "go".
- Don't rush to ExitPlanMode — present alternatives with trade-offs first.
- Re-verify git state/HEAD in the same turn the plan is written; earlier-in-session
  snapshots go stale.
- Plans touching CI, external APIs, or auth end with a dedicated "Access key needed or
  not" section, verdict first.
- Hold all edits while the user is running a live test.

## Plannotator

Two skills, opposite ends of the work. Don't mix them up.

- `plannotator-annotate` — review a **plan document**, before implementation. The skill
  is user-only; the agent reaches it only through ExitPlanMode or manual annotate (below).
- `plannotator-review` — review **code already written**, over the working diff.
  Never point it at a plan; it returns nothing useful and burns a long background
  command. In a plan, it belongs after the edits and after the `type:check` / `lint` /
  `format:check` gate: at every phase boundary and in the final verification.
  After any review: give each finding a verdict, wait for the user to pick which to
  fix, fix only those. This overrides the skill's own "address them" instruction.
  `Review session closed without feedback.` is not approval — the user closed the UI
  without deciding. Stop: don't declare the phase done or hand over a commit message;
  ask why. Explicit approval, with or without notes, counts as approval; do not require
  the literal phrase `no changes requested`. Approval notes are non-blocking guidance,
  not a request to revise or reopen reviewed changes unless the user explicitly asks.
  A verdict that is still in flight, or hidden, is not approval. These rules override
  the skill's "review passed and continue".

**Never run either command manually when something else already runs it.** Two
separate auto-run mechanisms exist; both open a browser session, and a manual Bash
call on top of either opens a redundant second one.

1. **`plannotator-review/SKILL.md` runs itself** via `` !`plannotator review
   $ARGUMENTS` ``. The `!` prefix is load-time substitution, so invoking the skill
   *is* the review. **Never run `plannotator review` in Bash.** Code review goes
   through the skill only, including PR URLs and `--base` / `--diff-type` (skill args
   reach `$ARGUMENTS`). The `plannotator` CLI-reference skill lists `plannotator
   review` as a shell command; this rule overrides it.
   **Every Skill invocation runs the review. One invocation, then stop.**
   **Nothing in the tool result tells you whether it ran — and you never need to
   know.** All of these mean it ran:
   - a `## Code review feedback` block with the verdict inline;
   - no block at all — the browser session routinely exceeds the 120s tool
     timeout, gets backgrounded, and returns later as a task notification;
   - the harness note `this is a NEW invocation — follow those instructions now`;
   - the literal note `already loaded above; instructions unchanged`. **This does
     NOT mean the review failed to start.** The skill body was not re-printed; the
     `!` substitution still executed and the user still sees a browser session.
     The verdict is hidden too: the note appears when the review's output matches
     an earlier run's (seen with repeat approvals). Ask the user for the verdict;
     never infer approval.

   So: **never re-invoke the skill to "retry", and never fall back to Bash.**
   A second invocation is a second browser session the user has to approve —
   exactly the waste this section exists to prevent. Silence means *in flight*.
   Wait.

   If a review genuinely has not come back and you cannot proceed, **say so and
   stop** — do not re-run it and do not claim the flow is broken. The user can
   see their own browser; ask them.
2. **`ExitPlanMode` auto-fires the annotation UI.** The plannotator plugin registers
   `PermissionRequest` → matcher `ExitPlanMode` → bare `plannotator`
   (`~/.claude/plugins/cache/plannotator/plannotator/*/hooks/hooks.json`); bare
   `plannotator` is the documented hook entry point, fed the plan on stdin. So **in
   plan mode, ExitPlanMode is the plan review** — write the plan, then call
   ExitPlanMode and let the hook show it. Never run `plannotator annotate` first.

**Manual `plannotator annotate` is only for plans reviewed outside plan mode** — a
plan file written in a normal turn, or a re-review after edits. Then it needs
`--gate --json`, overriding the skill's own bare example:

```bash
plannotator annotate <path> --gate --json
```

`--gate` adds the Approve button — without it the UI offers Close only, and there is
no way to approve. `--json` returns `{"decision": "approved"|"annotated"|"dismissed"}`,
which is the shape the skill's instructions already assume. Skip
`--require-approval`: it exits 1 on "annotated", conflating feedback with failure.

**Every plan revision gets re-reviewed.** After editing a plan in response to
feedback, put it back in front of the user rather than reporting the changes in chat
and waiting — via ExitPlanMode in plan mode, via annotate outside it. The loop ends
on `approved` or `dismissed`; `dismissed` is not approval — don't implement, ask.

## Code

- No fallbacks for states the codebase cannot produce; no "hardening" that restates
  library defaults. Code the present reality.
- No speculative abstraction; no route or API without a real caller.
- Comments: one line, present behavior only. Never narrate deleted code.
- Match existing codebase idioms over inventing parallel ones. If a "cleaner"
  reorganization tempts you, flag it and get sign-off — never silently improve.
- Verify library behavior against official docs or installed sources, cite
  `file:line`. Don't answer from memory.
- Perf- or build-affecting change: measure the baseline first, re-measure identically
  after, report the delta.

## Output

- Text meant to be copied (translations, config values) → one value per line, never a
  markdown table.
- Don't infer design or layout intent. When a prop or feature is disabled at a
  breakpoint, ask which fixed state is wanted.
- Back "best practice" claims with linked sources or real implementations.
CLAUDEMD_EOF
````

Plannotator section re-checked on 0.27.20: plugin hooks unchanged (`EnterPlanMode` →
`plannotator improve-context`, `ExitPlanMode` → bare `plannotator`), and the review skill
still runs `` !`plannotator review $ARGUMENTS` ``. Recheck on a newer version.
The §5 skill-lock behavior was checked in the installers of both 0.25.0 and 0.27.20.

## 4. Plugins

```bash
claude plugin marketplace add JuliusBrussee/caveman@v2.7.0
claude plugin marketplace add backnotprop/plannotator
claude plugin install typescript-lsp@claude-plugins-official
claude plugin install gopls-lsp@claude-plugins-official
claude plugin install caveman@caveman
claude plugin install plannotator@plannotator
```

`claude-plugins-official` is built in. A marketplace already declared by §2's
`extraKnownMarketplaces` may report as existing — fine.

Caveman is pinned to release tag `v2.7.0`; unpinned, the marketplace follows upstream
`main`. The plugin loads its whole `skills/` folder: 21 skills (the basic `caveman*` /
`cavecrew` set plus Caveman Cloud and workflow skills such as `surgical-patch`,
`lean-build`, and `/caveman-init`), 3 cavecrew agents, and 2 hooks. Plugin skills can't
be hidden one by one (`skillOverrides` skips them), and `claude plugin details caveman`
estimates ~1.8k always-on tokens. The hooks keep per-session state in
`~/.claude/.caveman-sessions/` and mirror the mode to `~/.claude/.caveman-active`, which
the §2 status line reads.

Existing caveman install from an unpinned or older marketplace — a ref changes only
through remove + add, and remove also uninstalls the plugin:

```bash
claude plugin marketplace remove caveman
claude plugin marketplace add JuliusBrussee/caveman@v2.7.0
claude plugin install caveman@caveman   # restart to apply
```

Existing plannotator install, after §5 upgrades the binary (the installer prints the same advice):

```bash
claude plugin marketplace update plannotator
claude plugin update plannotator@plannotator   # restart to apply
```

## 5. Plannotator binary + config

```bash
curl -fsSL https://plannotator.ai/install.sh | bash -s -- --extras --model-invocable plannotator-review
mkdir -p ~/.plannotator
cat > ~/.plannotator/config.json <<'PLANNOTATOR_EOF'
{
  "diffOptions": {
    "defaultDiffType": "uncommitted",
    "diffStyle": "split"
  },
  "reviewAnalysis": {
    "semanticDiff": true,
    "callFlow": false
  }
}
PLANNOTATOR_EOF
```

Installer supports macOS and Linux, x64 and arm64. Flags: extras wanted, and only
`plannotator-review` model-invocable, because `CLAUDE.md` has the agent invoke it. The
installer delivers the `plannotator-*` skills locked (`disable-model-invocation: true`),
unlocks only the names given, and saves the answer to `~/.plannotator/install-prefs` for
later runs. `none` locks the review skill too, and the Skill tool then refuses it.
Exception: the `plannotator` CLI-reference skill (not installed by 0.25.0) ships without
the lock line in both `~/.claude/skills` and `~/.agents/skills`.

`../pi/setup-instruction.md` runs the same installer with the same flags, so on a
machine with both, either order ends in the same `install-prefs`.

`--extras` installs the extra skills only when the installer can prompt. From an agent's
Bash (no TTY) it just saves `extras=yes` and prints the command. Unless
`~/.agents/skills/plannotator-compound` exists, run:

```bash
npx -y skills@latest add backnotprop/plannotator/apps/skills/extra --global --agent claude-code -y
```

**Pi: excluded in its own settings, no fixup.** Every installer run also:

- writes shared skills to `~/.agents/skills/` (`--skip-skills` exists but skips every
  skill scope, Claude's included);
- unlocks `--model-invocable` names there too;
- runs `pi install npm:@plannotator/pi-extension` when `pi` is on `PATH`.

Pi auto-discovers `~/.agents/skills`. The pi-extension bundles its own identical
`plannotator` skill (0.27.20 `package.json` → `pi.skills`; the installer comment claiming
it no longer does is stale) and registers `/plannotator-review`, `/plannotator-annotate`
and `/plannotator-last` as commands. Loaded from `~/.agents/skills` as well, the shared
copies would cause a `[Skill conflicts]` "plannotator" collision, list every command
twice, and let Pi's model start reviews unprompted. `../pi/setup-instruction.md` excludes
those four shared copies in `~/.pi/agent/settings.json`, which the installer never
touches, so installer reruns need nothing. A pi set up before that guide change merges
them once:

```bash
if command -v pi >/dev/null 2>&1; then
  f=~/.pi/agent/settings.json
  jq --indent 2 '(.skills // []) as $skills | .skills = ($skills + (["-skills/plannotator/SKILL.md","-skills/plannotator-review/SKILL.md","-skills/plannotator-annotate/SKILL.md","-skills/plannotator-last/SKILL.md"] - $skills))' "$f" > "$f.tmp" && mv -f "$f.tmp" "$f"
fi
```

Idempotent: entries already present are not added again. `-f` because an interactive
`mv -i` alias (macOS source: `mv='mv -iv'`) reaches the agent's Bash tool and silently
skips the overwrite; a later `-f` overrides `-i` in both BSD and GNU `mv`.

**Review diff default must be `uncommitted`.** Built-in default is `since-base`
(merge-base with main → working tree), so every review re-shows every commit on the
branch and grows with each commit. `uncommitted` = HEAD → working tree only.

**Config file alone does not stick.** First `plannotator review` in a fresh browser
opens a setup dialog preset to *Git status* + *All changes* and writes `since-base`
back into `config.json`. In that dialog pick **Uncommitted** (view snaps to Tree).
Never pick the *Git status* view later — it only renders `since-base` and resets the
default.

## 6. Memory

Needs `~/claude-memory.tgz` from human step 3; skip if absent. Memory dirs are named
after the absolute project path (every non-alphanumeric char → `-`), so re-key them
from the source `$HOME` (recorded in the archive as `source-home`) to this one. Repos
must sit at the same paths relative to `$HOME` (for example `Projects/…`, `Work/…`,
`.config/nvim`).

```bash
tar xzf ~/claude-memory.tgz -C ~/.claude
old=$(sed 's/[^A-Za-z0-9]/-/g' ~/.claude/source-home)-
rm ~/.claude/source-home
new=$(printf '%s' "$HOME" | sed 's/[^A-Za-z0-9]/-/g')-
if [ "$old" != "$new" ]; then
  cd ~/.claude/projects && for d in "$old"*; do
    t=$new${d#"$old"}; mkdir -p "./$t" && mv "./$d/memory" "./$t/" && rmdir "./$d"
  done
fi
```

## 7. Shared skills

`skills/` in this repo holds personal skills shared with pi; `../pi/setup-instruction.md`
links the same folders into `~/.agents/skills`. Claude Code loads a skill from a
symlinked directory in `~/.claude/skills`, so edits in the repo apply without a
reinstall. The links point into this clone: keep it where it is, and set `repo` to it.

```bash
repo=~/Projects/agentic-setup
mkdir -p ~/.claude/skills
for d in "$repo"/skills/*/; do
  ln -sfn "${d%/}" ~/.claude/skills/"$(basename "$d")"
done
```

Reruns are safe and pick up new skills. A skill deleted from the repo leaves a dangling
link; remove it by hand.

## 8. Optional

Caveman standalone — only backs `~/.agents/skills/caveman*` for non-Claude agents (pi);
Claude Code uses the plugin's `caveman:*` skills. Same tag and basic-skill links as
`../pi/setup-instruction.md`. `install.sh` is skipped: at `v2.7.0` it forwards to the
unified `bin/install.js` installer, which does far more than link skills.

```bash
git clone https://github.com/JuliusBrussee/caveman.git ~/.caveman   # existing clone: git -C ~/.caveman fetch --tags origin
git -C ~/.caveman checkout v2.7.0
mkdir -p ~/.agents/skills
for skill in cavecrew caveman caveman-commit caveman-compress caveman-help caveman-review caveman-stats; do
  ln -sfn ~/.caveman/skills/$skill ~/.agents/skills/$skill
done
```

## 9. Verify

Agent:

```bash
command -v claude jq node plannotator
claude plugin list                                              # 4 plugins, caveman Version: 2.7.0
jq -r .diffOptions.defaultDiffType ~/.plannotator/config.json   # uncommitted
grep model_invocable ~/.plannotator/install-prefs               # model_invocable=plannotator-review
grep -c '^disable-model-invocation' ~/.claude/skills/plannotator-review/SKILL.md   # 0
# pi installed only:
grep -c '"-skills/plannotator' ~/.pi/agent/settings.json        # 4
git -C ~/.caveman describe --tags                               # v2.7.0 (if §8 ran)
ls ~/.claude/projects/*/memory                                  # if §6 ran
grep -xF '/plans/' "$(git config --global --path core.excludesFile || echo "${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore")"   # /plans/
for d in ~/Projects/agentic-setup/skills/*/; do test -f ~/.claude/skills/"$(basename "$d")"/SKILL.md || echo "missing $(basename "$d")"; done   # no output
```

Human, after relaunch:

- [ ] status line: `user in ~/path on branch` / `<model> | Context: N%`
- [ ] `/caveman` → `[CAVEMAN]` badge in status line
- [ ] plan mode → `ExitPlanMode` opens plannotator UI
- [ ] `/plannotator-review` on a branch with commits + a local edit → shows only the edit;
      then re-run the `jq` check above
- [ ] pi installed: `pi` starts without a `[Skill conflicts]` block
- [ ] each skill in `skills/` appears in the `/` menu (e.g. `/tutor`)

Blank status line → `jq` not on the `PATH` Claude Code inherits.

## Not transferred

Regenerated or machine-local: `~/.claude.json` (auth — never copy),
`~/.claude/{history.jsonl,sessions,plugins,file-history,backups,…}`,
`~/.claude/keybindings.json` (all defaults), `~/.claude/skills/` (plannotator installer,
claude.ai sync and §7 recreate it).
