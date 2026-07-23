# Achilleon

The open registry of **skills**, **agents**, and **prompts** that [Taskclan Intelligence](https://taskclan.com/intelligence) loads.

Anyone can raise a pull request. Every entry lives as a single YAML file with a strict schema. CI validates on push; approved entries ship to Taskclan Intelligence in the next release.

## What is here

Three kinds of entries live in this repo:

| Kind | What it is | Where it runs |
|---|---|---|
| **Skill** | A single slash command with a fixed system prompt and tier binding | Inside `@taskclan` on the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=taskclan.taskclan-intelligence) and (eventually) the CLI + web playground |
| **Agent** | A named chat participant with a locked personality (`@taskclan-reviewer`, `@taskclan-guru`, ...) | VS Code chat |
| **Prompt** | A parameterised prompt template loaded by key from the Taskclan SDK | Anywhere the SDK runs |

## Directory shape

```
schema/                    JSON Schema for each entry kind
  skill.schema.json
  agent.schema.json
  prompt.schema.json
skills/                    One YAML per skill
  debug.yml
  review.yml
  ...
agents/                    One YAML per agent
  taskclan-reviewer.yml
  ...
prompts/                   One YAML per prompt template
scripts/                   Local validation + tooling
  validate.mjs
.github/workflows/         CI (schema validation runs on every PR)
```

## Contributing

Full guide in [CONTRIBUTING.md](CONTRIBUTING.md). Quick version:

1. Fork this repo.
2. Add a YAML file under `skills/`, `agents/`, or `prompts/`.
3. Copy the shape from a nearby example. Fields are enforced by JSON Schema; CI tells you what to fix.
4. Run `npm run validate` locally to catch schema errors before pushing.
5. Open a PR. A maintainer reviews for quality and safety.
6. When it merges, your entry ships to every Taskclan Intelligence surface in the next release.

## How Taskclan Intelligence uses this

Taskclan Intelligence pulls Achilleon at build time. The VS Code extension's build step reads the merged YAML, generates a typed TypeScript file, and bakes the result into the extension. Same on the engine side. No runtime dependency on GitHub availability; new entries land whenever we cut a release.

You can also consume Achilleon directly from your own tools by pulling this repo and parsing the YAML with any standard parser plus the schemas in `schema/`.

## Why open

Prompt engineering is empirical. The best system prompt for `/debug` in Rust is not the same as the best one for Python. The best `/refactor` for a React codebase differs from a Django one. A single team shipping one system prompt for everyone is always wrong somewhere. Achilleon lets the community shape the prompts alongside us, and the schema keeps quality high without needing to gatekeep every improvement.

## License

MIT. See [LICENSE](LICENSE).

## Naming

Achilleon: a temple to Achilles. This is a temple to skills.
