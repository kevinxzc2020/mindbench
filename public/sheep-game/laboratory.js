(() => {
  function fit() {
    const scale = Math.min(window.innerWidth / 400, window.innerHeight / 720);
    const root = document.documentElement;
    root.style.setProperty('--game-scale', String(scale));
    root.style.setProperty('--game-left', `${(window.innerWidth - 400 * scale) / 2}px`);
    root.style.setProperty('--game-top', `${(window.innerHeight - 720 * scale) / 2}px`);
  }
  fit();
  window.addEventListener('resize', fit);
})();

window.mindbenchSheepResult = () => new Promise((resolve) => {
  const lang = new URLSearchParams(location.search).get('lang') || 'en';
  const copy = { en: ['Tray full', 'Try a different order to clear matching tiles.', 'Try again'], zh: ['槽位已满', '换个顺序，再试着凑齐三个相同图案。', '重新挑战'], es: ['Bandeja llena', 'Prueba otro orden para combinar las fichas.', 'Intentar de nuevo'] }[lang] || ['Tray full', '', 'Try again'];
  const dialog = document.createElement('dialog');
  dialog.className = 'sheep-result';
  const title = document.createElement('h2'); title.textContent = copy[0];
  const note = document.createElement('p'); note.textContent = copy[1];
  const retry = document.createElement('button'); retry.textContent = copy[2];
  dialog.append(title, note, retry); document.body.append(dialog);
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  retry.addEventListener('click', () => { dialog.close(); dialog.remove(); resolve(); }, { once: true });
  dialog.showModal(); retry.focus();
});
