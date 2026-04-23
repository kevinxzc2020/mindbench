import type { Lang } from "./translations";
import type { Dimension } from "./mbti-data";

// ─── Scenario-based MBTI question model ─────────────────────────────────────
//
// 原来的 A/B 二选一被拆成"具体场景 + 多选项"模式。
// 每个选项带一个权重：
//   +2 / +1 = 偏向维度首字母 (E / S / T / J)
//   -1 / -2 = 偏向维度第二字母 (I / N / F / P)
//
// 计分：把同一维度下所有已回答选项的 score 累加，>0 选首字母，<0 选第二字母，
//       ==0 保持与旧实现一致的行为（tie → 首字母）。

export interface MbtiOption {
  label: Record<Lang, string>;
  score: -2 | -1 | 1 | 2;
}

export interface MbtiScenario {
  id: number;
  dimension: Dimension;
  scenario: Record<Lang, string>; // 场景铺垫（context）
  question: Record<Lang, string>; // 具体问法
  options: MbtiOption[];
}

// ─── 12 Scenarios (3 per dimension) ─────────────────────────────────────────

export const SCENARIOS: MbtiScenario[] = [
  // ═════════════ E / I ═════════════════════════════════════════════════════
  {
    id: 1,
    dimension: "EI",
    scenario: {
      en: "It's your first time at a company department dinner, and you don't know most of the people at the table.",
      es: "Es tu primera vez en una cena de departamento de la empresa, y no conoces a la mayoría de los presentes.",
      zh: "你第一次参加公司部门聚餐，桌上大多数人你不熟。",
    },
    question: {
      en: "What are you most likely to do?",
      es: "¿Qué es lo más probable que hagas?",
      zh: "你最可能怎么做？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Proactively strike up conversations and introduce yourself",
          es: "Inicias conversaciones y te presentas activamente",
          zh: "主动找人聊天，介绍自己",
        },
      },
      {
        score: -1,
        label: {
          en: "Observe first, find a familiar face to sit next to",
          es: "Observas primero, buscas un conocido para sentarte al lado",
          zh: "先观察一下，找熟人旁边坐下再说",
        },
      },
      {
        score: -2,
        label: {
          en: "Wait for others to come talk to you",
          es: "Esperas a que los demás se acerquen a hablarte",
          zh: "等别人主动跟你聊",
        },
      },
      {
        score: -1,
        label: {
          en: "Focus on eating, occasionally nod and chime in",
          es: "Te concentras en comer, ocasionalmente asientes y participas",
          zh: "专注吃饭，偶尔点头接话",
        },
      },
    ],
  },
  {
    id: 2,
    dimension: "EI",
    scenario: {
      en: "After an exhausting week of work, you've finally made it to Friday night.",
      es: "Después de una semana agotadora de trabajo, por fin es viernes por la noche.",
      zh: "这周工作累到爆炸，你终于熬到周五晚上。",
    },
    question: {
      en: "What recharges you?",
      es: "¿Cómo te recargas?",
      zh: "你的「充电方式」是？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Gather a group of friends and go out",
          es: "Reúnes a un grupo de amigos y salen",
          zh: "约一堆朋友出门聚聚",
        },
      },
      {
        score: 1,
        label: {
          en: "Meet 1–2 close friends for a deep conversation over coffee",
          es: "Encuentras a 1–2 amigos cercanos para una conversación profunda con café",
          zh: "找一两个密友喝咖啡聊深话",
        },
      },
      {
        score: -2,
        label: {
          en: "Stay home alone playing games or watching shows",
          es: "Te quedas en casa jugando o viendo series",
          zh: "一个人在家打游戏或看剧",
        },
      },
      {
        score: -1,
        label: {
          en: "Go out to exercise, but alone",
          es: "Sales a hacer ejercicio, pero solo",
          zh: "出门运动，但独自行动",
        },
      },
    ],
  },
  {
    id: 3,
    dimension: "EI",
    scenario: {
      en: "In a team meeting, someone raises a question you have thoughts on.",
      es: "En una reunión de equipo, alguien plantea una pregunta sobre la que tienes ideas.",
      zh: "团队会议上，有人提出了一个你有想法的问题。",
    },
    question: {
      en: "You usually...",
      es: "Normalmente...",
      zh: "你通常会…",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Raise your hand immediately and say whatever comes to mind",
          es: "Levantas la mano de inmediato y dices lo que se te ocurra",
          zh: "立刻举手发言，想到什么说什么",
        },
      },
      {
        score: 1,
        label: {
          en: "Listen for a bit, then add your thoughts when appropriate",
          es: "Escuchas un momento, luego añades tus ideas cuando sea oportuno",
          zh: "听一轮之后在合适时机补充",
        },
      },
      {
        score: -1,
        label: {
          en: "Organize your thoughts silently, speak only at key moments",
          es: "Organizas tus ideas en silencio, solo hablas en momentos clave",
          zh: "先在心里梳理清楚，关键时刻才说",
        },
      },
      {
        score: -2,
        label: {
          en: "Stay quiet unless someone calls on you",
          es: "Permaneces en silencio a menos que te pregunten",
          zh: "除非被点名，否则保持沉默",
        },
      },
    ],
  },

  // ═════════════ S / N ═════════════════════════════════════════════════════
  {
    id: 4,
    dimension: "SN",
    scenario: {
      en: "You want to cook a dish you've never made before.",
      es: "Quieres cocinar un plato que nunca has hecho antes.",
      zh: "你想做一道从来没做过的菜。",
    },
    question: {
      en: "How do you start?",
      es: "¿Cómo empiezas?",
      zh: "你会怎么开始？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Follow the recipe strictly, step by step, measuring cups and all",
          es: "Sigues la receta al pie de la letra, paso a paso, con tazas medidoras y todo",
          zh: "严格按菜谱一步步来，量具都用上",
        },
      },
      {
        score: 1,
        label: {
          en: "Reference the recipe but eyeball the measurements",
          es: "Consultas la receta pero estimas las medidas a ojo",
          zh: "参考菜谱，但大致估算分量",
        },
      },
      {
        score: -1,
        label: {
          en: "Glance at the idea, then wing it by feel",
          es: "Lees la idea general, luego improvisas por intuición",
          zh: "看几眼思路，凭感觉上手",
        },
      },
      {
        score: -2,
        label: {
          en: "Ignore the recipe entirely, go fully freestyle",
          es: "Ignoras la receta por completo, improvisas libremente",
          zh: "完全不看菜谱，自由发挥",
        },
      },
    ],
  },
  {
    id: 5,
    dimension: "SN",
    scenario: {
      en: "A friend shows you a Picasso-style abstract painting.",
      es: "Un amigo te muestra un cuadro abstracto estilo Picasso.",
      zh: "朋友给你看一张毕加索风格的抽象画。",
    },
    question: {
      en: "Your first reaction?",
      es: "¿Tu primera reacción?",
      zh: "你的第一反应是？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Describe concrete elements: there's a nose here, a hand there",
          es: "Describes elementos concretos: aquí hay una nariz, allá una mano",
          zh: "描述画面上的具体元素：这里有个鼻子，那里是手",
        },
      },
      {
        score: 1,
        label: {
          en: "Think about the painter's technique and art movement",
          es: "Piensas en la técnica del pintor y en su movimiento artístico",
          zh: "想画家当时的技法和流派背景",
        },
      },
      {
        score: -1,
        label: {
          en: "Guess the emotion the painter was trying to convey",
          es: "Adivinas la emoción que el pintor quería transmitir",
          zh: "猜画家当时想表达的情绪",
        },
      },
      {
        score: -2,
        label: {
          en: "Let it remind you of a personal experience or feeling",
          es: "Dejas que te recuerde una experiencia o sentimiento personal",
          zh: "联想到自己的某段经历或感受",
        },
      },
    ],
  },
  {
    id: 6,
    dimension: "SN",
    scenario: {
      en: "You're planning to buy a new phone.",
      es: "Planeas comprar un teléfono nuevo.",
      zh: "你打算换一部新手机。",
    },
    question: {
      en: "What matters most when choosing?",
      es: "¿Qué es lo más importante al elegir?",
      zh: "选型时最看重什么？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Concrete specs: battery life, camera MP, benchmark scores",
          es: "Especificaciones concretas: batería, megapíxeles, puntuaciones",
          zh: "具体参数：电池、摄像头像素、跑分",
        },
      },
      {
        score: 1,
        label: {
          en: "Real-world test data from detailed reviews",
          es: "Datos de pruebas reales de reseñas detalladas",
          zh: "专业评测的实测数据",
        },
      },
      {
        score: -1,
        label: {
          en: "The overall vibe and design philosophy of the brand",
          es: "La vibra general y la filosofía de diseño de la marca",
          zh: "品牌整体感觉和设计理念",
        },
      },
      {
        score: -2,
        label: {
          en: "The kind of person this phone would make you feel like",
          es: "El tipo de persona que este teléfono te haría sentir",
          zh: "它能让你成为什么样的人",
        },
      },
    ],
  },

  // ═════════════ T / F ═════════════════════════════════════════════════════
  {
    id: 7,
    dimension: "TF",
    scenario: {
      en: "Your best friend just went through a bad breakup and shows up crying.",
      es: "Tu mejor amigo/a acaba de pasar por una ruptura difícil y aparece llorando.",
      zh: "好朋友刚失恋，哭着来找你。",
    },
    question: {
      en: "What do you do first?",
      es: "¿Qué haces primero?",
      zh: "你首先会怎么做？",
    },
    options: [
      {
        score: -2,
        label: {
          en: "Give them a hug, say nothing",
          es: "Le das un abrazo, sin decir nada",
          zh: "抱一抱，什么也不说",
        },
      },
      {
        score: -1,
        label: {
          en: "Cry with them for a while, then talk about feelings",
          es: "Lloras con él/ella un rato, luego hablan de lo que siente",
          zh: "陪哭一会儿，然后聊聊感受",
        },
      },
      {
        score: 1,
        label: {
          en: "Help them analyze what went wrong in the relationship",
          es: "Le ayudas a analizar qué salió mal en la relación",
          zh: "帮他/她分析这段关系的问题",
        },
      },
      {
        score: 2,
        label: {
          en: "Tell them directly what they should do next",
          es: "Le dices directamente qué debería hacer a continuación",
          zh: "直接告诉他/她下一步该怎么办",
        },
      },
    ],
  },
  {
    id: 8,
    dimension: "TF",
    scenario: {
      en: "A coworker sent you a report with a clear data error — but you can tell they put a lot of effort into it.",
      es: "Un compañero te envió un informe con un claro error de datos, pero se nota que se esforzó mucho.",
      zh: "同事发来一份报告，里面有一个明显的数据错误，但能看出他花了很多心思。",
    },
    question: {
      en: "How do you give feedback?",
      es: "¿Cómo das tu retroalimentación?",
      zh: "你会怎么反馈？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Privately, point out the error directly, no sugarcoating",
          es: "En privado, señalas el error directamente, sin rodeos",
          zh: "私下直接指出错误，不绕弯",
        },
      },
      {
        score: 1,
        label: {
          en: "Ask as a question: \"Should this number be...?\"",
          es: "Preguntas con tacto: \"¿Este dato debería ser...?\"",
          zh: "以提问方式：\"这里的数据是不是应该…?\"",
        },
      },
      {
        score: -1,
        label: {
          en: "Acknowledge their effort first, then raise the error",
          es: "Reconoces su esfuerzo primero, luego mencionas el error",
          zh: "先承认他用心，再指出错误",
        },
      },
      {
        score: -2,
        label: {
          en: "Praise the details, then gently hint at the problem",
          es: "Elogias los detalles, luego insinúas el problema suavemente",
          zh: "先夸奖细节，再委婉提一下问题",
        },
      },
    ],
  },
  {
    id: 9,
    dimension: "TF",
    scenario: {
      en: "Two close friends are fighting, and both ask you to weigh in on who's right.",
      es: "Dos amigos cercanos están peleando y ambos te piden tu opinión sobre quién tiene razón.",
      zh: "两个好朋友吵起来了，都让你评评理。",
    },
    question: {
      en: "What do you do?",
      es: "¿Qué haces?",
      zh: "你会怎么做？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Lay out objectively who was right and who was wrong",
          es: "Expones objetivamente quién tiene razón y quién no",
          zh: "客观分析谁对谁错",
        },
      },
      {
        score: 1,
        label: {
          en: "Talk to each of them separately to piece together the facts",
          es: "Hablas con cada uno por separado para entender los hechos",
          zh: "分别找他们聊，理清事实",
        },
      },
      {
        score: -1,
        label: {
          en: "Soothe their emotions first, then discuss calmly",
          es: "Calmas sus emociones primero, luego conversan con calma",
          zh: "先安抚情绪，再慢慢说",
        },
      },
      {
        score: -2,
        label: {
          en: "Refuse to judge — just listen and let them work it out",
          es: "Te niegas a juzgar — solo escuchas y dejas que lo resuelvan",
          zh: "不评理，只当倾听者，让他们自己消化",
        },
      },
    ],
  },

  // ═════════════ J / P ═════════════════════════════════════════════════════
  {
    id: 10,
    dimension: "JP",
    scenario: {
      en: "It's Saturday morning and you have the whole day free.",
      es: "Es sábado por la mañana y tienes todo el día libre.",
      zh: "周六早上，你有一整天空闲。",
    },
    question: {
      en: "You usually...",
      es: "Normalmente...",
      zh: "你通常会…",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Have made a detailed schedule the day before",
          es: "Haber hecho un horario detallado el día anterior",
          zh: "前一天就列好清单，按时间安排",
        },
      },
      {
        score: 1,
        label: {
          en: "Have a rough plan in mind when you wake up",
          es: "Tener un plan aproximado al despertar",
          zh: "起床时心里有个大概的计划",
        },
      },
      {
        score: -1,
        label: {
          en: "Have a few ideas, pick based on mood",
          es: "Tener varias ideas, eliges según tu estado de ánimo",
          zh: "脑子里有几个想法，看心情挑",
        },
      },
      {
        score: -2,
        label: {
          en: "Figure it out after waking up, go wherever the moment takes you",
          es: "Decides al despertar, vas donde te lleve el momento",
          zh: "起床再说，想到什么干什么",
        },
      },
    ],
  },
  {
    id: 11,
    dimension: "JP",
    scenario: {
      en: "You've agreed to meet a friend at 3pm and the subway ride takes about 40 minutes.",
      es: "Has quedado con un amigo a las 3 pm y el trayecto en metro dura unos 40 minutos.",
      zh: "你约了朋友下午 3 点见面，坐地铁过去大概 40 分钟。",
    },
    question: {
      en: "When do you leave?",
      es: "¿Cuándo sales?",
      zh: "你什么时候出门？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "1.5 hours early, leave plenty of buffer",
          es: "1.5 horas antes, con mucho margen",
          zh: "提前 1.5 小时，留足缓冲",
        },
      },
      {
        score: 1,
        label: {
          en: "About an hour early, a bit before you need to",
          es: "Aproximadamente una hora antes, con algo de adelanto",
          zh: "提前 1 小时，比预计时间早一点",
        },
      },
      {
        score: -1,
        label: {
          en: "Right on schedule, no margin at all",
          es: "Justo a tiempo, sin margen",
          zh: "按地铁时间算得刚刚好",
        },
      },
      {
        score: -2,
        label: {
          en: "You'll probably be 5–10 minutes late, it's fine",
          es: "Probablemente llegues 5–10 minutos tarde, no pasa nada",
          zh: "一般会迟到 5–10 分钟，无所谓",
        },
      },
    ],
  },
  {
    id: 12,
    dimension: "JP",
    scenario: {
      en: "Your boss gives you a project with a one-month deadline.",
      es: "Tu jefe te asigna un proyecto con un plazo de un mes.",
      zh: "老板给你一个月做一个项目。",
    },
    question: {
      en: "How do you approach it?",
      es: "¿Cómo lo abordas?",
      zh: "你怎么推进？",
    },
    options: [
      {
        score: 2,
        label: {
          en: "Day 1: full plan, Gantt chart, milestones all mapped out",
          es: "Día 1: plan completo, diagrama de Gantt, hitos definidos",
          zh: "第一天列完整计划、甘特图都做好",
        },
      },
      {
        score: 1,
        label: {
          en: "First few days: lock in the key milestones",
          es: "Primeros días: defines los hitos clave",
          zh: "前几天规划好关键节点",
        },
      },
      {
        score: -1,
        label: {
          en: "Have a rough direction, adjust as you go",
          es: "Tienes una dirección general, ajustas sobre la marcha",
          zh: "大致有方向，边做边调整",
        },
      },
      {
        score: -2,
        label: {
          en: "Explore broadly first, sprint hard in the last week",
          es: "Exploras ampliamente al principio, das el esprint final en la última semana",
          zh: "前期先发散探索，最后一周冲刺",
        },
      },
    ],
  },
];

// ─── Scoring ────────────────────────────────────────────────────────────────
//
// answers: map of scenario.id → selected option index (0-based)
//
// 每个维度累加对应 option.score，正数取首字母 (E/S/T/J)，
// 负数取第二字母 (I/N/F/P)，== 0 保持与旧实现一致：取首字母。

export function calculateMbtiType(answers: Record<number, number>): string {
  const sums: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };

  for (const s of SCENARIOS) {
    const optIdx = answers[s.id];
    if (optIdx == null) continue;
    const opt = s.options[optIdx];
    if (!opt) continue;
    sums[s.dimension] += opt.score;
  }

  // Tie (== 0) → 首字母，与旧实现的 `>=` 语义一致。
  const e = sums.EI >= 0 ? "E" : "I";
  const s = sums.SN >= 0 ? "S" : "N";
  const t = sums.TF >= 0 ? "T" : "F";
  const j = sums.JP >= 0 ? "J" : "P";

  return `${e}${s}${t}${j}`;
}
