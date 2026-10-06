/** Three distinct procedural worlds. No image or model assets required. */
export const themePresets = Object.freeze([
  {
    id: 'sea',
    name: 'Aegean observatory',
    title: 'An ocean. An instrument.',
    kicker: 'An instrument on open water',
    description: 'Sail a ring of limestone islands. Reveal the invisible patterns between them.',
    accent: '#61d5cf',
  },
  {
    id: 'orbital',
    name: 'Orbital',
    title: 'Follow a distant signal.',
    kicker: 'A station for unfinished ideas',
    description: 'A quiet constellation of laboratories, station platforms, and field notes, connected by a traveling capsule.',
    accent: '#b9b0ff',
  },
  {
    id: 'woodland',
    name: 'Woodland',
    title: 'Ideas take root here.',
    kicker: 'A living archive',
    description: 'Follow a firefly through forest clearings, a glasshouse, a maker’s hut, and a lookout above the canopy.',
    accent: '#bdda90',
  },
]);

export function getTheme(id) {
  return themePresets.find((theme) => theme.id === id) || themePresets[0];
}
