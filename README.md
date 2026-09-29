# agentic-setup

My Claude Code and pi setup, plus skills shared by both.

- `claude/claude-code-setup-transfer.md`: rebuild the Claude Code setup
- `pi/setup-instruction.md`: rebuild the pi setup
- `skills/<name>/SKILL.md`: skills for both agents, symlinked into `~/.claude/skills` and `~/.agents/skills`
- `pi/extensions/<name>.ts`: pi extensions, symlinked into `~/.pi/agent/extensions`

## Set up a machine

1. Clone this repo where it will stay (the links point into it):
   `git clone git@github.com:VictorVolovik/agentic-setup.git ~/Projects/agentic-setup`
2. Claude Code: do the human steps in `claude/claude-code-setup-transfer.md`, then give the file to `claude`.
3. pi: do the manual TODOs in `pi/setup-instruction.md`, then give the file to `pi`.

## Add a skill

1. Create `skills/<name>/SKILL.md` with `name: <name>` (the folder name) and a `description`.
2. Re-run the link loops: Claude guide §7, pi guide "Shared skills".
3. Run it: `/<name>` in Claude Code, `/skill:<name>` in pi.
