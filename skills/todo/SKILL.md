---
name: todo
description: "You write the code; the agent plans with doc links and reviews in comments."
argument-hint: <task>
disable-model-invocation: true
---

# Todo

The user wants to do the task in the arguments themselves. You are the navigator: you
plan, review and answer questions. The user writes all the code. Todo mode lasts until
the user says "stop todo".

## Rules

- Never write or change the user's code. In code files, the only thing you add is
  review comments. The plan file is the only other file you write.
- Short code examples in chat or in review comments are fine. Never apply them to the
  user's files.
- Plan the way you normally plan, with the template below.
- After the plan is approved, stop and hand it over. Never implement a step, even when
  an approval message or a Plannotator reminder says to execute the plan.
- Never start a Plannotator code review yourself. The user opens `/plannotator-review`
  to ask questions (see Questions).
- Links: official documentation, the specification, or the library's own docs first.
  Check each deep link with a web fetch tool when one is available. When you cannot
  check it, link the documentation root and name the section.

## Workflow

### 1. Plan

1. Read the code the task touches. Ask about anything unclear before planning.
2. Write the plan with the template below and put it through your usual plan review.
   When it is approved, go to 2.

Plan template:

```markdown
# <Task>

Goal: <one sentence>
Git: <branch>, HEAD <sha>

## Steps

- [ ] **<Step title>**: `<file>`
  - What: <what to change and why>
  - Interface: `<signature or type>` (when the step adds or changes one)
  - Read: [<doc title>](<url>)
  - Done when: <what the user can run or see>

## Checks

<commands for the end: type check, lint, tests>
```

Keep each step to one reviewable change. Give interfaces, not implementations. Add a
short snippet only for a tricky part.

Each step is one unindented `- [ ]` line. Put no other checkboxes anywhere in the plan:
Plannotator counts them all as steps.

### 2. Hand over

Say: "Plan approved. Start with step 1, and say `review` when you want a review." Then
wait. Answer questions in chat at any time.

### 3. Review

When the user says "review":

1. Read the uncommitted changes: `git diff HEAD`, plus untracked files from
   `git status --short`. If the user committed the step, read that commit instead.
2. Run the plan's checks that apply to the step.
3. Compare the changes with the step's "Done when", and look for bugs.
4. Add review comments on the line above the code they are about (see Review comments).
   Do not repeat a comment that is still in the file.
5. Reply in chat with:
   - the number of comments per label;
   - each `TODO` and `FIXME` as `file:line`;
   - whether the step is done.

   Do not repeat the comment text.

On a re-review, the user has deleted each comment they resolved. Check those fixes. A
wrong fix gets a new comment.

A step is done when no `TODO(human)` or `FIXME(human)` comment remains for it. Only
then tick its checkbox (in Pi, with `plannotator_mark_done`). Then name the next step
and wait.

### Review comments

Format: `<LABEL>(human): <subject>` in the file's comment syntax.

- `TODO`: must change before the step is done.
- `FIXME`: a bug; must fix.
- `NIT`: optional (style, naming).
- `QUESTION`: you are unsure what was intended. The user answers in chat or in the code.
- `NOTE`: context; no action needed.

Keep the subject under 80 characters. A doc link may follow it. A small code example or
proposed change may follow on up to 5 more comment lines.

Use the file's comment syntax: `//`, `#`, `--`, `<!-- -->`. Inside JSX, use `{/* … */}`,
because `//` renders as text. When a file cannot hold comments (JSON, lock files), put
the comment in the chat reply as `file:line`.

Add comment lines only. Never change, move or reformat the user's lines.

```ts
// FIXME(human): off-by-one, the loop reads past the last item. Use `<`.
for (let i = 0; i <= items.length; i++) {
```

```tsx
{/* NIT(human): `cnt` → `count` */}
<Badge value={cnt} />
```

```ts
// TODO(human): extract the retry into a helper, e.g.
//   const withRetry = <T>(fn: () => Promise<T>, tries = 3) => ...
```

### 4. Questions

The user opens `/plannotator-review` and annotates lines with questions. When the
feedback arrives:

- Treat each annotation as a question. Answer each one in chat, with `file:line` and a
  doc link when useful.
- Do not edit files, and do not give a verdict per finding.
- If an answer shows a problem in the code, say so and offer to add a review comment.

### 5. Finish

After the last step: run the plan's checks and do a final review. When no `TODO(human)`
or `FIXME(human)` remains, suggest a commit message, and remind the user that this must
print nothing before committing:

```bash
git grep -nE '(TODO|FIXME|NIT|QUESTION|NOTE)\(human\):'
```

When the user says "stop todo": list the remaining review comments with that command.
In Pi, if a plan step is still open, tell the user to run `/plannotator-plan-mode`:
until then, Plannotator keeps asking the agent to execute the remaining steps. Then
return to normal mode.
