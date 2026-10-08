/** Right/Down follow the clockwise loop; Left/Up retrace it. */
export function cycleDirection(key) {
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return 0;
}

export function cyclicDestination(order, originId, key) {
  const direction = cycleDirection(key);
  const index = order.indexOf(originId);
  if (!direction || index < 0 || order.length < 2) return null;
  return order[(index + direction + order.length) % order.length];
}

/** Unwrap a closed route without teleporting an in-flight traveler at the seam. */
export function targetPhase(current, index, count, direction = 0) {
  if (!Number.isFinite(current) || !Number.isInteger(count) || count < 1 || !Number.isInteger(index) || index < 0 || index >= count) return null;
  if (direction > 0) return index + Math.ceil((current - index) / count) * count;
  if (direction < 0) return index + Math.floor((current - index) / count) * count;
  return index + Math.round((current - index) / count) * count;
}
