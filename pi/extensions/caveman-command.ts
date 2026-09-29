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
