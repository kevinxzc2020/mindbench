(() => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const marker = parts.indexOf('minigames');
  const game = marker >= 0 ? parts[marker + 1] : '';
  let reviveHandler = null;

  const notify = (state) => {
    if (window.parent === window) return;
    window.parent.postMessage({
      source: 'mindbench-mini-game',
      type: 'state',
      game,
      state,
    }, window.location.origin);
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'mindbench-host' || data.type !== 'revive' || data.game !== game) return;
    if (typeof reviveHandler === 'function') reviveHandler();
  });

  window.MindBenchGameBridge = {
    game,
    notify,
    setReviveHandler(handler) {
      reviveHandler = handler;
    },
  };
})();
