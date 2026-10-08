// Small, typed design controls for the shipped starter, not an arbitrary scene API.
const fields = {
  environment: {
    theme: { values: ['sea', 'orbital', 'woodland'] },
    exposure: { min: 0.5, max: 1.6 },
    keyLightMultiplier: { min: 0.2, max: 1.6 },
  },
  interface: {
    reader: { values: ['inline', 'dialog'] },
    panel: { values: ['solid', 'glass'] },
    buttonShape: { values: ['square', 'pill'] },
  },
  interaction: {
    startView: { values: ['atlas', 'voyage'] },
    fieldEnabled: { boolean: true },
    fieldSpacing: { min: 0, max: 1 },
  },
};

export const DEFAULT_WORLD_CONFIG = Object.freeze({
  schemaVersion: 1,
  environment: Object.freeze({ theme: 'sea', exposure: 1, keyLightMultiplier: 1 }),
  interface: Object.freeze({ reader: 'inline', panel: 'solid', buttonShape: 'square' }),
  interaction: Object.freeze({ startView: 'atlas', fieldEnabled: false, fieldSpacing: 0.45 }),
});

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function objectAt(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${path} must be an object.`);
  }
}

function keysAt(value, allowed, path, partial) {
  objectAt(value, path);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown world config key: ${path}.${key}`);
  }
  if (!partial) {
    for (const key of allowed) if (!own(value, key)) throw new TypeError(`Missing world config key: ${path}.${key}`);
  }
}

function fieldAt(value, rule, path) {
  if (rule.values && !rule.values.includes(value)) {
    throw new TypeError(`${path} must be one of: ${rule.values.join(', ')}.`);
  }
  if (rule.boolean && typeof value !== 'boolean') throw new TypeError(`${path} must be a boolean.`);
  if (own(rule, 'min') && (typeof value !== 'number' || !Number.isFinite(value) || value < rule.min || value > rule.max)) {
    throw new TypeError(`${path} must be a finite number from ${rule.min} to ${rule.max}.`);
  }
}

function checkShape(input, partial) {
  keysAt(input, ['schemaVersion', ...Object.keys(fields)], 'world', partial);
  if (own(input, 'schemaVersion') && input.schemaVersion !== 1) throw new TypeError('world.schemaVersion must be 1.');
  for (const [section, rules] of Object.entries(fields)) {
    if (!own(input, section)) continue;
    keysAt(input[section], Object.keys(rules), `world.${section}`, partial);
    for (const [key, rule] of Object.entries(rules)) {
      if (own(input[section], key)) fieldAt(input[section][key], rule, `world.${section}.${key}`);
    }
  }
}

export function validateWorldConfig(input) {
  checkShape(input, false);
  if (input.environment.theme !== 'sea') {
    if (input.interaction.fieldEnabled) throw new TypeError('The interference field is available only in the sea theme.');
    if (input.interaction.startView === 'voyage') throw new TypeError('Voyage view is available only in the sea theme.');
  }
  return {
    schemaVersion: 1,
    environment: { ...input.environment },
    interface: { ...input.interface },
    interaction: { ...input.interaction },
  };
}

export function applyWorldPatch(base, partial) {
  const current = validateWorldConfig(base);
  checkShape(partial, true);
  return validateWorldConfig({
    schemaVersion: 1,
    environment: { ...current.environment, ...partial.environment },
    interface: { ...current.interface, ...partial.interface },
    interaction: { ...current.interaction, ...partial.interaction },
  });
}

export function diffWorldConfig(before, after) {
  const first = validateWorldConfig(before);
  const second = validateWorldConfig(after);
  const changes = [];
  for (const [section, rules] of Object.entries(fields)) {
    for (const key of Object.keys(rules)) {
      if (first[section][key] !== second[section][key]) {
        changes.push({ path: `${section}.${key}`, before: first[section][key], after: second[section][key] });
      }
    }
  }
  return changes;
}
