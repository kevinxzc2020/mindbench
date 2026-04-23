import type { Lang } from "./translations";

// ─── 每日运势生成逻辑 ──────────────────────────────────────────────────────
//
// 日期 + (可选) 用户标识 → 确定性 hash → 决定今天的运势等级、各项解读、幸运色等。
// 同一天同一用户打开多次会看到完全相同的结果（不能刷）。
// 第二天自动换新。

export type FortuneLevel =
  | "excellent"
  | "good"
  | "neutral"
  | "caution"
  | "unlucky";

export const LEVELS: FortuneLevel[] = [
  "excellent",
  "good",
  "neutral",
  "caution",
  "unlucky",
];

export interface LevelInfo {
  id: FortuneLevel;
  stars: number;
  emoji: string;
  name: Record<Lang, string>;
  gradient: string; // tailwind
}

export const LEVEL_INFO: Record<FortuneLevel, LevelInfo> = {
  excellent: {
    id: "excellent",
    stars: 5,
    emoji: "🌟",
    name: { en: "Excellent", es: "Excelente", zh: "大吉" },
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
  },
  good: {
    id: "good",
    stars: 4,
    emoji: "✨",
    name: { en: "Good", es: "Bueno", zh: "吉" },
    gradient: "from-emerald-400 to-teal-600",
  },
  neutral: {
    id: "neutral",
    stars: 3,
    emoji: "☁️",
    name: { en: "Neutral", es: "Neutral", zh: "平" },
    gradient: "from-slate-400 to-slate-600",
  },
  caution: {
    id: "caution",
    stars: 2,
    emoji: "⚠️",
    name: { en: "Caution", es: "Precaución", zh: "小凶" },
    gradient: "from-orange-400 to-orange-600",
  },
  unlucky: {
    id: "unlucky",
    stars: 1,
    emoji: "🌀",
    name: { en: "Unlucky", es: "Desfavorable", zh: "大凶" },
    gradient: "from-rose-500 to-red-700",
  },
};

// 每个 category × level × lang 都有 3 条文案，每天随机挑一条
type TextBucket = Record<FortuneLevel, Record<Lang, string[]>>;

export const OVERALL: TextBucket = {
  excellent: {
    en: [
      "A rare alignment. What you plant today has a real shot at taking root — be bold.",
      "Uncommon clarity. You'll see the right move and have the energy to make it.",
      "Momentum is with you. The universe seems to be holding doors open — just walk through.",
    ],
    es: [
      "Una alineación rara. Lo que plantes hoy tiene una oportunidad real de echar raíces — sé audaz.",
      "Claridad poco común. Verás el movimiento correcto y tendrás la energía para hacerlo.",
      "El impulso está contigo. El universo parece mantener puertas abiertas — solo camina.",
    ],
    zh: [
      "难得的好气场。今天种下的事情有很大概率生根发芽 —— 大胆一点。",
      "少见的清明时刻。你会看到正确的路，也有能量去走。",
      "势能在你这边。今天处处像是在为你开门 —— 走进去就对了。",
    ],
  },
  good: {
    en: [
      "A workable day. Steady effort on the right things will compound nicely.",
      "Things tilt in your favor. Nothing dramatic, just a gentle tailwind.",
      "Good conditions for small brave moves — the kind that stack up over time.",
    ],
    es: [
      "Un día trabajable. El esfuerzo constante en lo correcto se acumulará bien.",
      "Las cosas se inclinan a tu favor. Nada dramático, solo un viento de cola suave.",
      "Buenas condiciones para pequeños movimientos valientes — los que se acumulan.",
    ],
    zh: [
      "顺手的一天。把力气用在对的事上，积累会给你回报。",
      "风向略偏向你。没什么戏剧性，就是一股温和的顺风。",
      "适合做些小小的勇敢决定 —— 这种日子是靠它们攒出来的。",
    ],
  },
  neutral: {
    en: [
      "An average day — neither with you nor against you. You set the tone.",
      "Keep it light and keep it moving. Today is about maintenance, not breakthroughs.",
      "Flat terrain. A fine day for routine work and tying up loose ends.",
    ],
    es: [
      "Un día promedio — ni a favor ni en contra. Tú marcas el tono.",
      "Mantenlo ligero y sigue moviéndote. Hoy es de mantenimiento, no de avances.",
      "Terreno plano. Un buen día para la rutina y cerrar cabos sueltos.",
    ],
    zh: [
      "不偏不倚的一天 —— 不帮你也不阻你。基调由你自己定。",
      "别太用力，也别停。今天适合维护，不适合突破。",
      "平地一天。做些日常事务、收收杂活刚刚好。",
    ],
  },
  caution: {
    en: [
      "Friction hangs in the air. Avoid heavy decisions — small ones will need more attention.",
      "Today asks for patience. Don't escalate; the fog will lift by tomorrow.",
      "Minor bumps likely. Double-check your work and don't commit to anything risky.",
    ],
    es: [
      "Hay fricción en el aire. Evita decisiones pesadas — las pequeñas exigirán más atención.",
      "Hoy pide paciencia. No escales; la niebla se despejará mañana.",
      "Probables tropiezos menores. Revisa tu trabajo y no te comprometas a nada arriesgado.",
    ],
    zh: [
      "空气里有一点摩擦感。别做重大决定 —— 连小事也得多留心。",
      "今天适合收敛。别把争论升级，迷雾到明天就散了。",
      "可能会有些小磕碰。多检查几遍，别碰有风险的承诺。",
    ],
  },
  unlucky: {
    en: [
      "A day to lie low. Push nothing; reset tomorrow and you'll be fine.",
      "Things feel out of sync. Be kind to yourself — this passes.",
      "Unfavorable winds. Don't pick fights, don't sign things, just get through.",
    ],
    es: [
      "Un día para mantener perfil bajo. No fuerces nada; reinicia mañana y estarás bien.",
      "Las cosas se sienten fuera de sincronía. Sé amable contigo mismo — esto pasa.",
      "Vientos desfavorables. No te pelees, no firmes cosas, solo sobrevive.",
    ],
    zh: [
      "今天适合低调。什么都别强推，明天重启就是。",
      "节奏不对。对自己温柔一点，这只是暂时的。",
      "风向不顺。别吵架，别签东西，只管熬过去。",
    ],
  },
};

export const CAREER: TextBucket = {
  excellent: {
    en: [
      "A breakthrough moment at work — speak up when it counts.",
      "Decisions land. The right people will hear what you say today.",
      "Lead. Others are looking for direction and you have it.",
    ],
    es: [
      "Un momento decisivo en el trabajo — habla cuando cuente.",
      "Las decisiones aterrizan. Las personas correctas te escucharán hoy.",
      "Lidera. Los demás buscan dirección y tú la tienes.",
    ],
    zh: [
      "工作上可能有突破时刻 —— 该发言的时候别沉默。",
      "决策容易落地。今天你的话会被对的人听到。",
      "当个带头的人。别人在找方向，而你手里有。",
    ],
  },
  good: {
    en: [
      "Collaborators are helpful today. Ask for what you need.",
      "Your focus is sharp — good day to finish something you've been dragging.",
      "A useful conversation is likely. Go into meetings prepared.",
    ],
    es: [
      "Los colaboradores son útiles hoy. Pide lo que necesites.",
      "Tu enfoque es agudo — buen día para terminar algo que arrastras.",
      "Es probable una conversación útil. Entra a las reuniones preparado.",
    ],
    zh: [
      "同事今天愿意帮忙。你缺什么，直接开口。",
      "专注力不错 —— 适合收掉某件拖了很久的事。",
      "可能有一次有价值的对话。开会前做好准备。",
    ],
  },
  neutral: {
    en: [
      "Get the small things done. Nothing flashy, but a clean list feels good.",
      "Keep expectations realistic — steady output today, no heroics.",
      "Good for inbox zero, not for strategy.",
    ],
    es: [
      "Haz las cosas pequeñas. Nada llamativo, pero una lista limpia se siente bien.",
      "Mantén expectativas realistas — producción estable hoy, nada heroico.",
      "Bueno para vaciar la bandeja, no para estrategia.",
    ],
    zh: [
      "把琐事收一收。不出彩，但清单干净会让你舒服。",
      "期望放现实 —— 今天稳定产出就好，别想干大事。",
      "适合清收件箱，不适合做战略。",
    ],
  },
  caution: {
    en: [
      "Miscommunication likely. Write things down; confirm in writing.",
      "Don't send that risky email today. Sleep on it.",
      "A colleague may misread your tone. Over-clarify rather than under-.",
    ],
    es: [
      "Probables malentendidos. Escribe las cosas; confirma por escrito.",
      "No envíes ese correo arriesgado hoy. Duérmelo.",
      "Un colega puede malinterpretar tu tono. Sobre-aclarar en lugar de no.",
    ],
    zh: [
      "容易误会。重要事情白纸黑字、书面确认。",
      "今天别发那封有风险的邮件。睡一觉再决定。",
      "同事可能误读你的语气。说清楚点，别含糊。",
    ],
  },
  unlucky: {
    en: [
      "Don't make big career moves today. Defer anything irreversible.",
      "Drama may try to find you at work. Step around, don't engage.",
      "Today is not your day to negotiate. Postpone if you can.",
    ],
    es: [
      "No hagas grandes movimientos de carrera hoy. Pospon lo irreversible.",
      "El drama puede buscarte en el trabajo. Esquiva, no te involucres.",
      "Hoy no es tu día para negociar. Pospon si puedes.",
    ],
    zh: [
      "今天别做大的职业决定。能推后的全部推后。",
      "工作上可能有戏剧性的事找上你。绕开，别卷进去。",
      "今天不是你谈判的日子。能推就推。",
    ],
  },
};

export const LOVE: TextBucket = {
  excellent: {
    en: [
      "Rare tenderness available. Reach out — the message will land well.",
      "A meaningful connection forms easily today. Stay open.",
      "Speak the thing you've been rehearsing — they're ready to hear it.",
    ],
    es: [
      "Ternura rara disponible. Acércate — el mensaje llegará bien.",
      "Una conexión significativa se forma fácilmente hoy. Mantente abierto.",
      "Di eso que has estado ensayando — están listos para oírlo.",
    ],
    zh: [
      "难得的温柔在场。主动联系，话会被好好接住。",
      "今天有意义的连接比平时更容易形成。保持开放。",
      "把你在心里排演过的话说出来 —— 对方已经准备好听了。",
    ],
  },
  good: {
    en: [
      "Warmth flows naturally. Send the small message you've been holding.",
      "Quality time beats quantity today. One good talk > five quick ones.",
      "Someone is thinking about you. Not a big deal, just a nice one.",
    ],
    es: [
      "La calidez fluye naturalmente. Envía el pequeño mensaje que has guardado.",
      "Calidad sobre cantidad hoy. Una buena charla > cinco rápidas.",
      "Alguien está pensando en ti. No es gran cosa, solo algo lindo.",
    ],
    zh: [
      "暖意自然流动。发那条你一直没发的小消息。",
      "今天质量比数量重要。一次好好聊 > 五次闲聊。",
      "有人在想你。不是什么大事，只是一件小小的温柔事。",
    ],
  },
  neutral: {
    en: [
      "Relationships are on cruise control. No action needed.",
      "Listen more than you speak today — others need to be heard.",
      "Skip the heart-to-heart today; low energy for it on both sides.",
    ],
    es: [
      "Las relaciones van en piloto automático. No se necesita acción.",
      "Escucha más de lo que hablas hoy — los demás necesitan ser oídos.",
      "Salta la charla profunda hoy; poca energía en ambos lados.",
    ],
    zh: [
      "感情处于巡航状态。今天不用特别做什么。",
      "多听少说。今天别人比你更需要被听见。",
      "跳过那种推心置腹的深谈 —— 两边都没那个能量。",
    ],
  },
  caution: {
    en: [
      "Old tensions may resurface. Don't fan them — name them if needed, then move on.",
      "Today is bad for 'we need to talk' conversations. Wait a day.",
      "You might misread someone's silence. Don't fill the gap with assumptions.",
    ],
    es: [
      "Tensiones viejas pueden resurgir. No las avives — nómbralas si hace falta y sigue.",
      "Hoy es mal día para conversaciones de 'tenemos que hablar'. Espera un día.",
      "Puedes malinterpretar el silencio de alguien. No llenes el vacío con suposiciones.",
    ],
    zh: [
      "旧的紧张可能浮上来。别再煽风 —— 必要时点明一下，然后放下。",
      "今天不适合「我们谈谈吧」这种对话。等一天再说。",
      "你可能会误读对方的沉默。别用自己的假设去填那个空白。",
    ],
  },
  unlucky: {
    en: [
      "Avoid emotionally loaded conversations. Anything said today will land wrong.",
      "If you feel slighted, assume you're misreading. Ask tomorrow, not now.",
      "Be extra kind to yourself — you're more sensitive today than you realize.",
    ],
    es: [
      "Evita conversaciones emocionalmente cargadas. Todo lo dicho hoy caerá mal.",
      "Si te sientes despreciado, asume que estás malinterpretando. Pregunta mañana.",
      "Sé extra amable contigo mismo — estás más sensible hoy de lo que crees.",
    ],
    zh: [
      "避开情绪重的对话。今天说什么都容易落空。",
      "如果觉得被冷落了，先默认是自己误读了。明天再问，不是今天。",
      "对自己再温柔一点 —— 你今天比你以为的更敏感。",
    ],
  },
};

export const WEALTH: TextBucket = {
  excellent: {
    en: [
      "Financial clarity today. Good moment to review and plan.",
      "An opportunity or small windfall is possible — stay alert.",
      "Your instincts about money are sharp today. Trust them within reason.",
    ],
    es: [
      "Claridad financiera hoy. Buen momento para revisar y planear.",
      "Una oportunidad o pequeña ganancia inesperada es posible — mantente alerta.",
      "Tus instintos sobre dinero están afilados hoy. Confía dentro de lo razonable.",
    ],
    zh: [
      "财务上难得的清明。适合复盘和规划。",
      "可能有机会或小横财 —— 保持关注。",
      "今天你对钱的直觉偏准。理性范围内相信它。",
    ],
  },
  good: {
    en: [
      "A minor bonus or saved expense is possible. Not dramatic, just nice.",
      "Pay attention to recurring subscriptions today — cleanup pays off.",
      "Good day to make a small investment in a tool that will save you time.",
    ],
    es: [
      "Un bono menor o gasto ahorrado es posible. No dramático, solo agradable.",
      "Atiende las suscripciones recurrentes hoy — limpiar paga.",
      "Buen día para pequeña inversión en una herramienta que ahorre tiempo.",
    ],
    zh: [
      "可能有小额好消息或省下一笔开销。不惊艳，只是恰到好处。",
      "清理一下那些自动续费的订阅。划算。",
      "适合在一个能帮你省时间的工具上做小投入。",
    ],
  },
  neutral: {
    en: [
      "No financial surprises either way. Business as usual.",
      "Stick to your existing budget today. Don't rebuild it.",
      "Flat week for money things. That's a feature, not a bug.",
    ],
    es: [
      "Sin sorpresas financieras en ningún sentido. Todo normal.",
      "Sigue tu presupuesto actual hoy. No lo reconstruyas.",
      "Semana plana para cosas de dinero. Es una ventaja, no un bug.",
    ],
    zh: [
      "钱上没什么意外。照常就行。",
      "守住现有预算。今天别重做预算。",
      "钱的事平平淡淡。这是好事，不是问题。",
    ],
  },
  caution: {
    en: [
      "Unexpected expense is possible. Don't blame yourself; just absorb it.",
      "Avoid impulse purchases today — you'll regret at least one.",
      "Don't sign financial paperwork today. Read tomorrow.",
    ],
    es: [
      "Posible gasto inesperado. No te culpes; solo absórbelo.",
      "Evita compras impulsivas hoy — te arrepentirás de al menos una.",
      "No firmes papeles financieros hoy. Léelos mañana.",
    ],
    zh: [
      "可能有意外开销。别自责，吸收了就是。",
      "今天别冲动消费 —— 起码会后悔一项。",
      "别签任何财务相关的文件。明天再读。",
    ],
  },
  unlucky: {
    en: [
      "Avoid big financial decisions. Today is not your day to do math quickly.",
      "A reminder: that expensive thing can wait. It really can.",
      "Don't lend, don't gamble, don't 'invest on a tip'. None of it today.",
    ],
    es: [
      "Evita grandes decisiones financieras. Hoy no es tu día para hacer cuentas rápido.",
      "Recordatorio: esa cosa cara puede esperar. De verdad.",
      "No prestes, no apuestes, no 'inviertas por un dato'. Nada de eso hoy.",
    ],
    zh: [
      "别做大的财务决定。今天你不是算得最清的那一个。",
      "提醒一下：那个贵的东西可以等。真的可以。",
      "别借钱、别赌博、别「听消息」投资。今天都不行。",
    ],
  },
};

export const HEALTH: TextBucket = {
  excellent: {
    en: [
      "Energy is high. A good day to move your body intentionally.",
      "Sleep well tonight — tomorrow will thank you.",
      "Your body and mind are in sync. Use it, don't burn it.",
    ],
    es: [
      "La energía es alta. Buen día para mover el cuerpo con intención.",
      "Duerme bien esta noche — mañana te lo agradecerá.",
      "Tu cuerpo y mente están sincronizados. Úsalo, no lo quemes.",
    ],
    zh: [
      "能量饱满。适合有意识地动一动身体。",
      "今晚睡好 —— 明天会感谢你。",
      "身心同步的一天。用起来，但别烧干它。",
    ],
  },
  good: {
    en: [
      "A walk outside will do more than you think. Ten minutes counts.",
      "Drink water. Genuinely, drink water today.",
      "Light exercise, light food, light mood.",
    ],
    es: [
      "Un paseo afuera hará más de lo que crees. Diez minutos cuentan.",
      "Bebe agua. De verdad, bebe agua hoy.",
      "Ejercicio ligero, comida ligera, ánimo ligero.",
    ],
    zh: [
      "出门散个步，作用比你以为的大。十分钟也算。",
      "喝水。今天认真地喝水。",
      "轻运动、轻饮食、轻心情。",
    ],
  },
  neutral: {
    en: [
      "No red flags. Stick to your routine.",
      "Listen to your body — it probably wants rest, not stimulation.",
      "Not a day to start a new regimen. Not a day to break your old one.",
    ],
    es: [
      "Sin banderas rojas. Sigue con tu rutina.",
      "Escucha a tu cuerpo — probablemente quiere descanso, no estímulo.",
      "No es día para empezar un régimen nuevo. No es día para romper el viejo.",
    ],
    zh: [
      "没什么红灯。照你的习惯来。",
      "听身体的 —— 它今天八成要的是休息，不是刺激。",
      "不适合开新健身计划。也不适合打破旧的。",
    ],
  },
  caution: {
    en: [
      "Low energy likely. Don't schedule the tough workout for today.",
      "Skip the third coffee. You'll crash harder than usual.",
      "Headache or fatigue possible — stay hydrated, go easy.",
    ],
    es: [
      "Baja energía probable. No programes el entrenamiento duro hoy.",
      "Salta el tercer café. Caerás más fuerte de lo habitual.",
      "Posible dolor de cabeza o fatiga — hidrátate, ve despacio.",
    ],
    zh: [
      "今天容易没劲。硬核训练挪到明天。",
      "第三杯咖啡别喝了。今天回落会比平时厉害。",
      "可能头痛或疲惫 —— 多喝水，放慢节奏。",
    ],
  },
  unlucky: {
    en: [
      "Rest day. Not optional, recommended.",
      "Don't push through if you feel off. Cancel something.",
      "Old injuries may flare up. Be gentle with yourself.",
    ],
    es: [
      "Día de descanso. No opcional, recomendado.",
      "No te fuerces si te sientes mal. Cancela algo.",
      "Lesiones viejas pueden reactivarse. Sé suave contigo.",
    ],
    zh: [
      "今天就是休息日。不是选项，是建议。",
      "如果感觉不对，别硬撑。砍掉一件事。",
      "旧伤可能会闹。对自己温柔一点。",
    ],
  },
};

// ─── Lucky color / do / avoid pools (independent of level) ──────────────────

export const LUCKY_COLORS: Record<Lang, string[]> = {
  en: ["Gold", "Emerald Green", "Sky Blue", "Deep Purple", "Crimson Red", "Pearl White", "Warm Orange", "Slate Gray"],
  es: ["Oro", "Verde esmeralda", "Azul cielo", "Púrpura intenso", "Rojo carmesí", "Blanco perla", "Naranja cálido", "Gris pizarra"],
  zh: ["金色", "翡翠绿", "天空蓝", "深紫", "绛红", "珍珠白", "暖橙", "岩灰"],
};

// Short-form suggestions shown under 宜/Do section
export const DO_ITEMS: Record<Lang, string[]> = {
  en: [
    "Write down 3 things you're grateful for",
    "Take a 20-minute walk outside",
    "Call someone you haven't talked to in a while",
    "Cook something you haven't made before",
    "Read one chapter of a book",
    "Tidy one small corner of your space",
    "Stretch for 5 minutes",
    "Send one overdue message",
    "Finish one thing you've been putting off",
    "Do nothing — and don't feel guilty",
  ],
  es: [
    "Escribe 3 cosas por las que estás agradecido",
    "Camina 20 minutos al aire libre",
    "Llama a alguien con quien no has hablado hace tiempo",
    "Cocina algo que no hayas hecho antes",
    "Lee un capítulo de un libro",
    "Ordena una pequeña esquina de tu espacio",
    "Estírate durante 5 minutos",
    "Envía un mensaje atrasado",
    "Termina una cosa que has estado posponiendo",
    "No hagas nada — y no te sientas culpable",
  ],
  zh: [
    "写下三件值得感谢的事",
    "出门走二十分钟",
    "给很久没联系的人打个电话",
    "做一道没做过的菜",
    "读一章书",
    "整理一个小小的角落",
    "拉伸五分钟",
    "发出那条拖了很久的消息",
    "收掉一件你一直在拖的事",
    "什么都不做 —— 而且别内疚",
  ],
};

export const AVOID_ITEMS: Record<Lang, string[]> = {
  en: [
    "Scrolling social media mindlessly",
    "Agreeing to something you'll regret",
    "Eating past full",
    "Starting an argument you can avoid",
    "Online shopping while tired",
    "Checking work email after 9pm",
    "Making big decisions on little sleep",
    "Comparing yourself to strangers",
    "Signing contracts you haven't read twice",
    "Saying yes just to be polite",
  ],
  es: [
    "Scrollear redes sociales sin pensar",
    "Aceptar algo de lo que te arrepentirás",
    "Comer pasado de lleno",
    "Iniciar una discusión evitable",
    "Comprar en línea cuando estás cansado",
    "Revisar correo del trabajo después de las 9pm",
    "Tomar grandes decisiones con poco sueño",
    "Compararte con desconocidos",
    "Firmar contratos que no has leído dos veces",
    "Decir sí solo por cortesía",
  ],
  zh: [
    "无意识地刷社交媒体",
    "答应一件你之后会后悔的事",
    "吃到过饱",
    "挑起一场可以避免的争论",
    "累的时候网购",
    "晚上九点之后回工作邮件",
    "睡眠不足时做重大决定",
    "拿自己和陌生人比较",
    "签一份只读过一遍的合同",
    "只为了礼貌就说好",
  ],
};

// ─── Deterministic hash ──────────────────────────────────────────────────────

function djb2Hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
    // Keep it unsigned 32-bit
    h = h >>> 0;
  }
  return h;
}

// ─── Fortune generation ──────────────────────────────────────────────────────

export interface Fortune {
  level: FortuneLevel;
  overall: string;
  career: string;
  love: string;
  wealth: string;
  health: string;
  luckyColor: string;
  luckyNumber: number;
  doItems: string[];   // 2 items
  avoidItems: string[]; // 2 items
}

// Roll level using weighted distribution so most days are "good / neutral"
function rollLevel(seed: number): FortuneLevel {
  const r = seed % 100;
  if (r < 15) return "excellent";   // 15%
  if (r < 50) return "good";        // 35%
  if (r < 80) return "neutral";     // 30%
  if (r < 93) return "caution";     // 13%
  return "unlucky";                  // 7%
}

// Pick an item from an array using a hash offset
function pick<T>(arr: T[], seed: number, offset: number): T {
  return arr[Math.floor(seed / offset) % arr.length];
}

// Pick TWO distinct items from an array using two offsets
function pickTwo<T>(arr: T[], seed: number, offA: number, offB: number): [T, T] {
  const a = Math.floor(seed / offA) % arr.length;
  let b = Math.floor(seed / offB) % arr.length;
  if (b === a) b = (b + 1) % arr.length; // avoid duplicate
  return [arr[a], arr[b]];
}

export function generateFortune(
  dateStr: string, // "YYYY-MM-DD"
  lang: Lang,
  userKey: string = "anonymous"
): Fortune {
  const seed = djb2Hash(`${dateStr}::${userKey}::v1`);
  const level = rollLevel(seed);

  const [doA, doB] = pickTwo(DO_ITEMS[lang], seed, 31, 37);
  const [avA, avB] = pickTwo(AVOID_ITEMS[lang], seed, 41, 43);

  return {
    level,
    overall: pick(OVERALL[level][lang], seed, 7),
    career:  pick(CAREER[level][lang], seed, 11),
    love:    pick(LOVE[level][lang], seed, 13),
    wealth:  pick(WEALTH[level][lang], seed, 17),
    health:  pick(HEALTH[level][lang], seed, 19),
    luckyColor: pick(LUCKY_COLORS[lang], seed, 23),
    luckyNumber: (Math.floor(seed / 29) % 99) + 1,
    doItems: [doA, doB],
    avoidItems: [avA, avB],
  };
}

// Format today's date in UTC as YYYY-MM-DD (client uses Intl to show local date nicely)
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
