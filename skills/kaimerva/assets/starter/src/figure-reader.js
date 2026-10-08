// Native reading interface for the authored inspection passage. Facts come only
// from validated published records; the scene is accompaniment, not a gate.
export function createFigureReader({ world, motionState, onReadIndex, onMotion, onSelect, sceneState = () => ({ theme: 'sea' }), onTheme = () => {} }) {
  const byId = id => document.getElementById(id);
  const dialog = byId('figure-passage');
  let item = null;
  let stageIndex = 0;
  let invoker = null;
  let returning = false;
  let returnedAction = null;
  let textureReady = false;
  let graphicsUnavailable = false;
  const visited = new Map();
  const stageUrl = stage => new URL(stage.src, document.baseURI).href;
  const instruments = { sea: 'Sea / optical telescope', orbital: 'Space / scanning gantry', woodland: 'Nature / specimen cabinet' };
  const collectionNames = { work: 'projects', research: 'research', journal: 'journal entries', journey: 'journey chapters', news: 'news' };

  function syncTheme() {
    const theme = sceneState().theme;
    byId('passage-instrument-label').textContent = instruments[theme] || instruments.sea;
    for (const button of byId('passage-worlds').querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.inspectionTheme === theme));
      button.disabled = returning;
    }
  }

  function finishReturn() {
    if (!item) return;
    const entryButton = invoker?.dataset.entry ? document.querySelector(`#entries button[data-entry="${invoker.dataset.entry}"]`) : null;
    const landmark = invoker?.dataset.destination ? document.querySelector(`.world-label[data-destination="${invoker.dataset.destination}"]`) : null;
    const target = invoker?.isConnected && invoker.getClientRects().length ? invoker : entryButton || (landmark?.getClientRects().length ? landmark : null) || byId('inspect-figure');
    const action = returnedAction;
    item = null;
    returning = false;
    returnedAction = null;
    invoker = null;
    document.body.dataset.inspection = 'false';
    if (dialog.open) dialog.close();
    if (action) action();
    else target.focus({ preventScroll: true });
  }

  function syncMotion() {
    const { paused, reduced, ready: sceneReady } = motionState();
    const ready = sceneReady && !graphicsUnavailable;
    const button = byId('passage-motion');
    button.hidden = !ready;
    button.disabled = reduced;
    button.textContent = reduced ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
    button.setAttribute('aria-pressed', String(paused || reduced));
    dialog.dataset.motion = paused || reduced ? 'static' : 'moving';
    byId('passage-fallback').hidden = ready && textureReady;
  }

  function renderRecord() {
    byId('passage-title').textContent = item.title;
    byId('passage-origin').textContent = `${item.status === 'example' ? 'Illustrative demo · ' : ''}${item.kind}${item.status && item.status !== 'example' ? ` / ${item.status}` : ''}`;
    byId('passage-summary').textContent = item.summary;
    byId('passage-body').textContent = item.body;
    byId('passage-caption').textContent = item.figure.caption;
    const links = item.links.map(link => {
      const anchor = document.createElement('a');
      anchor.textContent = `${link.label} ↗`;
      anchor.href = link.url;
      anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      return anchor;
    });
    byId('passage-links').replaceChildren(...links);
    byId('passage-index').textContent = `Browse all ${collectionNames[item.collection] || item.collection} ↗`;
    byId('passage-stages').replaceChildren(...item.figure.stages.map((stage, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.stage = String(index);
      button.setAttribute('aria-label', `Inspect view ${index + 1}: ${stage.label}`);
      const number = document.createElement('span');
      number.className = 'passage-view-number';
      number.textContent = String(index + 1).padStart(2, '0');
      button.append(number, document.createTextNode(stage.label));
      button.addEventListener('click', () => selectStage(index));
      return button;
    }));
  }

  function renderStage() {
    const stage = item.figure.stages[stageIndex];
    const seen = visited.get(item.id);
    byId('passage-stage-number').textContent = `${String(stageIndex + 1).padStart(2, '0')} / ${String(item.figure.stages.length).padStart(2, '0')}`;
    byId('passage-stage-label').textContent = stage.label;
    byId('passage-stage-description').textContent = stage.description;
    byId('passage-reader-stage').textContent = `${stage.label}: ${stage.description}`;
    byId('passage-fallback').src = stageUrl(stage);
    byId('passage-fallback').alt = `${item.figure.alt} — ${stage.label}`;
    byId('passage-flat-image').src = stageUrl(stage);
    byId('passage-flat-image').alt = `${item.figure.alt} — ${stage.label}`;
    byId('passage-source').href = stageUrl(stage);
    byId('passage-progress').textContent = seen.size === item.figure.stages.length ? 'Every view explored. Return whenever you like.' : 'Explore the supplied views';
    for (const button of byId('passage-stages').querySelectorAll('button')) {
      const index = Number(button.dataset.stage);
      button.setAttribute('aria-pressed', String(index === stageIndex));
      button.classList.toggle('is-visited', seen.has(item.figure.stages[index].id));
    }
    byId('passage-status').textContent = `View ${stageIndex + 1} of ${item.figure.stages.length}: ${stage.label}.`;
  }

  function selectStage(index, { repaint = true } = {}) {
    if (!item || returning || !Number.isInteger(index) || index < 0 || index >= item.figure.stages.length) return;
    stageIndex = index;
    textureReady = false;
    if (!visited.has(item.id)) visited.set(item.id, new Set());
    visited.get(item.id).add(item.figure.stages[index].id);
    renderStage();
    if (repaint) world.setInspectionStage({ imageUrl: stageUrl(item.figure.stages[index]), stage: index });
  }

  function open(record, source = document.activeElement) {
    if (!record?.published || !record.figure || returning || typeof dialog.showModal !== 'function') return false;
    item = record;
    textureReady = false;
    graphicsUnavailable = !motionState().ready;
    invoker = source;
    returning = false;
    returnedAction = null;
    byId('passage-flat-image').closest('details').open = false;
    renderRecord();
    syncTheme();
    dialog.querySelector('.passage-reader').scrollTop = 0;
    selectStage(0, { repaint: false });
    onSelect(record.collection);
    syncMotion();
    // Preserve the inline camera snapshot before ResizeObserver handles the
    // fullscreen frame; no await is allowed between these two operations.
    document.body.dataset.inspection = 'true';
    world.setInspection({ active: true, imageUrl: stageUrl(record.figure.stages[0]), stage: 0, collection: record.collection });
    if (!dialog.open) dialog.showModal();
    byId('passage-title').focus({ preventScroll: true });
    // Reset after modal layout and focus as well: changing to the phone's
    // stacked layout can otherwise preserve a previous scroll anchor.
    dialog.querySelector('.passage-reader').scrollTop = 0;
    return true;
  }

  function close(afterReturn = null) {
    if (!item) { afterReturn?.(); return; }
    if (afterReturn) returnedAction = afterReturn;
    if (dialog.open) { dialog.close(); return; }
    if (returning) return;
    returning = true;
    syncTheme();
    world.setInspection({ active: false });
    if (!motionState().ready || graphicsUnavailable) finishReturn();
  }

  dialog.addEventListener('close', () => close());
  byId('passage-close').addEventListener('click', () => close());
  byId('passage-index').addEventListener('click', () => {
    const collection = item?.collection;
    close(() => onReadIndex(collection));
  });
  byId('passage-motion').addEventListener('click', () => { onMotion(); syncMotion(); });
  for (const button of byId('passage-worlds').querySelectorAll('button')) {
    button.addEventListener('click', () => {
      if (!item || returning) return;
      onTheme(button.dataset.inspectionTheme);
      syncTheme();
      byId('passage-status').textContent = `${instruments[sceneState().theme]}. Same entry, view ${stageIndex + 1} of ${item.figure.stages.length}.`;
    });
  }
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !item || returning) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName?.toUpperCase()) || event.target.isContentEditable) return;
    const button = event.target.closest('button[data-stage]');
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    if (!button && ['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = button ? Number(button.dataset.stage) : stageIndex;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? item.figure.stages.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + item.figure.stages.length) % item.figure.stages.length;
    selectStage(next);
    byId('passage-stages').querySelector(`[data-stage="${next}"]`).focus({ preventScroll: true });
  });
  for (const id of ['passage-flat-image', 'passage-fallback']) {
    byId(id).addEventListener('error', () => {
      if (item) byId('passage-status').textContent = 'The figure image could not load. The entry and caption are still available; check the figure source.';
    });
  }

  return {
    open, close, syncMotion, syncTheme,
    get active() { return Boolean(item); },
    onSceneState({ phase }) {
      dialog.dataset.phase = phase;
      if (phase === 'unavailable') {
        graphicsUnavailable = true;
        textureReady = false;
        syncMotion();
        byId('passage-status').textContent = '3D is unavailable. The figure and entry remain open in the flat reading view.';
      }
      if (phase === 'closed') finishReturn();
    },
    onSceneImage({ stage, ready, error }) {
      if (!item || returning || stage !== stageIndex) return;
      textureReady = ready;
      syncMotion();
      byId('passage-status').textContent = error
        ? 'The 3D figure could not load. Use the flat figure and readable entry; check the source image.'
        : ready ? `View ${stageIndex + 1} of ${item.figure.stages.length}: ${item.figure.stages[stageIndex].label}.`
          : 'Loading the figure image. The entry is ready to read.';
    },
    refresh(records) {
      if (!item || returning) return;
      const next = records.find(record => record.id === item.id && record.published && record.figure);
      if (!next) { close(); return; }
      if (next.collection !== item.collection) {
        close(() => onReadIndex(next.collection));
        return;
      }
      const previousStage = item.figure.stages[stageIndex].id;
      const stageHadFocus = Boolean(document.activeElement.closest?.('#passage-stages button'));
      item = next;
      const seen = visited.get(item.id) || new Set();
      visited.set(item.id, new Set([...seen].filter(id => item.figure.stages.some(stage => stage.id === id))));
      renderRecord();
      selectStage(Math.max(0, item.figure.stages.findIndex(stage => stage.id === previousStage)));
      if (stageHadFocus) byId('passage-stages').querySelector(`[data-stage="${stageIndex}"]`).focus({ preventScroll: true });
    },
  };
}
