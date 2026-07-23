/**
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
