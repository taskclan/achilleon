#!/usr/bin/env node
/**
 * Achilleon exporter — transforms the YAML registry into editor-specific
 * formats so the same skills work in every AI editor, not just Taskclan
 * Intelligence. Runs in CI on every push to main, commits results to
 * `dist/` so contributors and end-users can `curl` the ready-to-use file
 * without cloning + building.
 *
 * Targets:
 *   cursor       → dist/cursor/.cursorrules       (one master file, all skills as sections)
 *   continue     → dist/continue/config.yaml      (Continue.dev customCommands entries)
 *   claude-code  → dist/claude-code/commands/     (one .md file per skill, per CC's convention)
 *   raw          → dist/raw/{id}.md               (skill as plain markdown, paste anywhere)
 *
 * Run: node scripts/export.mjs               (all targets)
 *      node scripts/export.mjs cursor        (single target)
 *
 * Skills and agents export separately where the target distinguishes them
 * (Continue.dev has no "sub-participant" concept, so agents are exported
 * as customCommands prefixed with `agent-`).
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const TARGETS = new Set(['cursor', 'continue', 'claude-code', 'raw', 'windsurf', 'cline', 'zed', 'npm']);

// ── Load registry ───────────────────────────────────────────────────────────

function loadDir(sub) {
  const dir = join(ROOT, sub);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort()
    .map((f) => yaml.load(readFileSync(join(dir, f), 'utf8')));
}

const skills = loadDir('skills');
const agents = loadDir('agents');
const prompts = loadDir('prompts');

if (!skills.length && !agents.length && !prompts.length) {
  console.error('[export] no skills, agents, or prompts found — aborting');
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function wipeAndMake(p) {
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  ensureDir(p);
}

function tierNote(entry) {
  const map = { 't1-core': 'T1 Core (fast)', 't1-flow': 'T1 Flow (balanced)', 't1-max': 'T1 Max (deep)', 't1-auto': 'T1 Auto (router picks)' };
  return map[entry.tier] ?? entry.tier;
}

// ── Target: Cursor (.cursorrules) ──────────────────────────────────────────
// Cursor reads .cursorrules as a single master system-prompt-per-project.
// We emit one big file with a top-of-file how-to and each skill/agent as a
// clearly demarcated section the user can copy the relevant part of. This
// intentionally does NOT dump ALL prompts into one super-prompt (that would
// dilute every reply); the top of the file tells users to pick sections
// they actually want and delete the rest.

function exportCursor() {
  const target = join(DIST, 'cursor');
  wipeAndMake(target);
  const header = `# Taskclan Achilleon — Cursor rules pack
#
# This file was generated from github.com/taskclan/achilleon.
# Pick the sections you actually want and DELETE THE REST — copying the
# entire file into .cursorrules will dilute every reply. Each section is
# self-contained: the header names the skill, the body is the system
# prompt you paste under a Cursor Rule.
#
# Rules format for Cursor: paste the body into a Cursor Rule
# (Settings → Rules → Add Rule) or into .cursorrules at the repo root.
# Rules apply on every AI request in that context; scope carefully.

`;

  let body = '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# SKILLS\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const s of skills) {
    body += `# ─── ${s.name} — ${s.description} (${tierNote(s)}) ───\n`;
    body += `# Source: github.com/taskclan/achilleon/blob/main/skills/${s.id}.yml\n`;
    body += s.system.trim() + '\n\n';
  }

  body += '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# AGENTS (locked-personality participants)\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const a of agents) {
    body += `# ─── @${a.id} — ${a.description} (${tierNote(a)}) ───\n`;
    body += `# Source: github.com/taskclan/achilleon/blob/main/agents/${a.id}.yml\n`;
    body += a.system.trim() + '\n\n';
  }

  writeFileSync(join(target, '.cursorrules'), header + body);
  console.log(`[export:cursor] wrote dist/cursor/.cursorrules (${skills.length} skills + ${agents.length} agents)`);
}

// ── Target: Continue.dev (config.yaml customCommands fragment) ─────────────
// Continue.dev config supports `customCommands`; each entry has name +
// description + prompt. We emit a config.yaml fragment users can paste into
// their ~/.continue/config.yaml under the customCommands key.

function exportContinue() {
  const target = join(DIST, 'continue');
  wipeAndMake(target);

  const header = `# Taskclan Achilleon — Continue.dev slash commands
#
# Generated from github.com/taskclan/achilleon.
# Paste the customCommands block below into your ~/.continue/config.yaml
# under the customCommands key (merge with any existing commands you have).
# Each command becomes /<name> in Continue.dev's chat.
#
# Sub-participants (agents) become /<id>-agent so they don't collide with
# normal slash commands; Continue.dev has no first-class sub-participant
# concept today, so this is the cleanest translation.

customCommands:
`;

  const escape = (s) => yaml.dump(s.trim(), { lineWidth: -1, indent: 4 }).trimEnd();

  let body = '';
  for (const s of skills) {
    body += `  - name: ${s.id}\n`;
    body += `    description: '${s.description.replace(/'/g, "''")}'\n`;
    body += `    prompt: |\n`;
    body += s.system.trim().split('\n').map((l) => '      ' + l).join('\n') + '\n';
  }
  for (const a of agents) {
    body += `  - name: ${a.id.replace(/^taskclan-/, '')}-agent\n`;
    body += `    description: '${a.description.replace(/'/g, "''")}'\n`;
    body += `    prompt: |\n`;
    body += a.system.trim().split('\n').map((l) => '      ' + l).join('\n') + '\n';
  }

  writeFileSync(join(target, 'config.yaml'), header + body);
  console.log(`[export:continue] wrote dist/continue/config.yaml (${skills.length} skills + ${agents.length} agents)`);
}

// ── Target: Claude Code (.claude/commands/*.md) ────────────────────────────
// Claude Code reads .claude/commands/<name>.md. First-line frontmatter is
// optional; body is the prompt. Users drop these files into a project's
// .claude/commands/ directory and Claude Code auto-registers them as
// slash commands available in that project.

function exportClaudeCode() {
  const target = join(DIST, 'claude-code', 'commands');
  wipeAndMake(target);

  for (const s of skills) {
    const md = `---
description: ${s.description}
---

${s.system.trim()}
`;
    writeFileSync(join(target, `${s.id}.md`), md);
  }
  // Agents in Claude Code become slash commands too; Claude Code doesn't
  // have @-mention sub-participants. Prefix with agent- to disambiguate.
  for (const a of agents) {
    const bareId = a.id.replace(/^taskclan-/, '');
    const md = `---
description: ${a.description}
---

${a.system.trim()}
`;
    writeFileSync(join(target, `${bareId}.md`), md);
  }

  // README so users know what to do with these files.
  const readme = `# Taskclan Achilleon — Claude Code commands

Drop the \`.md\` files in this directory into your project's \`.claude/commands/\` directory.

    mkdir -p .claude/commands
    cp *.md .claude/commands/

Claude Code auto-registers each file as a slash command. \`debug.md\` becomes \`/debug\`.

The \`agent-\` prefix on some commands (\`hacker\`, \`architect\`, etc.) marks them as
locked-personality agents rather than one-shot skills. In Claude Code they work
identically to skills — the distinction only matters in editors with a
sub-participant concept.

Source: github.com/taskclan/achilleon
`;
  writeFileSync(join(DIST, 'claude-code', 'README.md'), readme);
  console.log(`[export:claude-code] wrote dist/claude-code/commands/ (${skills.length + agents.length} files)`);
}

// ── Target: raw markdown (paste anywhere) ──────────────────────────────────
// For ChatGPT, Claude web, Perplexity, whatever. Just one markdown per skill
// with the system prompt as the body. Users copy the body into whatever
// system prompt / custom instruction field their tool exposes.

function exportRaw() {
  const target = join(DIST, 'raw');
  wipeAndMake(target);
  for (const s of skills) {
    const md = `# ${s.name} — ${s.description}

Runs on ${tierNote(s)}. Category: ${s.category}. Source: github.com/taskclan/achilleon/blob/main/skills/${s.id}.yml

---

${s.system.trim()}
`;
    writeFileSync(join(target, `${s.id}.md`), md);
  }
  for (const a of agents) {
    const md = `# @${a.id} — ${a.description}

Runs on ${tierNote(a)}. Sub-participant (locked personality). Source: github.com/taskclan/achilleon/blob/main/agents/${a.id}.yml

---

${a.system.trim()}
`;
    writeFileSync(join(target, `${a.id}.md`), md);
  }
  // Prompts live under raw/prompts/ so they don't collide with skill/agent
  // ids of the same name (a "summarize" prompt and a "summarize" skill can
  // coexist). Each doc shows the template + the variables it takes.
  const promptsDir = join(target, 'prompts');
  ensureDir(promptsDir);
  for (const p of prompts) {
    const varsBlock = (p.variables ?? []).map((v) => {
      const req = v.required === false ? ' (optional)' : '';
      const def = v.default !== undefined ? ` — default: \`${v.default}\`` : '';
      return `- **{{${v.name}}}**${req}: ${v.description}${def}`;
    }).join('\n');
    const md = `# ${p.name} — ${p.description}

Prompt template. Recommended tier: ${p.tier ? tierNote(p) : 't1-flow'}.
Source: github.com/taskclan/achilleon/blob/main/prompts/${p.id}.yml

## Variables

${varsBlock || '_This prompt takes no variables._'}

## Template

\`\`\`
${p.template.trim()}
\`\`\`
`;
    writeFileSync(join(promptsDir, `${p.id}.md`), md);
  }
  console.log(`[export:raw] wrote dist/raw/ (${skills.length + agents.length} files + ${prompts.length} prompts)`);
}

// ── Target: Windsurf (.windsurfrules) ─────────────────────────────────────
// Windsurf reads .windsurfrules at the project root (same idea as Cursor's
// .cursorrules). Format is plain prompt text — same annotated master-file
// approach so users pick sections rather than dumping everything.

function exportWindsurf() {
  const target = join(DIST, 'windsurf');
  wipeAndMake(target);
  const header = `# Taskclan Achilleon — Windsurf rules pack
#
# This file was generated from github.com/taskclan/achilleon.
# Drop it at your project root as .windsurfrules (or paste selected
# sections into Windsurf's Rules panel). Windsurf applies these on
# every AI request in the workspace.
#
# Pick sections that match how you actually work; copying everything
# will dilute every reply. Each section is self-contained.

`;

  let body = '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# SKILLS\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const s of skills) {
    body += `# ─── ${s.name} — ${s.description} (${tierNote(s)}) ───\n`;
    body += `# Source: github.com/taskclan/achilleon/blob/main/skills/${s.id}.yml\n`;
    body += s.system.trim() + '\n\n';
  }

  body += '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# AGENTS\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const a of agents) {
    body += `# ─── @${a.id} — ${a.description} (${tierNote(a)}) ───\n`;
    body += `# Source: github.com/taskclan/achilleon/blob/main/agents/${a.id}.yml\n`;
    body += a.system.trim() + '\n\n';
  }

  writeFileSync(join(target, '.windsurfrules'), header + body);
  console.log(`[export:windsurf] wrote dist/windsurf/.windsurfrules (${skills.length} skills + ${agents.length} agents)`);
}

// ── Target: Cline (.clinerules) ────────────────────────────────────────────
// Cline (VS Code agent, formerly Claude Dev) reads .clinerules at the
// workspace root as a system-prompt append. Same annotated master-file
// pattern; users pick sections.

function exportCline() {
  const target = join(DIST, 'cline');
  wipeAndMake(target);
  const header = `# Taskclan Achilleon — Cline rules pack
#
# Generated from github.com/taskclan/achilleon.
# Drop this file at your workspace root as .clinerules. Cline appends
# it to the system prompt on every task. Pick the sections you actually
# use and delete the rest — dumping the whole file dilutes every reply.

`;

  let body = '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# SKILLS\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const s of skills) {
    body += `# ─── ${s.name} — ${s.description} (${tierNote(s)}) ───\n`;
    body += s.system.trim() + '\n\n';
  }

  body += '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# AGENTS\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const a of agents) {
    body += `# ─── @${a.id} — ${a.description} (${tierNote(a)}) ───\n`;
    body += a.system.trim() + '\n\n';
  }

  writeFileSync(join(target, '.clinerules'), header + body);
  console.log(`[export:cline] wrote dist/cline/.clinerules (${skills.length} skills + ${agents.length} agents)`);
}

// ── Target: Zed (.rules per-workspace) ────────────────────────────────────
// Zed's AI Assistant reads .rules or .zed/rules at the workspace root.
// Same annotated master-file pattern. Zed also supports individual /commands
// via slash-command files under ~/.config/zed/prompts/, so we ALSO emit
// per-skill prompt files as a bonus that users can drop into that dir.

function exportZed() {
  const target = join(DIST, 'zed');
  wipeAndMake(target);

  // ── Master rules file ─────────
  const header = `# Taskclan Achilleon — Zed rules pack
#
# Generated from github.com/taskclan/achilleon.
# Two install options for Zed:
#
# 1. Workspace-wide (all skills as one system prompt):
#    Drop this file at your workspace root as .rules (or .zed/rules).
#    Pick sections you actually want; dumping everything dilutes replies.
#
# 2. Per-skill slash commands:
#    Copy the individual files from prompts/ into ~/.config/zed/prompts/.
#    Each becomes a /skillname slash command in the Zed AI Assistant.

`;

  let body = '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# SKILLS\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const s of skills) {
    body += `# ─── ${s.name} — ${s.description} (${tierNote(s)}) ───\n`;
    body += s.system.trim() + '\n\n';
  }
  body += '# ═════════════════════════════════════════════════════════════════════\n';
  body += '# AGENTS\n';
  body += '# ═════════════════════════════════════════════════════════════════════\n\n';
  for (const a of agents) {
    body += `# ─── @${a.id} — ${a.description} (${tierNote(a)}) ───\n`;
    body += a.system.trim() + '\n\n';
  }
  writeFileSync(join(target, '.rules'), header + body);

  // ── Per-skill prompt files ─────────
  const promptsDir = join(target, 'prompts');
  ensureDir(promptsDir);
  for (const s of skills) {
    writeFileSync(join(promptsDir, `${s.id}.md`), s.system.trim() + '\n');
  }
  for (const a of agents) {
    writeFileSync(join(promptsDir, `${a.id.replace(/^taskclan-/, '')}.md`), a.system.trim() + '\n');
  }

  console.log(`[export:zed] wrote dist/zed/.rules + ${skills.length + agents.length} prompt files`);
}

// ── Target: npm package artifacts ─────────────────────────────────────────
// Emits the JS/TS entrypoints and merged JSON that `@taskclan/achilleon`
// ships to npm. package.json's `exports` field points here. Consumers do:
//
//   // ESM
//   import { skills, agents, entries, getSkill, getAgent } from '@taskclan/achilleon';
//   // CJS
//   const { skills, agents } = require('@taskclan/achilleon');
//   // Raw data
//   import registry from '@taskclan/achilleon/registry';
//
// All entries flow through the SAME YAML source used everywhere else,
// so an SDK consumer sees the same content a Cursor user would install.

function exportNpm() {
  const skillsWithKind = skills.map((s) => ({ kind: 'skill', ...s }));
  const agentsWithKind = agents.map((a) => ({ kind: 'agent', ...a }));
  const promptsWithKind = prompts.map((p) => ({ kind: 'prompt', ...p }));
  const registry = { skills: skillsWithKind, agents: agentsWithKind, prompts: promptsWithKind };

  writeFileSync(join(DIST, 'registry.json'), JSON.stringify(registry, null, 2));
  writeFileSync(join(DIST, 'skills.json'), JSON.stringify(skillsWithKind, null, 2));
  writeFileSync(join(DIST, 'agents.json'), JSON.stringify(agentsWithKind, null, 2));
  writeFileSync(join(DIST, 'prompts.json'), JSON.stringify(promptsWithKind, null, 2));

  // Shared render logic — inlined into both CJS + ESM so we do not need a
  // separate helper module. Mustache-style {{var}} with a single-pass
  // string.replace using a regex that respects the same character class
  // the schema validator accepts. Missing required vars throw; missing
  // optional vars substitute the empty string.
  const renderHelper = `function _render(id, values, prompts) {
  const p = prompts.find((x) => x.id === id);
  if (!p) throw new Error('achilleon: prompt "' + id + '" not found');
  const provided = values || {};
  const used = new Set();
  const output = p.template.replace(/\\{\\{\\s*([a-z][a-z_0-9]{0,39})\\s*\\}\\}/g, (_, name) => {
    used.add(name);
    if (provided[name] !== undefined && provided[name] !== null) return String(provided[name]);
    const varDef = (p.variables || []).find((v) => v.name === name);
    if (varDef && varDef.default !== undefined) return varDef.default;
    if (varDef && varDef.required === false) return '';
    throw new Error('achilleon: prompt "' + id + '" missing required variable "' + name + '"');
  });
  return output;
}`;

  // ESM entrypoint — imports the JSON alongside via node:fs so we avoid
  // import-attribute compatibility issues across Node versions.
  const esm = `import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/** @type {{ skills: any[], agents: any[], prompts: any[] }} */
const registry = JSON.parse(readFileSync(join(HERE, 'registry.json'), 'utf8'));

export const skills = registry.skills;
export const agents = registry.agents;
export const prompts = registry.prompts;
export const entries = [...registry.agents, ...registry.skills];

export function getSkill(id) {
  return skills.find((s) => s.id === id);
}

export function getAgent(id) {
  return agents.find((a) => a.id === id);
}

export function getEntry(id) {
  return entries.find((e) => e.id === id);
}

export function getPrompt(id) {
  return prompts.find((p) => p.id === id);
}

/** All skill categories, sorted, unique. */
export function categories() {
  return [...new Set(skills.map((s) => s.category))].sort();
}

/** Everything at the given tier. */
export function byTier(tier) {
  return entries.filter((e) => e.tier === tier);
}

${renderHelper}

/** Render a prompt template with values. Missing required vars throw. */
export function render(id, values) {
  return _render(id, values, prompts);
}
`;
  writeFileSync(join(DIST, 'index.mjs'), esm);

  // CJS entrypoint — same shape.
  const cjs = `const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const registry = JSON.parse(readFileSync(join(__dirname, 'registry.json'), 'utf8'));

const skills = registry.skills;
const agents = registry.agents;
const prompts = registry.prompts;
const entries = [...registry.agents, ...registry.skills];

${renderHelper}

module.exports = {
  skills,
  agents,
  prompts,
  entries,
  getSkill: (id) => skills.find((s) => s.id === id),
  getAgent: (id) => agents.find((a) => a.id === id),
  getEntry: (id) => entries.find((e) => e.id === id),
  getPrompt: (id) => prompts.find((p) => p.id === id),
  categories: () => [...new Set(skills.map((s) => s.category))].sort(),
  byTier: (tier) => entries.filter((e) => e.tier === tier),
  render: (id, values) => _render(id, values, prompts),
};
`;
  writeFileSync(join(DIST, 'index.cjs'), cjs);

  // Hand-written type declarations. Kept in sync with schema/*.schema.json
  // by hand for now; a JSON-Schema-to-TS pass is a future upgrade.
  const dts = `/**
 * @taskclan/achilleon — typed access to the open skill registry.
 * Every entry in this package originates as a YAML file in
 * github.com/taskclan/achilleon and is validated against
 * schema/{skill,agent}.schema.json before publishing.
 */

export type SkillTier = 't1-core' | 't1-flow' | 't1-max' | 't1-auto';

export type SkillCategory = 'Coding' | 'Communication' | 'Learning' | 'Sharing' | 'Other';

export type Host = 'vscode' | 'cli' | 'api';

export interface AchilleonSkill {
  kind: 'skill';
  id: string;
  name: string;
  description: string;
  tier: SkillTier;
  category: SkillCategory;
  hosts: Host[];
  system: string;
  author?: string;
  version?: string;
  tags?: string[];
  examples?: string[];
}

export type AgentCapability =
  | 'tool_use'
  | 'vision'
  | 'extended_thinking'
  | 'video'
  | 'audio'
  | 'documents';

export interface AchilleonAgent {
  kind: 'agent';
  id: string;
  name: string;
  description: string;
  tier: SkillTier;
  hosts: Host[];
  system: string;
  capabilities?: AgentCapability[];
  author?: string;
  version?: string;
  tags?: string[];
}

export type AchilleonEntry = AchilleonSkill | AchilleonAgent;

export interface AchilleonPromptVariable {
  name: string;
  description: string;
  required?: boolean;
  default?: string;
}

export interface AchilleonPrompt {
  kind: 'prompt';
  id: string;
  name: string;
  description: string;
  template: string;
  variables?: AchilleonPromptVariable[];
  tier?: SkillTier;
  author?: string;
  version?: string;
  tags?: string[];
}

export const skills: AchilleonSkill[];
export const agents: AchilleonAgent[];
export const prompts: AchilleonPrompt[];
/** Agents first, then skills, in the order they were loaded. */
export const entries: AchilleonEntry[];

export function getSkill(id: string): AchilleonSkill | undefined;
export function getAgent(id: string): AchilleonAgent | undefined;
export function getEntry(id: string): AchilleonEntry | undefined;
export function getPrompt(id: string): AchilleonPrompt | undefined;
export function categories(): SkillCategory[];
export function byTier(tier: SkillTier): AchilleonEntry[];

/**
 * Render a prompt template with values. Missing required variables throw;
 * missing optional variables substitute the empty string.
 *
 *   import { render } from '@taskclan/achilleon';
 *   const filled = render('summarize', { text: articleBody, length: '5 bullets' });
 */
export function render(id: string, values: Record<string, string | number | boolean>): string;
`;
  writeFileSync(join(DIST, 'index.d.ts'), dts);

  console.log(`[export:npm] wrote dist/index.{cjs,mjs,d.ts} + dist/{registry,skills,agents}.json (${skills.length} skills + ${agents.length} agents)`);
}

// ── Main ───────────────────────────────────────────────────────────────────

const requested = process.argv.slice(2).filter((a) => TARGETS.has(a));
const runAll = requested.length === 0;

if (runAll || requested.includes('cursor')) exportCursor();
if (runAll || requested.includes('continue')) exportContinue();
if (runAll || requested.includes('claude-code')) exportClaudeCode();
if (runAll || requested.includes('windsurf')) exportWindsurf();
if (runAll || requested.includes('cline')) exportCline();
if (runAll || requested.includes('zed')) exportZed();
if (runAll || requested.includes('raw')) exportRaw();
if (runAll || requested.includes('npm')) exportNpm();

console.log(`[export] done. Output in ${DIST}/`);
