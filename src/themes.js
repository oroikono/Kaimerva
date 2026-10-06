/** Three genuinely different procedural worlds. No image or model assets required. */
export const themePresets = Object.freeze([
  {
    id: 'sea',
    name: 'Archipelago',
    kicker: 'An atlas of open water',
    description: 'Sail between pale stone islands: a workshop, an observatory, a journal, a harbor, and a lighthouse.',
    accent: '#61d5cf',
  },
  {
    id: 'orbital',
    name: 'Orbital',
    kicker: 'A station for unfinished ideas',
    description: 'A quiet constellation of laboratories, station platforms, and field notes, connected by a traveling capsule.',
    accent: '#b9b0ff',
  },
  {
    id: 'woodland',
    name: 'Woodland',
    kicker: 'A living archive',
    description: 'Follow a firefly through forest clearings, a glasshouse, a maker’s hut, and a lookout above the canopy.',
    accent: '#bdda90',
  },
]);

export function getTheme(id) {
  return themePresets.find((theme) => theme.id === id) || themePresets[0];
}
