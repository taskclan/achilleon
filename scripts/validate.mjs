#!/usr/bin/env node
/**
 * Achilleon local + CI validator.
 *
 * Walks skills/ and agents/, parses each YAML file, validates it against
 * the JSON Schema in schema/, and reports any errors with the exact line
 * (best-effort) so contributors can fix without guessing. Exits 1 if any
 * file fails so CI can gate merges. Also enforces two cross-file rules:
 *
 *   1. Filename ↔ id match. `skills/debug.yml` must have `id: debug`.
 *      Prevents entries getting orphaned when someone renames the file
 *      but not the id (or vice-versa).
 *   2. Ids unique across all files of the same kind. Two skills with
 *      `id: debug` would silently overwrite each other on consumers.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SCHEMAS = {
  skill: JSON.parse(readFileSync(join(ROOT, 'schema/skill.schema.json'), 'utf8')),
  agent: JSON.parse(readFileSync(join(ROOT, 'schema/agent.schema.json'), 'utf8')),
};

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = {
  skill: ajv.compile(SCHEMAS.skill),
  agent: ajv.compile(SCHEMAS.agent),
};

const KINDS = [
  { kind: 'skill', dir: 'skills' },
  { kind: 'agent', dir: 'agents' },
];

let failed = 0;
let passed = 0;

for (const { kind, dir } of KINDS) {
  const dirPath = join(ROOT, dir);
  let files;
  try {
    files = readdirSync(dirPath).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
  } catch {
    // Directory doesn't exist yet (e.g. no agents on day 1). Skip cleanly.
    continue;
  }

  const idsSeen = new Map();

  for (const file of files) {
    const filePath = join(dir, file);
    const filename = basename(file, file.endsWith('.yaml') ? '.yaml' : '.yml');
    let doc;
    try {
      doc = yaml.load(readFileSync(join(dirPath, file), 'utf8'));
    } catch (e) {
      console.error(`✗ ${filePath}: YAML parse error — ${e.message}`);
      failed++;
      continue;
    }
    if (!doc || typeof doc !== 'object') {
      console.error(`✗ ${filePath}: file is empty or not an object`);
      failed++;
      continue;
    }

    // Schema check.
    const valid = validators[kind](doc);
    if (!valid) {
      console.error(`✗ ${filePath}: schema errors`);
      for (const err of validators[kind].errors ?? []) {
        console.error(`    ${err.instancePath || '/'} ${err.message}`);
      }
      failed++;
      continue;
    }

    // Filename must match id.
    if (doc.id !== filename) {
      console.error(`✗ ${filePath}: filename "${filename}" must match id "${doc.id}"`);
      failed++;
      continue;
    }

    // Id must be unique across the kind.
    if (idsSeen.has(doc.id)) {
      console.error(`✗ ${filePath}: duplicate id "${doc.id}" (also in ${idsSeen.get(doc.id)})`);
      failed++;
      continue;
    }
    idsSeen.set(doc.id, filePath);

    passed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed, ${passed} passed.`);
  process.exit(1);
}

console.log(`✓ ${passed} entries validated.`);
