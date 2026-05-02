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

  // ═══════════════ Additional E / I ════════════════════════════════════════
  {
    id: 13,
    dimension: "EI",
    scenario: {
      en: "You have a rare free Saturday with nothing planned.",
      es: "Tienes un sábado libre sin nada planeado.",
      zh: "你难得有一个完全空闲的周六，什么安排都没有。",
    },
    question: {
      en: "How do you spend it?",
      es: "¿Cómo lo pasas?",
      zh: "你会怎么度过？",
    },
    options: [
      { score:  2, label: { en: "Call friends and plan something spontaneous", es: "Llamas a amigos y planeas algo espontáneo", zh: "打电话约朋友，临时搞点什么" } },
      { score:  1, label: { en: "Go to a café or park where people are around", es: "Vas a un café o parque donde hay gente", zh: "去有人气的咖啡馆或公园逛逛" } },
      { score: -1, label: { en: "Do a hobby you enjoy alone at home", es: "Practicas un hobby solo en casa", zh: "在家专注做一个自己喜欢的爱好" } },
      { score: -2, label: { en: "Do absolutely nothing — guilt-free rest", es: "No hacer absolutamente nada — descanso sin culpa", zh: "什么都不做，彻底放空" } },
      { score:  1, label: { en: "Browse events or markets nearby", es: "Buscas eventos o mercados cercanos", zh: "逛逛附近的展览或市集" } },
      { score: -1, label: { en: "Catch up on shows, books, or games", es: "Te pones al día con series, libros o juegos", zh: "补剧、看书或打游戏" } },
    ],
  },
  {
    id: 14,
    dimension: "EI",
    scenario: {
      en: "You receive a wedding invitation from an acquaintance — you know maybe 3 people there.",
      es: "Recibes una invitación de boda de un conocido — conoces a unas 3 personas.",
      zh: "你收到一个泛泛之交的婚礼邀请，认识的人可能只有三个。",
    },
    question: {
      en: "What's your gut reaction?",
      es: "¿Cuál es tu reacción instintiva?",
      zh: "你第一反应是？",
    },
    options: [
      { score:  2, label: { en: "Excited — great excuse to meet new people", es: "Emocionado/a — excusa perfecta para conocer gente", zh: "开心，正好认识新朋友" } },
      { score:  1, label: { en: "Fine with it, you'll make the best of it", es: "Bien, sacarás el mejor partido", zh: "还好，去了就适应了" } },
      { score: -1, label: { en: "A bit uneasy, but you'll manage", es: "Un poco nervioso/a, pero lo llevarás", zh: "有点不安，但勉强能应付" } },
      { score: -2, label: { en: "Hoping for a polite excuse not to go", es: "Buscas una excusa educada para no ir", zh: "暗自希望找到合适的借口婉拒" } },
      { score:  1, label: { en: "Check who else is going before deciding", es: "Preguntas quién más va antes de decidir", zh: "先打听谁去了再决定" } },
      { score: -1, label: { en: "Go for a while then quietly slip away early", es: "Vas un rato y te escapes discretamente", zh: "去露个脸，找机会早点溜走" } },
    ],
  },
  {
    id: 15,
    dimension: "EI",
    scenario: {
      en: "A colleague proposes a team brainstorm session for a project you're working on.",
      es: "Un colega propone una sesión de lluvia de ideas grupal para un proyecto.",
      zh: "同事提议为你们正在做的项目开一个头脑风暴会议。",
    },
    question: {
      en: "What's your preference?",
      es: "¿Qué prefieres?",
      zh: "你更倾向于？",
    },
    options: [
      { score:  2, label: { en: "Love it — real-time sparks fly best in groups", es: "Me encanta — las chispas surgen mejor en grupo", zh: "很好，大家碰撞才有火花" } },
      { score:  1, label: { en: "Fine, you contribute well in discussions", es: "Bien, participas bien en las discusiones", zh: "可以，你在讨论中挺活跃的" } },
      { score: -1, label: { en: "Prefer to think solo first, then share ideas", es: "Prefieres pensar solo antes de compartir", zh: "希望先自己想清楚再分享" } },
      { score: -2, label: { en: "Rather submit ideas in writing beforehand", es: "Preferirías enviar ideas por escrito de antemano", zh: "宁可提前用文字把想法发过去" } },
      { score:  1, label: { en: "OK, but hope the group stays focused", es: "De acuerdo, pero esperas que el grupo se concentre", zh: "行，但希望大家不要跑题" } },
      { score: -1, label: { en: "Would prefer a smaller 1-on-1 chat instead", es: "Preferirías una charla 1 a 1 más pequeña", zh: "宁可一对一交流，不喜欢大会议" } },
    ],
  },

  // ═══════════════ Additional S / N ════════════════════════════════════════
  {
    id: 16,
    dimension: "SN",
    scenario: {
      en: "You're buying a new laptop.",
      es: "Estás comprando un nuevo portátil.",
      zh: "你要买一台新笔记本电脑。",
    },
    question: {
      en: "How do you decide?",
      es: "¿Cómo decides?",
      zh: "你会怎么决定？",
    },
    options: [
      { score:  2, label: { en: "Compare specs sheet by sheet — RAM, CPU, weight", es: "Comparas especificaciones hoja a hoja", zh: "对比参数表，内存、CPU、重量逐一看" } },
      { score:  1, label: { en: "Read hands-on reviews for real-world performance", es: "Lees reseñas de uso real", zh: "看真实使用评测" } },
      { score: -1, label: { en: "Think about what kind of work you imagine doing in 3 years", es: "Piensas en qué tipo de trabajo imaginas en 3 años", zh: "想象自己三年后会用来做什么" } },
      { score: -2, label: { en: "Go with the brand that fits your aesthetic and vision", es: "Eliges la marca que encaja con tu estética", zh: "选最符合自己风格和未来感的品牌" } },
      { score:  1, label: { en: "Ask a tech-savvy friend for a recommendation", es: "Pides recomendación a un amigo experto en tecnología", zh: "问熟悉技术的朋友推荐什么" } },
      { score: -1, label: { en: "Gut feeling — which one excites you most", es: "Instinto — cuál te emociona más", zh: "凭感觉，哪台看着最顺眼" } },
    ],
  },
  {
    id: 17,
    dimension: "SN",
    scenario: {
      en: "Someone asks you to describe a recent vacation you enjoyed.",
      es: "Alguien te pide que describas unas vacaciones recientes que disfrutaste.",
      zh: "有人让你描述一次你很喜欢的旅行。",
    },
    question: {
      en: "What do you naturally focus on?",
      es: "¿En qué te centras de forma natural?",
      zh: "你自然而然会讲什么？",
    },
    options: [
      { score:  2, label: { en: "The specific food, sights, weather, itinerary", es: "La comida, los paisajes, el clima, el itinerario", zh: "具体的美食、景点、天气、行程" } },
      { score:  1, label: { en: "The memorable moments and what you did each day", es: "Los momentos memorables y lo que hiciste cada día", zh: "印象深的时刻和每天的具体经历" } },
      { score: -1, label: { en: "How the trip changed your perspective on something", es: "Cómo el viaje cambió tu perspectiva sobre algo", zh: "这趟旅行改变了你对某件事的看法" } },
      { score: -2, label: { en: "The mood, atmosphere, and what the whole trip meant to you", es: "El ambiente y lo que significó todo el viaje para ti", zh: "整体的氛围感，以及这趟旅行对你意味着什么" } },
      { score:  1, label: { en: "The interesting people you met or talked to", es: "Las personas interesantes que conociste", zh: "遇到的有意思的人" } },
      { score: -1, label: { en: "The surprising or unexpected things that happened", es: "Las cosas sorprendentes o inesperadas que ocurrieron", zh: "发生的那些出乎意料的事" } },
    ],
  },
  {
    id: 18,
    dimension: "SN",
    scenario: {
      en: "You're mentoring a junior colleague who seems confused about their career direction.",
      es: "Estás tutorizando a un colega junior que parece confundido sobre su dirección profesional.",
      zh: "你在辅导一个对职业方向感到迷茫的新同事。",
    },
    question: {
      en: "What advice do you naturally give?",
      es: "¿Qué consejo les das de forma natural?",
      zh: "你会自然而然地给出什么建议？",
    },
    options: [
      { score:  2, label: { en: "List concrete next steps: courses, certs, projects", es: "Listas los próximos pasos concretos: cursos, certificados", zh: "列出具体步骤：考什么证、做什么项目" } },
      { score:  1, label: { en: "Share what worked for you step by step", es: "Compartes lo que te funcionó paso a paso", zh: "分享你自己一步步走过来的经历" } },
      { score: -1, label: { en: "Ask them what excites them and explore from there", es: "Les preguntas qué les emociona y exploras desde ahí", zh: "先问他们什么让自己兴奋，然后从这里展开" } },
      { score: -2, label: { en: "Talk about finding their unique strengths and long-term vision", es: "Hablas sobre encontrar sus fortalezas y visión a largo plazo", zh: "聊挖掘自身独特优势和长期愿景" } },
      { score:  1, label: { en: "Suggest they try a few things and see what sticks", es: "Sugieres que prueben varias cosas y vean qué funciona", zh: "建议多尝试，看哪条路走得顺" } },
      { score: -1, label: { en: "Encourage them to picture where they want to be in 10 years", es: "Los animas a imaginar dónde quieren estar en 10 años", zh: "鼓励他们想象自己十年后想成为什么样的人" } },
    ],
  },

  // ═══════════════ Additional T / F ════════════════════════════════════════
  {
    id: 19,
    dimension: "TF",
    scenario: {
      en: "A close friend tells you their start-up idea and asks what you think.",
      es: "Un amigo cercano te cuenta su idea de startup y te pregunta qué piensas.",
      zh: "好朋友告诉你他的创业想法，问你觉得怎么样。",
    },
    question: {
      en: "What do you say?",
      es: "¿Qué le dices?",
      zh: "你会怎么说？",
    },
    options: [
      { score:  2, label: { en: "Point out the main risks and flaws directly", es: "Señalas los principales riesgos y fallos directamente", zh: "直接指出主要风险和漏洞" } },
      { score:  1, label: { en: "Ask tough questions to help them think it through", es: "Haces preguntas difíciles para ayudarles a pensarlo bien", zh: "问一些犀利的问题，帮他们把想法想透" } },
      { score: -1, label: { en: "Acknowledge excitement first, then gently raise concerns", es: "Reconoces el entusiasmo primero, luego planteas preocupaciones con tacto", zh: "先肯定热情，再温和地提出顾虑" } },
      { score: -2, label: { en: "Focus on encouragement — they need confidence right now", es: "Te centras en el ánimo — necesitan confianza ahora mismo", zh: "以鼓励为主，他们现在需要信心" } },
      { score:  1, label: { en: "Give an honest balanced view of pros and cons", es: "Das una visión honesta y equilibrada de pros y contras", zh: "客观说优缺点，不偏不倚" } },
      { score: -1, label: { en: "Offer to help research or develop the idea together", es: "Te ofreces a investigar o desarrollar la idea juntos", zh: "主动说帮他一起调研或完善想法" } },
    ],
  },
  {
    id: 20,
    dimension: "TF",
    scenario: {
      en: "Your team completed a project but made a costly mistake nobody caught until the end.",
      es: "Tu equipo completó un proyecto pero cometió un error costoso que nadie detectó hasta el final.",
      zh: "团队完成了一个项目，但最后发现有个代价不小的失误，当时谁都没发现。",
    },
    question: {
      en: "What do you want the debrief to focus on?",
      es: "¿En qué quieres que se centre la revisión?",
      zh: "你希望复盘会议重点讨论什么？",
    },
    options: [
      { score:  2, label: { en: "Root cause analysis — what failed in the process", es: "Análisis de causas raíz — qué falló en el proceso", zh: "根本原因分析，流程哪里出问题了" } },
      { score:  1, label: { en: "Assign clear ownership and accountability", es: "Asignar responsabilidades claras", zh: "明确责任归属" } },
      { score: -1, label: { en: "Acknowledge team stress and morale before diving into fixes", es: "Reconocer el estrés del equipo antes de hablar de soluciones", zh: "先认可大家的辛苦和情绪，再讨论改进" } },
      { score: -2, label: { en: "Make sure nobody is blamed — focus on team learning", es: "Asegurarse de que nadie sea culpado — centrarse en el aprendizaje del equipo", zh: "确保没人被批评，把重点放在团队学习上" } },
      { score:  1, label: { en: "Set concrete action items to prevent this happening again", es: "Establecer acciones concretas para que no vuelva a ocurrir", zh: "制定具体行动项，防止下次重演" } },
      { score: -1, label: { en: "Celebrate what went right too — keep perspective", es: "También celebrar lo que salió bien — mantener perspectiva", zh: "同时肯定做好的地方，保持整体视角" } },
    ],
  },
  {
    id: 21,
    dimension: "TF",
    scenario: {
      en: "A friend tells you they got rejected from their dream job.",
      es: "Un amigo te dice que lo rechazaron en el trabajo de sus sueños.",
      zh: "朋友告诉你他被梦想中的工作拒了。",
    },
    question: {
      en: "What do you do first?",
      es: "¿Qué haces primero?",
      zh: "你第一反应是？",
    },
    options: [
      { score:  2, label: { en: "Ask what went wrong so you can help them prepare better next time", es: "Preguntas qué salió mal para ayudarles a prepararse mejor", zh: "问哪里出了问题，帮他们下次准备更好" } },
      { score:  1, label: { en: "Suggest practical next steps — other companies, skill gaps", es: "Sugieres próximos pasos prácticos — otras empresas, habilidades", zh: "给出实际建议，比如投其他公司、补哪些技能" } },
      { score: -1, label: { en: "Sit with them and listen before saying anything", es: "Te sientas con ellos y escuchas antes de decir nada", zh: "先陪着听，什么都不急着说" } },
      { score: -2, label: { en: "Tell them their value isn't defined by one rejection", es: "Les dices que su valor no lo define un rechazo", zh: "告诉他一次拒绝定义不了他的价值" } },
      { score:  1, label: { en: "Remind them rejection is common and share data", es: "Les recuerdas que el rechazo es común y compartes datos", zh: "告诉他被拒很正常，举一些例子" } },
      { score: -1, label: { en: "Take them out to cheer up first, talk strategy later", es: "Los llevas a animar primero, estrategia después", zh: "先带他出去散散心，之后再谈对策" } },
    ],
  },

  // ═══════════════ Additional J / P ════════════════════════════════════════
  {
    id: 22,
    dimension: "JP",
    scenario: {
      en: "You're planning a week-long trip abroad with two friends.",
      es: "Estás planeando un viaje de una semana al extranjero con dos amigos.",
      zh: "你和两个朋友要出去玩一周。",
    },
    question: {
      en: "How do you approach the planning?",
      es: "¿Cómo enfocas la planificación?",
      zh: "你怎么规划这次旅行？",
    },
    options: [
      { score:  2, label: { en: "Create a day-by-day itinerary with booked accommodations", es: "Creas un itinerario día a día con alojamientos reservados", zh: "做好每天行程，提前订好住宿" } },
      { score:  1, label: { en: "Book flights and hotels, keep daily plans loose", es: "Reservas vuelos y hoteles, planes diarios flexibles", zh: "订好机票和酒店，每天行程随意" } },
      { score: -1, label: { en: "Decide the destination, figure out the rest on arrival", es: "Decidís el destino, el resto lo calculáis al llegar", zh: "确定好目的地，到了再说" } },
      { score: -2, label: { en: "Go somewhere open-ended — let the trip lead itself", es: "Vais a un lugar abierto — dejad que el viaje se guíe solo", zh: "找个地方就去，跟着感觉走" } },
      { score:  1, label: { en: "Research must-see spots, leave some room for detours", es: "Investigas los imprescindibles, dejas espacio para desvíos", zh: "查好必去的地方，留点余地临时改变" } },
      { score: -1, label: { en: "Leave all planning to whoever wants to do it", es: "Dejas toda la planificación a quien quiera hacerla", zh: "谁愿意计划谁来，你跟着就行" } },
    ],
  },
  {
    id: 23,
    dimension: "JP",
    scenario: {
      en: "You're in the middle of a project when a more interesting opportunity comes up.",
      es: "Estás en medio de un proyecto cuando surge una oportunidad más interesante.",
      zh: "你正在做一个项目，这时出现了一个更有意思的机会。",
    },
    question: {
      en: "What do you do?",
      es: "¿Qué haces?",
      zh: "你会怎么做？",
    },
    options: [
      { score:  2, label: { en: "Finish the current project first — commitment matters", es: "Terminas el proyecto actual primero — el compromiso importa", zh: "先把手头的项目做完，答应了就要做到" } },
      { score:  1, label: { en: "Assess urgency, then decide whether to switch", es: "Evalúas la urgencia y luego decides si cambiar", zh: "先评估紧迫性，再决定要不要换" } },
      { score: -1, label: { en: "See if the new opportunity can be pursued in parallel", es: "Ves si puedes perseguir la nueva oportunidad en paralelo", zh: "看看能不能两个一起推进" } },
      { score: -2, label: { en: "Jump at the new thing — energy follows interest", es: "Te lanzas a lo nuevo — la energía sigue al interés", zh: "跟着兴趣走，新机会才是最重要的" } },
      { score:  1, label: { en: "Wrap up key deliverables on the current project, then pivot", es: "Terminas los entregables clave del proyecto actual, luego giras", zh: "先完成关键交付物，再转换方向" } },
      { score: -1, label: { en: "Discuss with others involved before deciding", es: "Consultas con los demás involucrados antes de decidir", zh: "先和其他相关的人商量再做决定" } },
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
