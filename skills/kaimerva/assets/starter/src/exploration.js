// Optional charting around authored, reachable approach points. Reading and
// selected content are deliberately absent: the host supplies traveler samples.
const EPSILON = 1e-12;

function number(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be finite.`);
  return value;
}

function ids(value) {
  if (!Array.isArray(value) || value.length > 256 || value.some(id => typeof id !== 'string'
    || !id.length || id !== id.trim() || id.length > 160) || new Set(value).size !== value.length) {
    throw new TypeError('Exploration order must contain up to 256 unique, nonempty destination IDs.');
  }
  return value.slice();
}

/** This is session state, not persistence, anti-cheat or a free movement engine. */
export function createExploration({ order = [], radius = 0.28, distanceRadius = 1.4 } = {}) {
  const destinations = ids(order);
  number(radius, 'Phase proximity radius'); number(distanceRadius, 'World proximity radius');
  if (radius < 0 || radius >= 0.5) throw new RangeError('Phase proximity radius must be at least zero and below 0.5.');
  if (distanceRadius < 0) throw new RangeError('World proximity radius must be nonnegative.');
  const known = new Set(destinations);
  const initial = () => ({ phase: null, moving: false, distances: null, discovered: [] });
  let state = initial();

  function distances(value) {
    if (value === undefined || value === null) return null;
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
      || Object.keys(value).length !== destinations.length
      || Object.keys(value).some(id => !known.has(id))) {
      throw new TypeError('World distances must provide one finite nonnegative distance for every destination.');
    }
    return Object.fromEntries(destinations.map(id => {
      if (!Object.hasOwn(value, id)) throw new TypeError(`World distance is missing: ${id}.`);
      const distance = number(value[id], `World distance for ${id}`);
      if (distance < 0) throw new RangeError(`World distance for ${id} must be nonnegative.`);
      return [id, distance === 0 ? 0 : distance];
    }));
  }

  function proximity(sample) {
    const metric = sample.distances === null ? 'phase' : 'world';
    if (sample.phase === null || !destinations.length) return { metric, nearId: null, distance: null };
    let id; let distance;
    if (sample.distances !== null) {
      distance = Infinity;
      for (const destination of destinations) if (sample.distances[destination] < distance) {
        id = destination; distance = sample.distances[destination];
      }
    } else {
      const period = destinations.length;
      const wrapped = ((sample.phase % period) + period) % period;
      const index = Math.round(wrapped) % period;
      distance = Math.abs(wrapped - index);
      distance = Math.min(distance, period - distance);
      id = destinations[index];
    }
    const range = metric === 'world' ? distanceRadius : radius;
    return { metric, nearId: distance <= range + EPSILON ? id : null, distance };
  }

  function snapshot() {
    const count = state.discovered.length;
    return {
      schemaVersion: 1, order: destinations.slice(), radius, distanceRadius,
      phase: state.phase, moving: state.moving, ...proximity(state),
      distances: state.distances === null ? null : { ...state.distances },
      discovered: state.discovered.slice(), count, total: destinations.length,
      complete: destinations.length > 0 && count === destinations.length,
      // Each first chart event advances this revision. Sampling, reading and
      // repeat interactions do not manufacture additional discovery events.
      revision: count,
    };
  }

  return {
    update(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Exploration update requires a traveler sample.');
      const phase = number(input.phase, 'Traveler phase');
      const moving = input.moving === undefined ? false : input.moving;
      if (typeof moving !== 'boolean') throw new TypeError('Traveler moving must be a boolean.');
      const sample = { phase, moving, distances: distances(input.distances), discovered: state.discovered };
      // Validation above completes before live state changes. Omitted physical
      // distances switch to phase proximity; they cannot leave stale measures.
      state = sample;
      return snapshot();
    },
    interact() {
      const current = snapshot();
      const id = current.nearId;
      const newDiscovery = id !== null && !state.discovered.includes(id);
      if (newDiscovery) state = { ...state, discovered: [...state.discovered, id] };
      return { id, newDiscovery, complete: snapshot().complete };
    },
    snapshot,
    restore(saved) {
      if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.schemaVersion !== 1
        || saved.radius !== radius || saved.distanceRadius !== distanceRadius
        || !Array.isArray(saved.order) || saved.order.length !== destinations.length
        || saved.order.some((id, index) => id !== destinations[index])) {
        throw new TypeError('Exploration snapshot does not match this route and proximity configuration.');
      }
      const phase = saved.phase === null ? null : number(saved.phase, 'Saved traveler phase');
      if (typeof saved.moving !== 'boolean' || (phase === null && (saved.moving || saved.distances !== null))) {
        throw new TypeError('Exploration snapshot contains an invalid traveler sample.');
      }
      const sample = { phase, moving: saved.moving, distances: distances(saved.distances), discovered: ids(saved.discovered) };
      if (sample.discovered.some(id => !known.has(id))) throw new TypeError('Exploration snapshot contains an unknown charted destination.');
      const expected = proximity(sample); const count = sample.discovered.length;
      if (saved.metric !== expected.metric || saved.nearId !== expected.nearId || saved.distance !== expected.distance
        || saved.count !== count || saved.revision !== count || saved.total !== destinations.length
        || saved.complete !== (destinations.length > 0 && count === destinations.length)) {
        throw new TypeError('Exploration snapshot contains inconsistent proximity or chart progress.');
      }
      state = sample;
      return snapshot();
    },
    reset() { state = initial(); return snapshot(); },
  };
}
