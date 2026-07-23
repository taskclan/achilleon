# Achilleon

The open registry of **skills**, **agents**, and **prompts** that [Taskclan Intelligence](https://taskclan.com/intelligence) loads.

Anyone can raise a pull request. Every entry lives as a single YAML file with a strict schema. CI validates on push; approved entries ship to Taskclan Intelligence in the next release.

## What is here

Three kinds of entries live in this repo:

| Kind | What it is | Where it runs |
|---|---|---|
| **Skill** | A single slash command with a fixed system prompt and tier binding | Inside `@taskclan` on the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=taskclan.taskclan-intelligence), Cursor / Continue / Claude Code (via `dist/*` bundles), or anywhere else you can paste a prompt |
| **Agent** | A named chat participant with a locked personality (`@taskclan-reviewer`, `@taskclan-guru`, ...) | VS Code chat via the extension; also exportable as Cursor / Continue slash commands |
| **Prompt** | A parameterised template with `{{variables}}` — you fill in values at call time | Any SDK consumer via `render()` from `@taskclan/achilleon`. Ships with helpers for `summarize`, `translate`, `extract`, `classify`, `judge`, `refine`. |

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

## Use these skills in ANY AI editor

Achilleon skills are just system prompts. They work anywhere you can paste a prompt or install a slash command. Every push to `main` auto-generates ready-to-use bundles under `dist/`.

### Cursor

Grab the master rules file and paste the sections you want into your `.cursorrules` (or into Cursor's Settings → Rules).

    curl -O https://raw.githubusercontent.com/taskclan/achilleon/main/dist/cursor/.cursorrules

The file's top comment explains why you should NOT copy the whole thing at once (it dilutes every reply). Pick the sections that match how you actually work.

### Continue.dev

Merge the generated `customCommands` block into your `~/.continue/config.yaml`:

    curl https://raw.githubusercontent.com/taskclan/achilleon/main/dist/continue/config.yaml

Every skill becomes a `/name` command in Continue's chat.

### Claude Code

Drop the pre-built command files into any project's `.claude/commands/` directory:

    mkdir -p .claude/commands
    curl -sSL https://github.com/taskclan/achilleon/archive/main.tar.gz \
      | tar -xz --strip-components=3 -C .claude/commands \
        'achilleon-main/dist/claude-code/commands'

Claude Code auto-registers each file as a slash command. `debug.md` → `/debug`.

### Windsurf

    curl -O https://raw.githubusercontent.com/taskclan/achilleon/main/dist/windsurf/.windsurfrules

Drop it at your project root or paste selected sections into Windsurf's Rules panel. Same annotated-master-file approach as Cursor; pick what you use.

### Cline (VS Code)

    curl -O https://raw.githubusercontent.com/taskclan/achilleon/main/dist/cline/.clinerules

Cline appends this to the system prompt on every task. Pick sections; do not dump everything.

### Zed

Two install options:

    # 1. Workspace-wide rules
    curl -O https://raw.githubusercontent.com/taskclan/achilleon/main/dist/zed/.rules

    # 2. Per-skill slash commands (Zed AI Assistant reads ~/.config/zed/prompts/)
    curl -sSL https://github.com/taskclan/achilleon/archive/main.tar.gz \
      | tar -xz --strip-components=3 -C ~/.config/zed/prompts \
        'achilleon-main/dist/zed/prompts'

### Claude Desktop, ChatGPT, Perplexity, or anywhere else

Skills are also emitted as plain markdown you can paste into any system-prompt / custom-instruction field:

    # Browse the raw prompts
    open https://github.com/taskclan/achilleon/tree/main/dist/raw

    # Or grab one
    curl -O https://raw.githubusercontent.com/taskclan/achilleon/main/dist/raw/debug.md

### npm — for SDK / tooling authors

If you are building your own tool and want the registry as typed data:

    npm install @taskclan/achilleon

```ts
import { skills, agents, prompts, render, getSkill, byTier, categories } from '@taskclan/achilleon';

// Every skill and agent, typed.
for (const s of skills) {
  console.log(s.id, s.tier, s.description);
}

// One entry by id.
const debug = getSkill('debug');
console.log(debug?.system);

// Group by tier.
const heavyReasoners = byTier('t1-max');

// Render a parameterised prompt template.
const filled = render('summarize', {
  text: articleBody,
  length: '5 bullets',
});
// filled is now a full prompt string — hand it to any LLM.
```

CJS also works: `const { skills } = require('@taskclan/achilleon')`.

Raw JSON is also directly importable:

```ts
import registry from '@taskclan/achilleon/registry';
// { skills: AchilleonSkill[], agents: AchilleonAgent[] }
```

### Taskclan Intelligence VS Code extension (first-party)

If you install [`taskclan.taskclan-intelligence`](https://marketplace.visualstudio.com/items?itemName=taskclan.taskclan-intelligence) from the VS Code Marketplace, you get every skill wired as `@taskclan /<name>` with T1 routing baked in. The extension pulls Achilleon at build time so new entries land in the next release automatically.

## How the wiring works

Every entry lives once, in a YAML file. On every push to `main`, CI runs `npm run export` and regenerates every editor-specific bundle under `dist/`. Contributors PR the YAML; the bundles regenerate automatically. See `scripts/export.mjs` for the transformation logic; new export targets are welcome.

## Why open

Prompt engineering is empirical. The best system prompt for `/debug` in Rust is not the same as the best one for Python. The best `/refactor` for a React codebase differs from a Django one. A single team shipping one system prompt for everyone is always wrong somewhere. Achilleon lets the community shape the prompts alongside us, and the schema keeps quality high without needing to gatekeep every improvement.

## License

MIT. See [LICENSE](LICENSE).

## Naming

Achilleon: a temple to Achilles. This is a temple to skills.
