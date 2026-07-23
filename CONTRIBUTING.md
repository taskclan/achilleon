# Contributing to Achilleon

Thank you for considering a contribution. This registry gets better with every prompt tuned by someone who actually uses it.

## Before you open a PR

1. Look at existing entries under `skills/`, `agents/`, or `prompts/`. Copy the shape from a nearby example.
2. Check whether your idea already exists. Duplicates get closed politely; improvements to an existing entry are more welcome than a near-duplicate new one.
3. Run `npm install && npm run build` locally. This validates the schema AND regenerates the `dist/` bundles that end-users install into Cursor / Continue / Claude Code. Commit any changes under `dist/` alongside your YAML change. CI fails if you skip this step (dist/ has to stay in sync with source).

## Adding a new skill

A skill is a single slash command that runs on the `@taskclan` chat participant in VS Code (and, soon, other hosts).

Create a new file in `skills/` named after the command (no leading slash), e.g. `skills/my-command.yml`. Minimum shape:

```yaml
id: my-command
name: /my-command
description: One line describing what the command does. Shown in the picker.
tier: t1-flow
category: Coding
hosts:
  - vscode
system: |
  Write the system prompt here. Multi-line strings work.
  Be tight and opinionated so the reply reads with personality,
  not as generic AI output.
```

Full schema in [`schema/skill.schema.json`](schema/skill.schema.json). Fields:

| Field | Required | Values / notes |
|---|---|---|
| `id` | yes | Lowercase, hyphen-separated. Must match the filename (without `.yml`). |
| `name` | yes | The display name. For skills, the slash-command form, e.g. `/debug`. |
| `description` | yes | One line. Under 140 characters. |
| `tier` | yes | One of `t1-core`, `t1-flow`, `t1-max`, `t1-auto`. |
| `category` | yes | One of `Coding`, `Communication`, `Learning`, `Sharing`, `Other`. |
| `hosts` | yes | Array. Currently only `vscode`. `cli` and `api` are reserved for future. |
| `system` | yes | The system prompt. Tight, opinionated, no generic filler. |
| `author` | no | Your GitHub handle. Defaults to `taskclan`. |
| `version` | no | Semver. Defaults to `1.0.0`. Bump on non-additive changes. |
| `tags` | no | Array of strings for search. |

## Adding a new agent

An agent is a named chat participant with a locked personality (like `@taskclan-reviewer` or `@taskclan-guru`). Users invoke it directly.

Create `agents/my-agent.yml`. Same fields as a skill except:
- `id` should be the invocation handle without the `@`, e.g. `taskclan-something`
- `name` is the display name (e.g. "Taskclan Something")
- No `category` field; agents have their own dimension.

## Prompt-writing conventions

- **Lead with intent.** The first sentence of your `system` field should name what the AI is being asked to do.
- **Be opinionated.** Generic instructions produce generic output. Say what NOT to do as well as what to do.
- **Fix the format.** Say what shape the reply should take (a diff, a bulleted list, three named alternatives, a haiku). Otherwise you get prose.
- **Never write instructions the user can override with prompt injection.** The user prompt gets appended after your system prompt; assume anything the user types could be adversarial and design accordingly.
- **Test on real usage.** Try your skill in the VS Code extension against actual code before opening the PR. A prompt that reads well on paper often flops in practice.

## What we reject

Some entries do not belong here:

- **Prompts that reveal personal information about anyone identifiable.** No prompts about specific real people.
- **Prompts that generate disallowed content** (CSAM, credible violence, malicious code, deceptive impersonation, election disinformation).
- **Prompts designed to jailbreak or bypass Taskclan safety.**
- **Prompts that promise capabilities we cannot deliver.** No "reads your Slack" without the underlying integration.
- **Trivial variations on existing entries.** If there is a five-word difference between your prompt and `skills/debug.yml`, improve `debug.yml` instead.
- **Marketing-copy skills for products other than Taskclan.** This is a technical registry, not an ad channel.

## Review process

Maintainers aim for a first response within 48 hours. Reviews focus on:

1. Does it validate against the schema (CI has already checked).
2. Does the prompt read tight and opinionated, or generic and hedgy.
3. Does it fill a gap or improve on what is there.
4. Does it pass the "would I install this" bar.

Approved PRs merge to `main`. The next Taskclan Intelligence release picks up the new entry automatically.

## Getting help

Open a discussion on the repo, or reach out at `daniel@taskclan.com`.
