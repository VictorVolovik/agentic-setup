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
        throw new Error(
          response.error ?? "Plannotator workflow is unavailable.",
        );
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
