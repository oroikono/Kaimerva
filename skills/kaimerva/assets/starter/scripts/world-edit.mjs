import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyWorldPatch, diffWorldConfig, validateWorldConfig } from '../src/world-config.js';

// Operation executor for the coding agent. It does not parse natural-language prompts.
// --root selects a fixture/project containing data/world.json; defaults to this repo.
const usage = 'Usage: node scripts/world-edit.mjs [--root directory] show|apply <patch.json>|undo';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => `${JSON.stringify(value, null, 2)}\n`;

function options(args) {
  let root = fileURLToPath(new URL('../', import.meta.url));
  const positional = [];
  let rootSeen = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--root') {
      if (rootSeen || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error(usage);
      rootSeen = true;
      root = path.resolve(args[++index]);
    } else if (args[index].startsWith('--')) throw new Error(usage);
    else positional.push(args[index]);
  }
  const [command, patch] = positional;
  if (!['show', 'apply', 'undo'].includes(command)
    || positional.length !== (command === 'apply' ? 2 : 1)) throw new Error(usage);
  return { root, command, patch };
}

async function readConfig(file) {
  const bytes = await readFile(file);
  return { config: validateWorldConfig(JSON.parse(bytes)), digest: hash(bytes) };
}

async function atomicWrite(file, value, beforeRename = async () => {}) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, value, { flag: 'wx', mode: 0o600 });
    await beforeRename();
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function readHistory(file) {
  try {
    const history = JSON.parse(await readFile(file, 'utf8'));
    if (history.schemaVersion !== 1 || !Array.isArray(history.edits)) throw new Error('Invalid local world-edit history.');
    for (const edit of history.edits) {
      validateWorldConfig(edit.before);
      validateWorldConfig(edit.after);
      if (typeof edit.beforeHash !== 'string' || typeof edit.afterHash !== 'string') throw new Error('Invalid local world-edit history.');
    }
    return history;
  } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 1, edits: [] };
    throw error;
  }
}

function printChanges(changes, action) {
  console.log(`${action} data/world.json:`);
  for (const change of changes) console.log(`  ${change.path}: ${JSON.stringify(change.before)} -> ${JSON.stringify(change.after)}`);
}

async function run({ root, command, patch }) {
  const configFile = path.join(root, 'data', 'world.json');
  const initial = await readConfig(configFile);
  if (command === 'show') {
    process.stdout.write(encode(initial.config));
    return;
  }

  let partial;
  if (command === 'apply') {
    partial = JSON.parse(await readFile(path.resolve(patch), 'utf8'));
    const proposed = applyWorldPatch(initial.config, partial);
    if (!diffWorldConfig(initial.config, proposed).length) {
      console.log('No changes to data/world.json.');
      return;
    }
  }

  const localDirectory = path.join(root, '.local', 'world-edits');
  const historyFile = path.join(localDirectory, 'history.json');
  const lock = path.join(localDirectory, 'lock');
  // Validation above happens before creating local files. The lock serializes this CLI;
  // a hash recheck also catches external edits before replacement, not every OS race.
  await mkdir(localDirectory, { recursive: true });
  try { await mkdir(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('A world edit is already locked. If a prior process stopped, inspect the config/history before removing .local/world-edits/lock.');
    throw error;
  }
  try {
    const current = await readConfig(configFile);
    if (current.digest !== initial.digest) throw new Error('World configuration changed during this operation; retry after reviewing it.');
    const history = await readHistory(historyFile);
    let next;
    let nextHistory;
    if (command === 'apply') {
      next = applyWorldPatch(current.config, partial);
      nextHistory = {
        schemaVersion: 1,
        edits: [...history.edits, {
          before: current.config,
          after: next,
          beforeHash: current.digest,
          afterHash: hash(encode(next)),
        }],
      };
    } else {
      const previous = history.edits.at(-1);
      if (!previous) throw new Error('No local world edit to undo.');
      if (current.digest !== previous.afterHash) throw new Error('Cannot undo: data/world.json changed independently since the last applied edit. Review it before making another change.');
      next = validateWorldConfig(previous.before);
      nextHistory = { schemaVersion: 1, edits: history.edits.slice(0, -1) };
    }

    const changes = diffWorldConfig(current.config, next);
    const oldHistory = encode(history);
    await atomicWrite(historyFile, encode(nextHistory));
    let committed = false;
    try {
      await atomicWrite(configFile, encode(next), async () => {
        if (hash(await readFile(configFile)) !== current.digest) throw new Error('World configuration changed before writing; no configuration was replaced.');
      });
      committed = true;
    } finally {
      if (!committed) await atomicWrite(historyFile, oldHistory);
    }
    // Config and history are separate files: an interrupted process may require
    // manual review. A stale hash causes undo to refuse rather than overwrite.
    printChanges(changes, command === 'apply' ? 'Applied' : 'Undid');
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

try { await run(options(process.argv.slice(2))); }
catch (error) {
  console.error(`World edit failed: ${error.message}`);
  process.exitCode = 1;
}
