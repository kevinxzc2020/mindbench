import type { Lang } from "./translations";
import type { Difficulty } from "./difficulty";

// 打字测试的文章池，按难度 × 语言分层。
// 每层 4 条，每次开始测试随机挑一条（或者随进度轮换）。
//
// 难度设计：
//   easy   — 日常简单词，无复杂标点，句子短
//   medium — 标准名句、混合标点，长度适中
//   hard   — 长难词、复合句、多重标点、数字混排
//   hell   — 代码、符号、大小写、货币、SQL、密码样式 —— 极限打字挑战

export const TYPING_PASSAGES: Record<Difficulty, Record<Lang, string[]>> = {
  // ═════════════════════════════ EASY ═════════════════════════════
  easy: {
    en: [
      "The sun is warm today. I like to read books. My dog loves to play. We eat dinner at six.",
      "Apples are my favorite fruit. She has a blue hat. They walk to school together. The cat sleeps all day.",
      "Summer is fun for kids. We go to the beach often. Ice cream tastes so good. Birds sing in the morning.",
      "My room is quite small. I keep my books on the shelf. The window looks out on the yard. Rain falls softly tonight.",
    ],
    es: [
      "El sol calienta hoy. Me gusta leer libros. Mi perro juega mucho. Cenamos a las seis.",
      "La manzana es mi fruta favorita. Ella tiene un gorro azul. Caminan juntos a la escuela. El gato duerme todo el día.",
      "El verano es divertido. Vamos a la playa seguido. El helado sabe muy rico. Los pájaros cantan de mañana.",
      "Mi cuarto es pequeño. Guardo mis libros en el estante. La ventana da al patio. La lluvia cae suave.",
    ],
    zh: [
      "今天阳光很好。我喜欢看书。我的狗爱玩耍。我们六点吃饭。",
      "苹果是我最爱的水果。她戴着蓝色帽子。他们一起走去学校。猫咪睡了一整天。",
      "夏天很好玩。我们常去海边。冰淇淋很好吃。早上鸟儿在唱歌。",
      "我的房间很小。书都放在架子上。窗户正对着院子。雨轻轻地下着。",
    ],
  },

  // ═════════════════════════════ MEDIUM ═════════════════════════════
  medium: {
    en: [
      "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
      "Technology is best when it brings people together. The science of today is the technology of tomorrow. Innovation distinguishes between a leader and a follower.",
      "To be or not to be, that is the question. All that glitters is not gold. The course of true love never did run smooth. We know what we are but not what we may be.",
      "Knowledge speaks, but wisdom listens. In the middle of difficulty lies opportunity. The only way to do great work is to love what you do.",
    ],
    es: [
      "El veloz murciélago hindú comía feliz cardillo y kiwi. La cigüeña tocaba el saxofón detrás del palenque de paja. Quiero comer pizza con jamón y queso.",
      "La tecnología es mejor cuando une a las personas. La ciencia de hoy es la tecnología del mañana. La innovación distingue a los líderes de los seguidores.",
      "Ser o no ser, esa es la cuestión. No todo lo que brilla es oro. El camino del verdadero amor nunca transcurrió sin dificultades. Sabemos lo que somos pero no lo que podemos ser.",
      "El conocimiento habla, pero la sabiduría escucha. En medio de la dificultad yace la oportunidad. La única forma de hacer un gran trabajo es amar lo que haces.",
    ],
    zh: [
      "科学技术是第一生产力。知识就是力量，时间就是金钱。天才是百分之一的灵感加上百分之九十九的汗水。",
      "路漫漫其修远兮，吾将上下而求索。学而不思则罔，思而不学则殆。三人行，必有我师焉。",
      "人生最重要的不是我们站在哪里，而是我们朝哪个方向移动。失败是成功之母。坚持就是胜利。",
      "知识在说话，智慧在倾听。困难之中往往蕴藏着机会。做出伟大工作的唯一方法，就是热爱你正在做的事。",
    ],
  },

  // ═════════════════════════════ HARD ═════════════════════════════
  hard: {
    en: [
      "Notwithstanding her comprehensive preparation, the candidate's performance was characterized by an unexpected reticence — particularly during the Q&A segment, where her responses grew increasingly circuitous.",
      "The philosopher's magnum opus, a 900-page treatise on epistemology published posthumously in 1932, remains the definitive work on the subject; contemporary scholars still grapple with its implications.",
      "Researchers identified 47 distinct phenotypic variations across the 12-species sample, though several outliers (specifically those collected in 1994 from the Patagonian transect) warrant further investigation.",
      "Quintessentially bureaucratic, the organization's decision-making process requires sign-offs from six departments — each with unilateral veto power; consequently, reform proposals have stalled since 2019.",
    ],
    es: [
      "A pesar de su preparación exhaustiva, el rendimiento de la candidata se caracterizó por una inesperada reticencia — particularmente durante la sección de preguntas, donde sus respuestas se volvieron cada vez más circunvoluta.",
      "La obra magna del filósofo, un tratado de 900 páginas sobre epistemología publicado póstumamente en 1932, sigue siendo la obra definitiva sobre el tema; los académicos contemporáneos aún lidian con sus implicaciones.",
      "Los investigadores identificaron 47 variaciones fenotípicas distintas en la muestra de 12 especies, aunque varios valores atípicos (específicamente los recolectados en 1994 en el transecto patagónico) requieren más investigación.",
      "Quintaesencialmente burocrática, la toma de decisiones de la organización requiere firmas de seis departamentos — cada uno con poder de veto unilateral; por consiguiente, las propuestas de reforma están estancadas desde 2019.",
    ],
    zh: [
      "尽管她做了极为充分的准备，这位候选人的表现仍显得出人意料地拘谨 —— 尤其是在问答环节，她的回答变得愈发迂回曲折、难以把握重点。",
      "这位哲学家的巨著，一部长达九百页的认识论专论，于1932年身后出版，至今仍是该领域的权威之作；当代学者依然在反复咀嚼其中的深远含义。",
      "研究人员在12个物种的样本中识别出47种不同的表型变异，尽管几个异常值——特别是1994年在巴塔哥尼亚样带采集的那几例——仍有待进一步调查核实。",
      "这个组织的决策流程可谓官僚主义的典型：六个部门都要签字，而且每个部门都有单方面否决权；因此自2019年起改革提案就一直停滞不前。",
    ],
  },

  // ═════════════════════════════ HELL ═════════════════════════════
  hell: {
    en: [
      "if (x != null && y.length > 0) { return y.map((n) => n * 2).filter((n) => n % 7 === 0); }",
      "Invoice #A-2024-0847: $1,247.89 (net) + $187.18 tax = $1,435.07 — due 2024-11-03 EOD (PST).",
      "SELECT u.id, COUNT(*) AS c FROM users u JOIN logs l ON l.user_id=u.id WHERE l.ts>'2024-01-01' GROUP BY u.id HAVING c>100;",
      "Password: $Tr0nG#2024_P4$$w0rd! — must be ≥12 chars, 1 uppercase, 1 number, 1 symbol (!@#$%^&*).",
    ],
    es: [
      "if (x != null && y.length > 0) { return y.map((n) => n * 2).filter((n) => n % 7 === 0); }",
      "Factura nº A-2024-0847: €1.247,89 (neto) + €187,18 IVA = €1.435,07 — vence 03/11/2024 fin del día.",
      "SELECT u.id, COUNT(*) AS c FROM usuarios u JOIN logs l ON l.user_id=u.id WHERE l.ts>'2024-01-01' GROUP BY u.id HAVING c>100;",
      "Contraseña: $Tr0nG#2024_Clave! — mín. 12 car., 1 mayús., 1 núm., 1 símb. (!@#$%^&*).",
    ],
    zh: [
      "if (x != null && y.length > 0) { return y.map((n) => n * 2).filter((n) => n % 7 === 0); }",
      "发票 #A-2024-0847：¥1,247.89（净额）+ ¥187.18 税金 = ¥1,435.07 —— 截止 2024-11-03 当日。",
      "SELECT u.id, COUNT(*) AS c FROM 用户 u JOIN 日志 l ON l.user_id=u.id WHERE l.ts>'2024-01-01' GROUP BY u.id HAVING c>100;",
      "密码：$Tr0nG#2024_密码! —— 至少12位，1个大写、1个数字、1个符号(!@#$%^&*)。",
    ],
  },
};
