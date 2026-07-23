const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const registry = JSON.parse(readFileSync(join(__dirname, 'registry.json'), 'utf8'));

const skills = registry.skills;
const agents = registry.agents;
const entries = [...registry.agents, ...registry.skills];

module.exports = {
  skills,
  agents,
  entries,
  getSkill: (id) => skills.find((s) => s.id === id),
  getAgent: (id) => agents.find((a) => a.id === id),
  getEntry: (id) => entries.find((e) => e.id === id),
  categories: () => [...new Set(skills.map((s) => s.category))].sort(),
  byTier: (tier) => entries.filter((e) => e.tier === tier),
};
