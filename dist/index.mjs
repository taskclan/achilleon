import { readFileSync } from 'node:fs';
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

function _render(id, values, prompts) {
  const p = prompts.find((x) => x.id === id);
  if (!p) throw new Error('achilleon: prompt "' + id + '" not found');
  const provided = values || {};
  const used = new Set();
  const output = p.template.replace(/\{\{\s*([a-z][a-z_0-9]{0,39})\s*\}\}/g, (_, name) => {
    used.add(name);
    if (provided[name] !== undefined && provided[name] !== null) return String(provided[name]);
    const varDef = (p.variables || []).find((v) => v.name === name);
    if (varDef && varDef.default !== undefined) return varDef.default;
    if (varDef && varDef.required === false) return '';
    throw new Error('achilleon: prompt "' + id + '" missing required variable "' + name + '"');
  });
  return output;
}

/** Render a prompt template with values. Missing required vars throw. */
export function render(id, values) {
  return _render(id, values, prompts);
}
