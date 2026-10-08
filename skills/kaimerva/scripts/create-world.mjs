#!/usr/bin/env node
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HELP = `Create a Kaimerva world from the packaged starter.

Usage:
  node <skill>/scripts/create-world.mjs <destination> [--theme sea|orbital|woodland]

The default theme is sea. The destination must be new or an empty real directory,
and its parent directory must already exist. This command verifies the starter
manifest, copies the approved files, and selects the theme in data/world.json.
It does not install dependencies, use the network, initialize Git, or deploy.

Options:
  --theme <name>   sea, orbital, or woodland
  --help          Show this help
`;
const THEMES = new Set(['sea', 'orbital', 'woodland']);
const BLOCKED_DIRECTORIES = new Set(['node_modules', 'dist', '.local', '.git']);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const skillDirectory = path.dirname(scriptDirectory);
const starterDirectory = path.join(skillDirectory, 'assets', 'starter');

function parseArguments(args) {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) return { help: true };
  let destination;
  let theme = 'sea';
  let themeGiven = false;
  let literal = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!literal && argument === '--') { literal = true; continue; }
    if (!literal && argument === '--theme') {
      if (themeGiven) throw new Error('Pass --theme only once.');
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error('--theme requires sea, orbital, or woodland.');
      theme = value;
      themeGiven = true;
      continue;
    }
    if (!literal && argument.startsWith('-')) throw new Error(`Unknown option ${JSON.stringify(argument)}. Use --help for usage.`);
    if (destination !== undefined) throw new Error('Pass one destination directory. Use --help for usage.');
    destination = argument;
  }
  if (!destination) throw new Error('A destination directory is required. Use --help for usage.');
  if (!THEMES.has(theme)) throw new Error(`Unknown theme ${JSON.stringify(theme)}. Choose sea, orbital, or woodland.`);
  if (destination.includes('\0')) throw new Error('The destination contains a null character.');
  return { destination, theme };
}

async function lstatIfPresent(filename) {
  try { return await fs.lstat(filename); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function requireRealDirectory(directory, label) {
  const stat = await lstatIfPresent(directory);
  if (!stat) throw new Error(`${label} does not exist: ${JSON.stringify(directory)}.`);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} must be a real directory: ${JSON.stringify(directory)}.`);
  return stat;
}

function isWithin(parent, filename) {
  const relative = path.relative(parent, filename);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

async function resolveDestination(rawDestination) {
  let destination = path.resolve(rawDestination);
  // macOS exposes its OS temporary directory through a system /var alias.
  // Canonicalize that trusted prefix, then still reject user-created symlinks.
  const temporaryDirectories = [os.tmpdir()];
  if (process.platform !== 'win32') temporaryDirectories.push('/tmp');
  for (const temporaryDirectory of temporaryDirectories) {
    if (!isWithin(temporaryDirectory, destination)) continue;
    const realTemporaryDirectory = await fs.realpath(temporaryDirectory);
    destination = path.join(realTemporaryDirectory, path.relative(temporaryDirectory, destination));
    break;
  }
  const parent = path.dirname(destination);
  const root = path.parse(parent).root;
  let ancestor = root;
  for (const segment of parent.slice(root.length).split(path.sep).filter(Boolean)) {
    ancestor = path.join(ancestor, segment);
    await requireRealDirectory(ancestor, 'Destination parent');
  }
  const parentStat = await requireRealDirectory(parent, 'Destination parent');
  const destinationStat = await lstatIfPresent(destination);
  if (destinationStat) {
    if (destinationStat.isSymbolicLink() || !destinationStat.isDirectory()) throw new Error('The destination must be a new or empty real directory.');
    if ((await fs.readdir(destination)).length) throw new Error('The destination is not empty. Choose a new directory; no files were changed.');
  }
  return { destination, parent, parentStat, destinationStat };
}

function validateManifest(value) {
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.files) || !value.files.length) {
    throw new Error('Invalid starter manifest: expected schemaVersion 1 and a nonempty files list.');
  }
  const files = [];
  const paths = new Set();
  const spellings = new Map();
  for (const entry of value.files) {
    if (!entry || typeof entry.path !== 'string' || typeof entry.sha256 !== 'string' || !/^[a-f\d]{64}$/i.test(entry.sha256)) {
      throw new Error('Invalid starter manifest: every file requires a path and a SHA-256 hash.');
    }
    const filename = entry.path;
    const segments = filename.split('/');
    if (!filename || path.posix.isAbsolute(filename) || filename.includes('\\') || /[\x00-\x1f\x7f<>:"|?*]/.test(filename)
      || segments.some(segment => !segment || segment === '.' || segment === '..' || /[. ]$/.test(segment)
        || BLOCKED_DIRECTORIES.has(segment.toLowerCase())) || filename.toLowerCase() === 'manifest.json') {
      throw new Error(`Unsafe starter path: ${JSON.stringify(filename)}.`);
    }
    const canonical = filename.normalize('NFC').toLowerCase();
    if (paths.has(canonical)) throw new Error(`Colliding starter paths: ${JSON.stringify(filename)}.`);
    // Case-insensitive or Unicode-normalizing filesystems must not merge two
    // differently spelled directories while assembling the starter.
    for (let count = 1; count <= segments.length; count += 1) {
      const spelling = segments.slice(0, count).join('/');
      const key = spelling.normalize('NFC').toLowerCase();
      if (spellings.has(key) && spellings.get(key) !== spelling) throw new Error(`Colliding starter paths: ${JSON.stringify(filename)}.`);
      spellings.set(key, spelling);
    }
    paths.add(canonical);
    files.push({ path: filename, sha256: entry.sha256.toLowerCase() });
  }
  for (const filename of paths) {
    let parent = path.posix.dirname(filename);
    while (parent !== '.') {
      if (paths.has(parent)) throw new Error(`Starter file/directory collision: ${JSON.stringify(filename)}.`);
      parent = path.posix.dirname(parent);
    }
  }
  if (!files.some(entry => entry.path === 'data/world.json')) throw new Error('The starter manifest must include data/world.json.');
  return files;
}

async function readStarterFile(relativePath) {
  const segments = relativePath.split('/');
  let filename = starterDirectory;
  for (let index = 0; index < segments.length; index += 1) {
    filename = path.join(filename, segments[index]);
    const stat = await lstatIfPresent(filename);
    if (!stat) throw new Error(`Starter asset is missing: ${JSON.stringify(relativePath)}.`);
    if (stat.isSymbolicLink() || (index === segments.length - 1 ? !stat.isFile() : !stat.isDirectory())) {
      throw new Error(`Starter asset must not contain symlinks or special files: ${JSON.stringify(relativePath)}.`);
    }
  }
  return fs.readFile(filename);
}

async function readManifest() {
  await requireRealDirectory(path.join(skillDirectory, 'assets'), 'Skill assets');
  await requireRealDirectory(starterDirectory, 'Packaged starter');
  const bytes = await readStarterFile('manifest.json');
  try { return validateManifest(JSON.parse(bytes.toString('utf8'))); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error('The starter manifest is not valid JSON.');
    throw error;
  }
}

function configureWorld(bytes, theme) {
  let config;
  try { config = JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error('The packaged data/world.json is not valid JSON.'); }
  if (!config || typeof config !== 'object' || Array.isArray(config)
    || !config.environment || typeof config.environment !== 'object' || Array.isArray(config.environment)
    || !config.interaction || typeof config.interaction !== 'object' || Array.isArray(config.interaction)) {
    throw new Error('The packaged data/world.json requires environment and interaction objects.');
  }
  config.environment.theme = theme;
  config.interaction.startView = theme === 'sea' ? 'voyage' : 'atlas';
  if (theme !== 'sea') config.interaction.fieldEnabled = false;
  return Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
}

function sameDirectory(before, after) {
  return after?.isDirectory() && !after.isSymbolicLink() && before.dev === after.dev && before.ino === after.ino;
}

async function checkDestinationForCommit(target) {
  const parentNow = await lstatIfPresent(target.parent);
  if (!sameDirectory(target.parentStat, parentNow)) throw new Error('The destination parent changed during creation; nothing was copied there.');
  const now = await lstatIfPresent(target.destination);
  if (target.destinationStat) {
    if (!sameDirectory(target.destinationStat, now) || (await fs.readdir(target.destination)).length) {
      throw new Error('The destination changed during creation. Its contents were left untouched.');
    }
  } else if (now) throw new Error('The destination appeared during creation. Its contents were left untouched.');
}

async function commitStage(stage, target) {
  await checkDestinationForCommit(target);
  if (target.destinationStat) await fs.chmod(stage, target.destinationStat.mode & 0o777);
  try { await fs.rename(stage, target.destination); }
  catch (error) {
    // Windows does not rename over an existing empty directory. Remove only
    // that validated empty directory, restoring it if the rename fails.
    if (process.platform !== 'win32' || !target.destinationStat || !['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code)) throw error;
    await checkDestinationForCommit(target);
    await fs.rmdir(target.destination);
    try { await fs.rename(stage, target.destination); }
    catch (renameError) {
      await fs.mkdir(target.destination, { mode: target.destinationStat.mode & 0o777 }).catch(restoreError => {
        if (restoreError.code !== 'EEXIST') throw restoreError;
      });
      throw renameError;
    }
  }
}

async function createWorld(destination, theme) {
  const target = await resolveDestination(destination);
  const files = await readManifest();
  let stage;
  try {
    stage = await fs.mkdtemp(path.join(target.parent, '.kaimerva-stage-'));
    for (const entry of files) {
      const bytes = await readStarterFile(entry.path);
      if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) {
        throw new Error(`Starter asset failed its SHA-256 check: ${JSON.stringify(entry.path)}.`);
      }
      const output = path.join(stage, ...entry.path.split('/'));
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, entry.path === 'data/world.json' ? configureWorld(bytes, theme) : bytes, { flag: 'wx' });
    }
    await commitStage(stage, target);
    stage = null;
    return target.destination;
  } finally {
    if (stage) await fs.rm(stage, { recursive: true, force: true });
  }
}

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(HELP);
  else {
    if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Kaimerva requires Node.js 22 or newer.');
    const destination = await createWorld(options.destination, options.theme);
    process.stdout.write(`Created a Kaimerva world.\nDirectory: ${JSON.stringify(destination)}\nTheme: ${options.theme}\n\nOpen a terminal in that directory, then run:\n  npm ci\n  npm run dev\n\nTo create the static build:\n  npm run build\n`);
  }
} catch (error) {
  process.stderr.write(`Kaimerva: ${error.message}\n`);
  process.exitCode = 1;
}
