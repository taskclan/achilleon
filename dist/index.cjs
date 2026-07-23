const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const registry = JSON.parse(readFileSync(join(__dirname, 'registry.json'), 'utf8'));

const skills = registry.skills;
const agents = registry.agents;
const prompts = registry.prompts;
const entries = [...registry.agents, ...registry.skills];

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
