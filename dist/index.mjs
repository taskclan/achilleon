import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/** @type {{ skills: any[], agents: any[] }} */
const registry = JSON.parse(readFileSync(join(HERE, 'registry.json'), 'utf8'));

export const skills = registry.skills;
export const agents = registry.agents;
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

/** All skill categories, sorted, unique. */
export function categories() {
  return [...new Set(skills.map((s) => s.category))].sort();
}

/** Everything at the given tier. */
export function byTier(tier) {
  return entries.filter((e) => e.tier === tier);
}
