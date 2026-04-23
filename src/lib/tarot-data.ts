import type { Lang } from "./translations";

// Major Arcana (22 张) — 每张带正逆位的简短解读。
// 保持在 1-2 句简短释义，避免过度预测化。

export interface TarotCard {
  id: number; // 0..21
  emoji: string;
  name: Record<Lang, string>;
  keywords: Record<Lang, string>;
  upright: Record<Lang, string>;
  reversed: Record<Lang, string>;
}

export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0,
    emoji: "🃏",
    name: { en: "The Fool", es: "El Loco", zh: "愚者" },
    keywords: {
      en: "Beginnings · innocence · leap of faith",
      es: "Comienzos · inocencia · salto de fe",
      zh: "新开始 · 纯真 · 踏出一步",
    },
    upright: {
      en: "A new journey begins. Embrace the unknown with an open heart — this is the moment to take the leap.",
      es: "Un nuevo viaje comienza. Acepta lo desconocido con el corazón abierto — es el momento del salto.",
      zh: "新的旅程正在开始。以开放的心迎接未知 — 这是踏出那一步的时刻。",
    },
    reversed: {
      en: "You're hesitating at the edge. Recklessness or paralysis — neither will serve you. Pause, then step wisely.",
      es: "Dudas al borde. Imprudencia o parálisis — ninguna sirve. Pausa y luego avanza con sensatez.",
      zh: "你在悬崖边犹豫。鲁莽或僵住都不是答案。先停一下，然后明智地前行。",
    },
  },
  {
    id: 1,
    emoji: "🎩",
    name: { en: "The Magician", es: "El Mago", zh: "魔术师" },
    keywords: {
      en: "Manifestation · skill · action",
      es: "Manifestación · habilidad · acción",
      zh: "显化 · 技能 · 行动",
    },
    upright: {
      en: "You have all the tools you need. Focus your will, take deliberate action — your intention can shape reality now.",
      es: "Tienes todas las herramientas. Enfoca tu voluntad, actúa con intención — puedes moldear la realidad ahora.",
      zh: "你拥有所需的一切工具。聚焦意志，采取明确行动 — 此刻你的意念能塑造现实。",
    },
    reversed: {
      en: "Manipulation or scattered energy. Check your motives and whether your talents are being used — or wasted.",
      es: "Manipulación o energía dispersa. Revisa tus motivos y si tus talentos se usan — o se desperdician.",
      zh: "操纵或能量分散。审视你的动机，看看才能是被善用，还是在浪费。",
    },
  },
  {
    id: 2,
    emoji: "🌙",
    name: { en: "The High Priestess", es: "La Sacerdotisa", zh: "女祭司" },
    keywords: {
      en: "Intuition · mystery · inner voice",
      es: "Intuición · misterio · voz interior",
      zh: "直觉 · 神秘 · 内在声音",
    },
    upright: {
      en: "Listen inward. The answer is already there, quieter than logic. Trust what you sense before what you're told.",
      es: "Escucha por dentro. La respuesta ya está ahí, más callada que la lógica. Confía en lo que intuyes.",
      zh: "向内倾听。答案早已在那里，比理性更安静。先相信感知，再相信他人的告知。",
    },
    reversed: {
      en: "Disconnection from your own voice. You've been drowning out your instincts with noise — step back and listen.",
      es: "Desconexión de tu propia voz. Has ahogado tus instintos con ruido — aléjate y escucha.",
      zh: "与自己的内在失联。你一直用外界的噪声压过直觉 — 退后一步，听听自己。",
    },
  },
  {
    id: 3,
    emoji: "👑",
    name: { en: "The Empress", es: "La Emperatriz", zh: "女皇" },
    keywords: {
      en: "Abundance · nurture · creativity",
      es: "Abundancia · nutrir · creatividad",
      zh: "丰盛 · 滋养 · 创造力",
    },
    upright: {
      en: "Nurture what you love — a project, a relationship, yourself. What you care for now is ready to bloom.",
      es: "Nutre lo que amas — un proyecto, una relación, tú mismo. Lo que cuides ahora está listo para florecer.",
      zh: "滋养你所爱的 — 一个项目、一段关系、你自己。你现在悉心照料的东西即将绽放。",
    },
    reversed: {
      en: "Neglect or creative block. You've been giving too much outward and too little to yourself. Return to your own garden.",
      es: "Negligencia o bloqueo creativo. Has dado demasiado afuera y poco a ti mismo. Vuelve a tu propio jardín.",
      zh: "忽视或创造力受阻。你一直向外给予过多，对自己给予过少。回到自己的花园。",
    },
  },
  {
    id: 4,
    emoji: "⚔️",
    name: { en: "The Emperor", es: "El Emperador", zh: "皇帝" },
    keywords: {
      en: "Structure · authority · discipline",
      es: "Estructura · autoridad · disciplina",
      zh: "秩序 · 权威 · 纪律",
    },
    upright: {
      en: "Build the structure. Set rules, take responsibility, plant the flag. The situation rewards backbone, not whim.",
      es: "Construye la estructura. Pon reglas, asume responsabilidad, planta bandera. La situación premia la firmeza.",
      zh: "建立秩序。立规则、担责任、树立旗帜。现在的局面奖赏有骨气的人，而非随性者。",
    },
    reversed: {
      en: "Rigidity or the absence of leadership. Either you're controlling too tightly or no one is steering. Adjust.",
      es: "Rigidez o ausencia de liderazgo. O controlas demasiado o nadie conduce. Ajusta.",
      zh: "要么过度控制，要么群龙无首。两个极端都要调整。",
    },
  },
  {
    id: 5,
    emoji: "📜",
    name: { en: "The Hierophant", es: "El Hierofante", zh: "教皇" },
    keywords: {
      en: "Tradition · teaching · belief",
      es: "Tradición · enseñanza · creencia",
      zh: "传统 · 教导 · 信念",
    },
    upright: {
      en: "Wisdom comes from lineage, teachers, proven methods. This isn't the time to reinvent — learn from what came before.",
      es: "La sabiduría viene del linaje, los maestros, los métodos probados. No es momento de reinventar — aprende.",
      zh: "智慧来自传承、老师、经过验证的方法。这不是独创新途的时候 — 先向前人学习。",
    },
    reversed: {
      en: "Break from dogma. The conventional path doesn't fit — trust your own code over inherited rules.",
      es: "Rompe con el dogma. El camino convencional no encaja — confía en tu código propio.",
      zh: "打破教条。常规路径不合你 — 相信自己的准则，胜过继承的规则。",
    },
  },
  {
    id: 6,
    emoji: "💕",
    name: { en: "The Lovers", es: "Los Enamorados", zh: "恋人" },
    keywords: {
      en: "Choice · alignment · union",
      es: "Elección · alineación · unión",
      zh: "抉择 · 契合 · 结合",
    },
    upright: {
      en: "A meaningful choice that aligns with your values. Say yes to what makes you more whole, not less.",
      es: "Una elección significativa alineada con tus valores. Di sí a lo que te hace más completo, no menos.",
      zh: "一个与你核心价值契合的重要选择。对让你更完整的事说是，而非让你变少的。",
    },
    reversed: {
      en: "Misalignment or avoidance of choosing. You already know which path is yours — the cost of not choosing is growing.",
      es: "Desalineación o evasión de elegir. Ya sabes cuál es tu camino — el costo de no elegir crece.",
      zh: "失衡或在逃避抉择。你早已知道属于自己的那条路 — 不选的代价正在累积。",
    },
  },
  {
    id: 7,
    emoji: "🏇",
    name: { en: "The Chariot", es: "El Carro", zh: "战车" },
    keywords: {
      en: "Willpower · momentum · victory",
      es: "Fuerza de voluntad · impulso · victoria",
      zh: "意志力 · 势头 · 胜利",
    },
    upright: {
      en: "Push forward. Conflicting impulses can be harnessed if you hold the reins. Victory goes to the focused.",
      es: "Avanza. Los impulsos opuestos se pueden domar si sostienes las riendas. La victoria es del concentrado.",
      zh: "勇往直前。只要你抓住缰绳，相反的冲动也能被驾驭。胜利属于专注之人。",
    },
    reversed: {
      en: "Scattered direction or loss of control. You're being pulled in too many ways — regroup before pushing.",
      es: "Dirección dispersa o pérdida de control. Te tiran en demasiadas direcciones — reagrúpate.",
      zh: "方向分散或失控。太多力量在拉扯你 — 先重整，再出发。",
    },
  },
  {
    id: 8,
    emoji: "🦁",
    name: { en: "Strength", es: "La Fuerza", zh: "力量" },
    keywords: {
      en: "Courage · patience · gentle power",
      es: "Coraje · paciencia · poder sereno",
      zh: "勇气 · 耐心 · 柔中带刚",
    },
    upright: {
      en: "Real strength is quiet. Tame the lion inside — fear, anger, impatience — with steady compassion, not force.",
      es: "La fuerza real es silenciosa. Doma al león interior — miedo, ira, impaciencia — con compasión firme.",
      zh: "真正的力量是安静的。用稳定的慈悲，而非蛮力，驯服你内心的那头狮子 — 恐惧、愤怒、急躁。",
    },
    reversed: {
      en: "Self-doubt or loss of composure. You're stronger than you feel right now — don't mistake a bad moment for a verdict.",
      es: "Duda o pérdida de compostura. Eres más fuerte de lo que sientes — no confundas un mal momento con un veredicto.",
      zh: "自我怀疑或失去从容。你比此刻感觉到的更强大 — 别把一时低谷当成终局判决。",
    },
  },
  {
    id: 9,
    emoji: "🕯️",
    name: { en: "The Hermit", es: "El Ermitaño", zh: "隐者" },
    keywords: {
      en: "Solitude · introspection · guidance",
      es: "Soledad · introspección · guía",
      zh: "独处 · 内省 · 指引",
    },
    upright: {
      en: "Withdraw to think. Answers to loud questions are found in quiet rooms. The light you need is already in you.",
      es: "Retírate a pensar. Las preguntas ruidosas se responden en habitaciones silenciosas. La luz ya está en ti.",
      zh: "退回独处思考。吵闹的问题往往在安静的房间里才有答案。你需要的那盏灯就在心里。",
    },
    reversed: {
      en: "Isolation has tipped into loneliness. You've withdrawn too far — reach out to one person you trust.",
      es: "El aislamiento se ha vuelto soledad. Te has retirado demasiado — contacta a alguien de confianza.",
      zh: "独处过头变成了孤立。你退得太远 — 联系一个你信任的人。",
    },
  },
  {
    id: 10,
    emoji: "🎡",
    name: { en: "Wheel of Fortune", es: "La Rueda de la Fortuna", zh: "命运之轮" },
    keywords: {
      en: "Cycles · fate · turning point",
      es: "Ciclos · destino · punto de inflexión",
      zh: "循环 · 命运 · 转折点",
    },
    upright: {
      en: "The tide is turning in your favor. Things that felt stuck are about to move — stay ready to ride the change.",
      es: "La marea cambia a tu favor. Lo que parecía estancado empieza a moverse — prepárate para surfear el cambio.",
      zh: "风向正向你转。之前卡住的事情要动了 — 做好准备乘势而行。",
    },
    reversed: {
      en: "A setback or downswing. Nothing on the wheel is permanent — endure this turn, it will come around.",
      es: "Un revés o bajón. Nada en la rueda es permanente — soporta este giro, volverá a subir.",
      zh: "挫折或低谷。轮子上没什么是永远的 — 熬过这一圈，它会再转回来。",
    },
  },
  {
    id: 11,
    emoji: "⚖️",
    name: { en: "Justice", es: "La Justicia", zh: "正义" },
    keywords: {
      en: "Fairness · truth · consequence",
      es: "Equidad · verdad · consecuencia",
      zh: "公平 · 真相 · 因果",
    },
    upright: {
      en: "Be honest with yourself about cause and effect. Outcomes are catching up with choices — make amends where needed.",
      es: "Sé honesto contigo mismo sobre causa y efecto. Los resultados alcanzan a las decisiones — repara lo necesario.",
      zh: "诚实面对因果。你做过的选择正在追上你 — 该修补的地方就修补。",
    },
    reversed: {
      en: "Imbalance or avoidance of accountability. You can't outrun the ledger — the longer you delay, the steeper the bill.",
      es: "Desequilibrio o evitación de responsabilidad. No puedes huir de la cuenta — cuanto más demoras, mayor la factura.",
      zh: "失衡或回避责任。你无法甩开账本 — 拖得越久，账单越重。",
    },
  },
  {
    id: 12,
    emoji: "🙃",
    name: { en: "The Hanged Man", es: "El Colgado", zh: "倒吊人" },
    keywords: {
      en: "Surrender · new perspective · pause",
      es: "Entrega · nueva perspectiva · pausa",
      zh: "放下 · 换角度 · 暂停",
    },
    upright: {
      en: "Stop pushing. The way forward opens when you stop forcing it — flip your view and the answer may appear.",
      es: "Deja de empujar. El camino aparece cuando dejas de forzar — invierte la mirada y llega la respuesta.",
      zh: "别再硬推了。停止强求，前路反而会显现 — 换个角度看，答案可能就浮出来了。",
    },
    reversed: {
      en: "Stalling disguised as patience. You're not pausing — you're stuck. Name it so you can move again.",
      es: "Parálisis disfrazada de paciencia. No estás pausando — estás atascado. Nómbralo para poder moverte.",
      zh: "把拖延伪装成耐心。你不是在暂停 — 你是卡住了。先承认，才能再动起来。",
    },
  },
  {
    id: 13,
    emoji: "💀",
    name: { en: "Death", es: "La Muerte", zh: "死神" },
    keywords: {
      en: "Ending · transformation · release",
      es: "Final · transformación · liberación",
      zh: "终结 · 蜕变 · 释放",
    },
    upright: {
      en: "Something needs to end — not tragically, but cleanly. Let it go so the next chapter can actually begin.",
      es: "Algo debe terminar — no trágicamente, sino limpiamente. Suéltalo para que pueda empezar lo siguiente.",
      zh: "有些东西需要结束 — 不是悲剧式的，而是干净利落地结束。放手，新篇章才能真正开始。",
    },
    reversed: {
      en: "Resistance to an ending that's already happening. Mourning the old isn't the same as staying in it.",
      es: "Resistencia a un final que ya ocurre. Llorar lo viejo no es quedarse en ello.",
      zh: "在抗拒一个已然发生的结束。悼念过去，和停留在过去，不是一回事。",
    },
  },
  {
    id: 14,
    emoji: "🌊",
    name: { en: "Temperance", es: "La Templanza", zh: "节制" },
    keywords: {
      en: "Balance · patience · blending",
      es: "Equilibrio · paciencia · mezcla",
      zh: "平衡 · 耐心 · 调和",
    },
    upright: {
      en: "Moderation wins. Mix extremes, find the middle — big swings are costing you stability.",
      es: "La moderación gana. Mezcla extremos, busca el medio — los vaivenes te quitan estabilidad.",
      zh: "适度者胜。调和极端、找中间 — 大起大落正让你失去稳定。",
    },
    reversed: {
      en: "Out of balance. Excess or deprivation — either way, ease back to the middle.",
      es: "Desequilibrio. Exceso o carencia — en ambos casos, regresa al medio.",
      zh: "失衡。要么过度，要么匮乏 — 两种都该回到中间。",
    },
  },
  {
    id: 15,
    emoji: "😈",
    name: { en: "The Devil", es: "El Diablo", zh: "恶魔" },
    keywords: {
      en: "Attachment · temptation · unseen chains",
      es: "Apego · tentación · cadenas invisibles",
      zh: "执着 · 诱惑 · 看不见的锁链",
    },
    upright: {
      en: "Look at what you keep returning to that doesn't serve you — a habit, a person, a story. The chain is unlocked; you're holding it.",
      es: "Mira a qué regresas una y otra vez que no te sirve — un hábito, alguien, una historia. La cadena está abierta; tú la sostienes.",
      zh: "看看你反复回到却对自己没好处的东西 — 一个习惯、一个人、一个故事。锁其实开着，是你自己在握着它。",
    },
    reversed: {
      en: "Awareness breaking through. You see the pattern — now comes the choice to walk away.",
      es: "La conciencia abre paso. Ves el patrón — ahora viene la decisión de soltarlo.",
      zh: "觉察正在破茧而出。你看清了模式 — 接下来是转身离开的选择。",
    },
  },
  {
    id: 16,
    emoji: "🗼",
    name: { en: "The Tower", es: "La Torre", zh: "高塔" },
    keywords: {
      en: "Upheaval · revelation · breakdown",
      es: "Convulsión · revelación · derrumbe",
      zh: "剧变 · 揭示 · 崩塌",
    },
    upright: {
      en: "A sudden collapse — but of something built on a false foundation. Painful, yes; but the truth is the gift.",
      es: "Un colapso repentino — pero de algo construido sobre una base falsa. Doloroso, sí; la verdad es el regalo.",
      zh: "突然的崩塌 — 但塌的是建在假地基上的东西。是痛，但真相本身就是礼物。",
    },
    reversed: {
      en: "A crisis narrowly averted, or one you're refusing to see coming. The tremors are warnings, not noise.",
      es: "Una crisis evitada por poco, o una que te niegas a ver. Los temblores son advertencias, no ruido.",
      zh: "险些爆发的危机，或者你拒绝正视的危机。那些震动是警告，不是噪声。",
    },
  },
  {
    id: 17,
    emoji: "⭐",
    name: { en: "The Star", es: "La Estrella", zh: "星星" },
    keywords: {
      en: "Hope · healing · renewal",
      es: "Esperanza · sanación · renovación",
      zh: "希望 · 疗愈 · 新生",
    },
    upright: {
      en: "After the storm, a quiet glow. You are being restored — slowly, gently. Trust the process.",
      es: "Tras la tormenta, un resplandor tranquilo. Estás siendo restaurado — lento, suave. Confía.",
      zh: "风暴过后，一缕安静的光。你正在被修复 — 缓慢而温柔。信任这个过程。",
    },
    reversed: {
      en: "Hope feels out of reach. Don't force optimism — small rituals of self-care are the bridge back to light.",
      es: "La esperanza se siente lejos. No fuerces optimismo — pequeños rituales de autocuidado son el puente.",
      zh: "希望好像遥不可及。别强行乐观 — 用小小的自我照顾的仪式，慢慢把自己接回光里。",
    },
  },
  {
    id: 18,
    emoji: "🌕",
    name: { en: "The Moon", es: "La Luna", zh: "月亮" },
    keywords: {
      en: "Illusion · uncertainty · subconscious",
      es: "Ilusión · incertidumbre · subconsciente",
      zh: "幻象 · 不确定 · 潜意识",
    },
    upright: {
      en: "Not everything you're seeing is real. Fear and imagination are distorting the view — wait for clearer light before deciding.",
      es: "No todo lo que ves es real. El miedo y la imaginación distorsionan — espera luz más clara antes de decidir.",
      zh: "你看到的不一定都是真的。恐惧和想象在扭曲视野 — 先等更清晰的光线，再做决定。",
    },
    reversed: {
      en: "Fog lifting. What was confusing starts to make sense — note the pattern so you can spot it earlier next time.",
      es: "La niebla se disipa. Lo confuso comienza a tener sentido — anota el patrón para verlo antes la próxima vez.",
      zh: "迷雾正在散开。之前困惑的事开始有头绪了 — 记下这个模式，下次早点认出它。",
    },
  },
  {
    id: 19,
    emoji: "☀️",
    name: { en: "The Sun", es: "El Sol", zh: "太阳" },
    keywords: {
      en: "Joy · vitality · clarity",
      es: "Alegría · vitalidad · claridad",
      zh: "喜悦 · 活力 · 清明",
    },
    upright: {
      en: "A warm, unambiguous yes. What you've worked toward is bearing fruit — let yourself feel it without bracing for the next thing.",
      es: "Un sí cálido y sin ambigüedad. Tu esfuerzo da frutos — déjate sentirlo sin prepararte ya para lo siguiente.",
      zh: "一个温暖而明确的「是」。你努力的方向正在结果 — 允许自己享受这一刻，别急着为下一件事绷紧神经。",
    },
    reversed: {
      en: "Optimism is clouded, but not gone. The light is still there — you're just standing in shadow. Step out.",
      es: "El optimismo está nublado, no perdido. La luz sigue ahí — solo estás en la sombra. Sal.",
      zh: "乐观被遮住了，但没消失。光还在那里 — 你只是站在了阴影里。走出来。",
    },
  },
  {
    id: 20,
    emoji: "📯",
    name: { en: "Judgement", es: "El Juicio", zh: "审判" },
    keywords: {
      en: "Awakening · reckoning · rebirth",
      es: "Despertar · ajuste · renacer",
      zh: "觉醒 · 清算 · 重生",
    },
    upright: {
      en: "A clear call. You see your life whole — the pattern, the costs, the next step. Answer honestly.",
      es: "Un llamado claro. Ves tu vida entera — el patrón, el costo, el siguiente paso. Responde con sinceridad.",
      zh: "一个清晰的召唤。你看到了完整的自己 — 模式、代价、下一步。诚实回应它。",
    },
    reversed: {
      en: "Self-judgment has hardened into a verdict. You're allowed to rewrite the story — the case isn't closed.",
      es: "El autojuicio se endureció en veredicto. Puedes reescribir la historia — el caso no está cerrado.",
      zh: "自我审判硬化成了定罪。你有权重写这个故事 — 这场审判还没结案。",
    },
  },
  {
    id: 21,
    emoji: "🌍",
    name: { en: "The World", es: "El Mundo", zh: "世界" },
    keywords: {
      en: "Completion · integration · wholeness",
      es: "Culminación · integración · plenitud",
      zh: "圆满 · 整合 · 完整",
    },
    upright: {
      en: "A cycle closes with integrity. What you were becoming, you've become. Celebrate, then choose the next horizon.",
      es: "Un ciclo se cierra con integridad. Lo que ibas siendo, ya lo eres. Celebra, luego elige el siguiente horizonte.",
      zh: "一个周期圆满收束。你曾在成为的那个人，已经成了。庆祝一下，再选择下一个地平线。",
    },
    reversed: {
      en: "One last loose thread. You're 90% there — don't skip the finish, even if it feels tedious. Close it cleanly.",
      es: "Un hilo suelto al final. Estás al 90% — no te saltes el cierre aunque sea tedioso. Termínalo bien.",
      zh: "最后一根还没收的线头。你已经走到 90% — 别跳过收尾，哪怕觉得枯燥。干净收场。",
    },
  },
];

// ─── Spread drawing ──────────────────────────────────────────────────────────

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
}

// Draw 3 distinct cards from the deck, each flipped randomly upright/reversed.
export function drawThreeCards(): DrawnCard[] {
  const pool = [...MAJOR_ARCANA];
  const drawn: DrawnCard[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const card = pool.splice(idx, 1)[0];
    drawn.push({ card, reversed: Math.random() < 0.5 });
  }
  return drawn;
}
