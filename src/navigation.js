const directions = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};

/** Choose a visible neighbor in screen space. An edge stays an edge; no wrapping. */
export function directionalDestination(points, originId, key) {
  const axis = directions[key];
  const usable = points.filter(point => point.visible !== false && Number.isFinite(point.x) && Number.isFinite(point.y));
  const origin = usable.find(point => point.id === originId);
  if (!axis || !origin) return null;
  let best = null;
  let bestScore = Infinity;
  for (const point of usable) {
    if (point.id === originId) continue;
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const forward = dx * axis[0] + dy * axis[1];
    if (forward <= 1) continue;
    const sideways = Math.abs(dx * axis[1] - dy * axis[0]);
    const score = Math.hypot(dx, dy) * (1 + 2 * (sideways / forward) ** 2);
    if (score < bestScore || (score === bestScore && point.id < best.id)) {
      best = point;
      bestScore = score;
    }
  }
  return best?.id || null;
}
