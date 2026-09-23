(() => {
  const supported = new Set(["en", "es", "zh"]);
  const requested = new URLSearchParams(window.location.search).get("lang");
  const lang = supported.has(requested) ? requested : "en";

  const copy = {
    en: {
      screwTitle: "Screw Sort · Day 1", remaining: "Remaining", buffer: "Buffer", boxes: "Boxes", pool: "Pool", bufferTitle: "Buffer (5 = fail)", win: "🎉 Level complete!", lose: "💀 Game over", replayLevel: "Tap to restart (new level)",
      fruitRemaining: "Remaining", channel: "Channel", fruitWin: "You win!", fruitLose: "Game over!", fruitReplay: "Tap anywhere to play again",
      arrowRemaining: "Remaining", arrowWin: "🎉 Level complete!", arrowLose: "💔 Game over", elapsed: "Time", timeUp: "Time's up", failures: "Mistakes", arrowReplay: "Play again",
      beadsTitle: "Pixel Beads", steps: "Moves", beadsWin: "🎉 Completed!", beadsTime: "Time", beadsMoves: "Moves", beadsReplay: "Play again", beadsTimeout: "⏰ Time's up!", progress: "Progress", restart: "Restart",
    },
    es: {
      screwTitle: "Ordena los tornillos · Día 1", remaining: "Restantes", buffer: "Reserva", boxes: "Cajas", pool: "Reserva", bufferTitle: "Reserva (5 = derrota)", win: "🎉 ¡Nivel completado!", lose: "💀 Fin de la partida", replayLevel: "Toca para reiniciar (nuevo nivel)",
      fruitRemaining: "Restantes", channel: "Canal", fruitWin: "¡Victoria!", fruitLose: "¡Fin de la partida!", fruitReplay: "Toca para jugar otra vez",
      arrowRemaining: "Restantes", arrowWin: "🎉 ¡Nivel completado!", arrowLose: "💔 Fin de la partida", elapsed: "Tiempo", timeUp: "Tiempo agotado", failures: "Fallos", arrowReplay: "Jugar otra vez",
      beadsTitle: "Cuentas pixel", steps: "Movimientos", beadsWin: "🎉 ¡Completado!", beadsTime: "Tiempo", beadsMoves: "Movimientos", beadsReplay: "Jugar otra vez", beadsTimeout: "⏰ ¡Tiempo agotado!", progress: "Progreso", restart: "Reiniciar",
    },
    zh: {
      screwTitle: "打个螺丝 · Day 1", remaining: "剩余", buffer: "备选", boxes: "箱", pool: "池", bufferTitle: "备选区（满 5 即失败）", win: "🎉 通关！", lose: "💀 失败", replayLevel: "点击屏幕重开（新关卡）",
      fruitRemaining: "剩余", channel: "通道", fruitWin: "胜利！", fruitLose: "失败！", fruitReplay: "点击任意处再玩一局",
      arrowRemaining: "剩余", arrowWin: "🎉 恭喜通关！", arrowLose: "💔 游戏结束", elapsed: "用时", timeUp: "时间耗尽", failures: "失败次数", arrowReplay: "再来一局",
      beadsTitle: "快乐拼拼豆", steps: "步数", beadsWin: "🎉 恭喜完成!", beadsTime: "用时", beadsMoves: "步数", beadsReplay: "再来一局", beadsTimeout: "⏰ 时间到!", progress: "完成进度", restart: "重新开始",
    },
  };

  const messages = {
    en: { "已匹配的豆无法移动": "Matched beads cannot be moved", "暂存槽已满": "Holding tray is full", "请先选中豆": "Select beads first", "颜色不匹配": "Colors do not match", "没有可放置的位置": "No matching space available" },
    es: { "已匹配的豆无法移动": "Las cuentas combinadas no se pueden mover", "暂存槽已满": "La bandeja está llena", "请先选中豆": "Selecciona primero unas cuentas", "颜色不匹配": "Los colores no coinciden", "没有可放置的位置": "No hay un espacio compatible" },
    zh: {},
  };

  const pageTitles = {
    en: { screw: "Screw Sort | MindBench", fruit: "Fruit Funnel | MindBench", arrow: "Arrow Run | MindBench", beads: "Pixel Beads | MindBench" },
    es: { screw: "Ordena los tornillos | MindBench", fruit: "Frutas al embudo | MindBench", arrow: "Flechas en ruta | MindBench", beads: "Cuentas pixel | MindBench" },
    zh: { screw: "打个螺丝 | MindBench", fruit: "消个水果 | MindBench", arrow: "一箭又一箭 | MindBench", beads: "快乐拼拼豆 | MindBench" },
  };

  const game = window.location.pathname.split("/").filter(Boolean).at(-2) || "";
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  if (pageTitles[lang]?.[game]) document.title = pageTitles[lang][game];

  window.MindBenchGameLanguage = {
    lang,
    text(key, fallback = key) { return copy[lang]?.[key] ?? copy.en[key] ?? fallback; },
    translateMessage(value) { return messages[lang]?.[value] ?? value; },
  };
})();
