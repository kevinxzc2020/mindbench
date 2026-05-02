import type { Lang } from "./translations";

// ─── Question type ───────────────────────────────────────────────────────────

export type Dimension = "EI" | "SN" | "TF" | "JP";

export interface MbtiQuestion {
  id: number;
  text: Record<Lang, string>;
  a: Record<Lang, string>; // first option  → maps to aLetter
  b: Record<Lang, string>; // second option → maps to bLetter
  dimension: Dimension;
  aLetter: "E" | "S" | "T" | "J";
  bLetter: "I" | "N" | "F" | "P";
}

// ─── 24 Questions (6 per dimension) ─────────────────────────────────────────

export const QUESTIONS: MbtiQuestion[] = [
  // ── E / I ────────────────────────────────────────────────────────────────
  {
    id: 1, dimension: "EI", aLetter: "E", bLetter: "I",
    text: {
      en: "At a social gathering, you usually…",
      es: "En una reunión social, normalmente…",
      zh: "在社交聚会上，你通常……",
    },
    a: { en: "Talk to many different people", es: "Hablas con muchas personas diferentes", zh: "和很多不同的人交谈" },
    b: { en: "Focus on a few meaningful conversations", es: "Te centras en pocas conversaciones significativas", zh: "只和少数几个人深入交流" },
  },
  {
    id: 2, dimension: "EI", aLetter: "E", bLetter: "I",
    text: {
      en: "After a tiring week, you recharge by…",
      es: "Después de una semana agotadora, te recargas…",
      zh: "结束疲惫的一周后，你倾向于……",
    },
    a: { en: "Going out with friends", es: "Saliendo con amigos", zh: "和朋友出去玩" },
    b: { en: "Spending quiet time alone", es: "Pasando tiempo tranquilo a solas", zh: "独自享受安静时光" },
  },
  {
    id: 3, dimension: "EI", aLetter: "E", bLetter: "I",
    text: {
      en: "In group discussions, you tend to…",
      es: "En debates grupales, tiendes a…",
      zh: "在小组讨论中，你更倾向于……",
    },
    a: { en: "Speak up quickly and often", es: "Hablar rápido y con frecuencia", zh: "快速而频繁地发言" },
    b: { en: "Think it through before speaking", es: "Pensar bien antes de hablar", zh: "先仔细想好再开口" },
  },
  {
    id: 4, dimension: "EI", aLetter: "E", bLetter: "I",
    text: {
      en: "You feel most energized when…",
      es: "Te sientes más lleno de energía cuando…",
      zh: "你感到最有活力的时候是……",
    },
    a: { en: "Surrounded by lots of people", es: "Estás rodeado de mucha gente", zh: "身边有很多人的时候" },
    b: { en: "Working or relaxing on your own", es: "Trabajas o descansas a solas", zh: "独自工作或放松的时候" },
  },
  {
    id: 5, dimension: "EI", aLetter: "E", bLetter: "I",
    text: {
      en: "When starting a new project, you prefer to…",
      es: "Al empezar un nuevo proyecto, prefieres…",
      zh: "开始一个新项目时，你更倾向于……",
    },
    a: { en: "Discuss it with others first", es: "Hablarlo primero con los demás", zh: "先与别人讨论" },
    b: { en: "Think it through on your own first", es: "Reflexionarlo primero tú solo", zh: "自己先独立思考" },
  },
  {
    id: 6, dimension: "EI", aLetter: "E", bLetter: "I",
    text: {
      en: "People who know you would describe you as…",
      es: "Las personas que te conocen te describirían como…",
      zh: "认识你的人会形容你是……",
    },
    a: { en: "Outgoing and expressive", es: "Extrovertido y expresivo", zh: "外向、善于表达" },
    b: { en: "Reserved and reflective", es: "Reservado y reflexivo", zh: "内敛、爱思考" },
  },

  // ── S / N ────────────────────────────────────────────────────────────────
  {
    id: 7, dimension: "SN", aLetter: "S", bLetter: "N",
    text: {
      en: "You prefer information that is…",
      es: "Prefieres información que sea…",
      zh: "你更喜欢……的信息",
    },
    a: { en: "Concrete and based on facts", es: "Concreta y basada en hechos", zh: "具体、基于事实" },
    b: { en: "Abstract and theoretical", es: "Abstracta y teórica", zh: "抽象、理论性强" },
  },
  {
    id: 8, dimension: "SN", aLetter: "S", bLetter: "N",
    text: {
      en: "When solving problems, you focus on…",
      es: "Al resolver problemas, te centras en…",
      zh: "解决问题时，你更关注……",
    },
    a: { en: "What has worked in the past", es: "Lo que ha funcionado antes", zh: "过去有效的经验" },
    b: { en: "New and creative approaches", es: "Enfoques nuevos y creativos", zh: "新颖、有创意的方法" },
  },
  {
    id: 9, dimension: "SN", aLetter: "S", bLetter: "N",
    text: {
      en: "You are more comfortable with…",
      es: "Te sientes más cómodo con…",
      zh: "你更习惯于……",
    },
    a: { en: "Familiar routines and clear procedures", es: "Rutinas conocidas y procedimientos claros", zh: "熟悉的日常和清晰的流程" },
    b: { en: "Variety, novelty, and change", es: "Variedad, novedad y cambio", zh: "多样性、新鲜感和变化" },
  },
  {
    id: 10, dimension: "SN", aLetter: "S", bLetter: "N",
    text: {
      en: "You trust more…",
      es: "Confías más en…",
      zh: "你更相信……",
    },
    a: { en: "Direct experience and proven facts", es: "La experiencia directa y los hechos probados", zh: "亲身经验和已验证的事实" },
    b: { en: "Gut feelings and future possibilities", es: "La intuición y las posibilidades futuras", zh: "直觉和对未来的想象" },
  },
  {
    id: 11, dimension: "SN", aLetter: "S", bLetter: "N",
    text: {
      en: "When reading or studying, you prefer…",
      es: "Al leer o estudiar, prefieres…",
      zh: "阅读或学习时，你更喜欢……",
    },
    a: { en: "Practical, hands-on content", es: "Contenido práctico y aplicado", zh: "实用性、操作性强的内容" },
    b: { en: "Conceptual, imaginative ideas", es: "Ideas conceptuales e imaginativas", zh: "概念性、富有想象力的内容" },
  },
  {
    id: 12, dimension: "SN", aLetter: "S", bLetter: "N",
    text: {
      en: "You naturally tend to be…",
      es: "Naturalmente tiendes a ser…",
      zh: "你天生更偏向于……",
    },
    a: { en: "Detail-oriented and observant", es: "Detallista y observador", zh: "注重细节、善于观察" },
    b: { en: "Big-picture and future-focused", es: "Visionario y orientado al futuro", zh: "着眼全局、面向未来" },
  },

  // ── T / F ────────────────────────────────────────────────────────────────
  {
    id: 13, dimension: "TF", aLetter: "T", bLetter: "F",
    text: {
      en: "When making a decision, you rely more on…",
      es: "Al tomar una decisión, te basas más en…",
      zh: "做决定时，你更依赖……",
    },
    a: { en: "Logic and objective analysis", es: "La lógica y el análisis objetivo", zh: "逻辑和客观分析" },
    b: { en: "Personal values and how people feel", es: "Los valores personales y los sentimientos", zh: "个人价值观和人们的感受" },
  },
  {
    id: 14, dimension: "TF", aLetter: "T", bLetter: "F",
    text: {
      en: "When a friend shares a problem, you first…",
      es: "Cuando un amigo comparte un problema, primero…",
      zh: "朋友向你倾诉问题时，你首先会……",
    },
    a: { en: "Help them analyze it and find solutions", es: "Le ayudas a analizarlo y encontrar soluciones", zh: "帮助他们分析问题、找到解决方案" },
    b: { en: "Listen and offer emotional support", es: "Escuchas y ofreces apoyo emocional", zh: "认真倾听并给予情感支持" },
  },
  {
    id: 15, dimension: "TF", aLetter: "T", bLetter: "F",
    text: {
      en: "In a conflict, you focus more on…",
      es: "En un conflicto, te centras más en…",
      zh: "发生冲突时，你更关注……",
    },
    a: { en: "Finding the most logical, fair solution", es: "Encontrar la solución más lógica y justa", zh: "找到最合理、最公平的解决方案" },
    b: { en: "Preserving the relationship and harmony", es: "Preservar la relación y la armonía", zh: "维护关系和谐" },
  },
  {
    id: 16, dimension: "TF", aLetter: "T", bLetter: "F",
    text: {
      en: "You believe a good decision should be…",
      es: "Crees que una buena decisión debe ser…",
      zh: "你认为好的决策应该……",
    },
    a: { en: "Rational and consistent regardless of feelings", es: "Racional y coherente, independientemente de los sentimientos", zh: "理性一致，不受情绪影响" },
    b: { en: "Compassionate and people-centered", es: "Compasiva y centrada en las personas", zh: "富有同情心、以人为本" },
  },
  {
    id: 17, dimension: "TF", aLetter: "T", bLetter: "F",
    text: {
      en: "You are more naturally…",
      es: "Eres más naturalmente…",
      zh: "你更天然地倾向于……",
    },
    a: { en: "Critical and analytical", es: "Crítico y analítico", zh: "批判性和分析性思维" },
    b: { en: "Supportive and encouraging", es: "Comprensivo y alentador", zh: "支持他人、给予鼓励" },
  },
  {
    id: 18, dimension: "TF", aLetter: "T", bLetter: "F",
    text: {
      en: "Others tend to see you as…",
      es: "Los demás tienden a verte como…",
      zh: "别人通常认为你……",
    },
    a: { en: "Direct and objective", es: "Directo y objetivo", zh: "直接、客观" },
    b: { en: "Warm and empathetic", es: "Cálido y empático", zh: "温暖、有同理心" },
  },

  // ── J / P ────────────────────────────────────────────────────────────────
  {
    id: 19, dimension: "JP", aLetter: "J", bLetter: "P",
    text: {
      en: "You prefer your daily life to be…",
      es: "Prefieres que tu vida diaria sea…",
      zh: "你倾向于日常生活……",
    },
    a: { en: "Structured with a clear plan", es: "Estructurada con un plan claro", zh: "有结构、有明确计划" },
    b: { en: "Flexible and spontaneous", es: "Flexible y espontánea", zh: "灵活随性" },
  },
  {
    id: 20, dimension: "JP", aLetter: "J", bLetter: "P",
    text: {
      en: "Deadlines make you feel…",
      es: "Los plazos de entrega te hacen sentir…",
      zh: "面对截止日期，你感到……",
    },
    a: { en: "Motivated to finish early", es: "Motivado a terminar con antelación", zh: "有动力提前完成" },
    b: { en: "Like a guideline to work toward", es: "Como una guía orientativa", zh: "只是个参考目标" },
  },
  {
    id: 21, dimension: "JP", aLetter: "J", bLetter: "P",
    text: {
      en: "Your workspace is usually…",
      es: "Tu espacio de trabajo suele ser…",
      zh: "你的工作空间通常……",
    },
    a: { en: "Organized and tidy", es: "Organizado y ordenado", zh: "整洁有序" },
    b: { en: "Relaxed and lived-in", es: "Relajado y funcional", zh: "随意自然" },
  },
  {
    id: 22, dimension: "JP", aLetter: "J", bLetter: "P",
    text: {
      en: "You prefer…",
      es: "Prefieres…",
      zh: "你更喜欢……",
    },
    a: { en: "Having things decided and settled", es: "Tener las cosas decididas y resueltas", zh: "事情确定下来、有了结论" },
    b: { en: "Keeping your options open", es: "Mantener las opciones abiertas", zh: "保持各种可能性" },
  },
  {
    id: 23, dimension: "JP", aLetter: "J", bLetter: "P",
    text: {
      en: "Before a trip or big event, you…",
      es: "Antes de un viaje o evento importante, tú…",
      zh: "出发旅行或参加重要活动前，你通常……",
    },
    a: { en: "Plan everything in detail well in advance", es: "Planificas todo con detalle y anticipación", zh: "提前详细规划好一切" },
    b: { en: "Leave plenty of room for spontaneity", es: "Dejas mucho espacio para la improvisación", zh: "留有大量随机应变的余地" },
  },
  {
    id: 24, dimension: "JP", aLetter: "J", bLetter: "P",
    text: {
      en: "When working on a project, you…",
      es: "Al trabajar en un proyecto, tú…",
      zh: "做项目时，你通常……",
    },
    a: { en: "Follow a detailed plan from start to finish", es: "Sigues un plan detallado de principio a fin", zh: "从头到尾遵循详细计划" },
    b: { en: "Adapt your approach as you discover more", es: "Adaptas tu enfoque según lo que vas descubriendo", zh: "随着了解深入不断调整方式" },
  },
];

// ─── 16 MBTI Types ───────────────────────────────────────────────────────────

export interface MbtiTypeInfo {
  type: string;
  emoji: string;
  nickname: Record<Lang, string>;
  tagline: Record<Lang, string>;
  description: Record<Lang, string>;
  strengths: Record<Lang, string[]>;
  weaknesses: Record<Lang, string[]>;
  color: string; // tailwind gradient
}

export const MBTI_TYPES: MbtiTypeInfo[] = [
  {
    type: "INTJ", emoji: "🏛️", color: "from-slate-500 to-slate-700",
    nickname: { en: "The Architect", es: "El Arquitecto", zh: "建筑师" },
    tagline: { en: "Strategic. Independent. Determined.", es: "Estratégico. Independiente. Determinado.", zh: "战略型思维，独立，意志坚定" },
    description: {
      en: "INTJs are masterful strategists with a relentless drive for improvement. They build complex systems mentally, pursue long-term goals with laser focus, and rarely accept the status quo.",
      es: "Los INTJ son estrategas magistrales con un impulso incesante de mejora. Construyen sistemas complejos mentalmente, persiguen metas a largo plazo con enfoque preciso y rara vez aceptan el statu quo.",
      zh: "INTJ 是出色的战略家，对自我提升有着强烈的渴望。他们善于在脑海中构建复杂体系，专注于长远目标，鲜少满足于现状。",
    },
    strengths: {
      en: ["Strategic thinking", "Intellectual curiosity", "High standards", "Independent"],
      es: ["Pensamiento estratégico", "Curiosidad intelectual", "Altos estándares", "Independiente"],
      zh: ["战略思维", "强烈求知欲", "高标准", "独立自主"],
    },
    weaknesses: {
      en: ["Can be arrogant", "Overly critical", "Struggles to express emotions", "Impatient with inefficiency"],
      es: ["Puede ser arrogante", "Demasiado crítico", "Dificultad para expresar emociones", "Impaciente con la ineficiencia"],
      zh: ["有时傲慢", "过于挑剔", "不善表达情感", "对低效缺乏耐心"],
    },
  },
  {
    type: "INTP", emoji: "🔬", color: "from-cyan-500 to-blue-700",
    nickname: { en: "The Logician", es: "El Lógico", zh: "逻辑学家" },
    tagline: { en: "Analytical. Creative. Curious.", es: "Analítico. Creativo. Curioso.", zh: "善于分析，富有创意，充满好奇" },
    description: {
      en: "INTPs are quiet innovators driven by an insatiable curiosity. They excel at theoretical analysis, love exploring abstract ideas, and are always searching for the underlying patterns in everything.",
      es: "Los INTP son innovadores tranquilos impulsados por una curiosidad insaciable. Destacan en el análisis teórico, disfrutan explorando ideas abstractas y siempre buscan los patrones subyacentes en todo.",
      zh: "INTP 是安静的创新者，拥有无穷的好奇心。他们擅长理论分析，热爱探索抽象概念，始终追寻万事万物背后的规律。",
    },
    strengths: {
      en: ["Brilliant analysis", "Original thinking", "Open-minded", "Objective"],
      es: ["Análisis brillante", "Pensamiento original", "Mente abierta", "Objetivo"],
      zh: ["深刻的分析力", "原创思维", "思想开放", "客观公正"],
    },
    weaknesses: {
      en: ["Absent-minded", "Insensitive", "Indecisive", "Struggles to follow through"],
      es: ["Distraído", "Insensible", "Indeciso", "Dificultad para llevar a cabo los planes"],
      zh: ["心不在焉", "不够体贴", "优柔寡断", "难以坚持到底"],
    },
  },
  {
    type: "ENTJ", emoji: "👑", color: "from-amber-500 to-red-600",
    nickname: { en: "The Commander", es: "El Comandante", zh: "指挥官" },
    tagline: { en: "Bold. Decisive. Natural leader.", es: "Audaz. Decisivo. Líder natural.", zh: "果敢，决断，天生领袖" },
    description: {
      en: "ENTJs are natural-born leaders with a talent for spotting inefficiency and redesigning it. Bold and decisive, they inspire others with their long-term vision and relentless drive to succeed.",
      es: "Los ENTJ son líderes natos con talento para detectar la ineficiencia y rediseñarla. Audaces y decididos, inspiran a otros con su visión a largo plazo y su impulso imparable hacia el éxito.",
      zh: "ENTJ 是天生的领导者，善于发现低效并加以改造。他们果敢、决断，以长远眼光和不懈的进取心激励身边的人。",
    },
    strengths: {
      en: ["Charismatic leader", "Strategic visionary", "Highly efficient", "Confident"],
      es: ["Líder carismático", "Visionario estratégico", "Muy eficiente", "Seguro de sí mismo"],
      zh: ["魅力领导力", "战略远见", "高效执行", "自信果断"],
    },
    weaknesses: {
      en: ["Impatient", "Domineering", "Cold or ruthless", "Intolerant of others' pace"],
      es: ["Impaciente", "Dominante", "Frío o implacable", "Intolerante con el ritmo de los demás"],
      zh: ["缺乏耐心", "强势主导", "有时冷酷", "对他人节奏缺乏容忍"],
    },
  },
  {
    type: "ENTP", emoji: "💡", color: "from-orange-400 to-yellow-500",
    nickname: { en: "The Debater", es: "El Debatidor", zh: "辩论家" },
    tagline: { en: "Witty. Resourceful. Loves a good argument.", es: "Ingenioso. Recursivo. Adora un buen debate.", zh: "机智，足智多谋，热爱辩论" },
    description: {
      en: "ENTPs thrive on intellectual challenges and love to play devil's advocate. They are quick thinkers who enjoy sparring with ideas, questioning assumptions, and generating bold new possibilities.",
      es: "Los ENTP prosperan ante desafíos intelectuales y les encanta hacer de abogado del diablo. Son pensadores ágiles que disfrutan debatiendo ideas, cuestionando supuestos y generando nuevas posibilidades audaces.",
      zh: "ENTP 在智识挑战中如鱼得水，热衷于扮演「唱反调者」。他们思维敏捷，享受思想交锋，善于质疑假设，不断产生大胆的新想法。",
    },
    strengths: {
      en: ["Quick-witted", "Knowledgeable", "Charismatic", "Inventive"],
      es: ["Agudo", "Erudito", "Carismático", "Inventivo"],
      zh: ["思维敏锐", "博学多才", "极具魅力", "富有创造力"],
    },
    weaknesses: {
      en: ["Argumentative", "Insensitive", "Poor follow-through", "Dislikes routine"],
      es: ["Discutidor", "Insensible", "Poca constancia", "Detesta la rutina"],
      zh: ["喜欢争论", "不够体贴", "难以善始善终", "厌恶重复"],
    },
  },
  {
    type: "INFJ", emoji: "🌿", color: "from-emerald-500 to-teal-700",
    nickname: { en: "The Advocate", es: "El Defensor", zh: "提倡者" },
    tagline: { en: "Insightful. Principled. Quietly idealistic.", es: "Perspicaz. Íntegro. Idealista en silencio.", zh: "洞察力强，坚守原则，默默理想主义" },
    description: {
      en: "INFJs are rare visionaries who combine deep empathy with a clear sense of purpose. They feel called to make the world better and often inspire others through meaningful, heartfelt action.",
      es: "Los INFJ son visionarios poco comunes que combinan una profunda empatía con un claro sentido de propósito. Se sienten llamados a mejorar el mundo e inspiran a otros con acciones significativas y sinceras.",
      zh: "INFJ 是罕见的理想主义者，将深刻的同理心与清晰的使命感融为一体。他们渴望让世界变得更好，常以真诚而有意义的行动感染身边的人。",
    },
    strengths: {
      en: ["Deep empathy", "Creative insight", "Principled", "Passionate"],
      es: ["Empatía profunda", "Perspectiva creativa", "Íntegro", "Apasionado"],
      zh: ["深刻的同理心", "创造性洞察", "坚守原则", "充满热情"],
    },
    weaknesses: {
      en: ["Perfectionist", "Burns out easily", "Private", "Can be too idealistic"],
      es: ["Perfeccionista", "Se agota fácilmente", "Reservado", "Puede ser demasiado idealista"],
      zh: ["完美主义", "容易精疲力竭", "不轻易敞开心扉", "有时过于理想化"],
    },
  },
  {
    type: "INFP", emoji: "🌙", color: "from-violet-400 to-purple-600",
    nickname: { en: "The Mediator", es: "El Mediador", zh: "调停者" },
    tagline: { en: "Empathetic. Creative. Guided by values.", es: "Empático. Creativo. Guiado por valores.", zh: "富有同理心，创意丰富，以价值观为导向" },
    description: {
      en: "INFPs are idealistic dreamers with a rich inner world. They care deeply about authenticity and meaning, and channel their creativity into causes they believe in with quiet but fierce dedication.",
      es: "Los INFP son soñadores idealistas con un rico mundo interior. Les importan profundamente la autenticidad y el significado, y canalizan su creatividad en causas en las que creen con dedicación silenciosa pero intensa.",
      zh: "INFP 是理想主义的梦想者，拥有丰富的内心世界。他们对真实与意义有深刻的追求，以低调却炽热的投入将创造力注入自己所信仰的事业中。",
    },
    strengths: {
      en: ["Deep empathy", "Open-minded", "Creative", "Passionate about values"],
      es: ["Empatía profunda", "Mente abierta", "Creativo", "Apasionado por sus valores"],
      zh: ["深刻同理心", "思想开放", "富有创意", "对价值观充满热情"],
    },
    weaknesses: {
      en: ["Overly idealistic", "Self-critical", "Impractical", "Dislikes conflict"],
      es: ["Demasiado idealista", "Autocrítico", "Poco práctico", "Evita el conflicto"],
      zh: ["过于理想化", "自我批评过度", "缺乏实际性", "回避冲突"],
    },
  },
  {
    type: "ENFJ", emoji: "🌟", color: "from-yellow-400 to-amber-600",
    nickname: { en: "The Protagonist", es: "El Protagonista", zh: "主人公" },
    tagline: { en: "Charismatic. Empathetic. Natural mentor.", es: "Carismático. Empático. Mentor natural.", zh: "魅力十足，富有同理心，天生导师" },
    description: {
      en: "ENFJs are charismatic and empathetic leaders who are genuinely invested in others' growth. They have a rare gift for understanding people deeply and inspiring them to be their best selves.",
      es: "Los ENFJ son líderes carismáticos y empáticos genuinamente comprometidos con el crecimiento de los demás. Tienen el don extraordinario de comprender a las personas profundamente e inspirarlas a ser lo mejor de sí mismas.",
      zh: "ENFJ 是充满魅力、富有同理心的领导者，真心致力于他人的成长。他们拥有深刻理解他人、激发他人潜能的罕见天赋。",
    },
    strengths: {
      en: ["Natural leader", "Empathetic", "Reliable", "Inspiring communicator"],
      es: ["Líder natural", "Empático", "Confiable", "Comunicador inspirador"],
      zh: ["天生领导力", "感同身受", "值得信赖", "富有感召力的沟通者"],
    },
    weaknesses: {
      en: ["Overly idealistic", "Condescending", "Intense", "Too selfless"],
      es: ["Demasiado idealista", "Condescendiente", "Intenso", "Demasiado altruista"],
      zh: ["过于理想化", "有时显得说教", "情感投入过深", "忽视自身需求"],
    },
  },
  {
    type: "ENFP", emoji: "🎨", color: "from-pink-400 to-rose-500",
    nickname: { en: "The Campaigner", es: "El Activista", zh: "竞选者" },
    tagline: { en: "Enthusiastic. Creative. Free spirit.", es: "Entusiasta. Creativo. Espíritu libre.", zh: "热情洋溢，富有创意，自由灵魂" },
    description: {
      en: "ENFPs are enthusiastic and imaginative free spirits who see life as full of exciting possibilities. Their energy and warmth draw people in, and they inspire others with their boundless creativity and optimism.",
      es: "Los ENFP son espíritus libres entusiastas e imaginativos que ven la vida llena de posibilidades emocionantes. Su energía y calidez atraen a la gente, e inspiran a otros con su creatividad y optimismo sin límites.",
      zh: "ENFP 是充满热情和想象力的自由灵魂，将生活视为充满精彩可能的旅途。他们的活力与温暖感染身边的人，以无尽的创意和乐观激励着他人。",
    },
    strengths: {
      en: ["Curious and energetic", "Observant", "Excellent communicator", "Knows how to relax"],
      es: ["Curioso y enérgico", "Observador", "Excelente comunicador", "Sabe relajarse"],
      zh: ["好奇心旺盛、充满活力", "善于观察", "出色的沟通者", "懂得放松"],
    },
    weaknesses: {
      en: ["Poor focus", "Overthinks", "Gets stressed easily", "Highly emotional"],
      es: ["Falta de concentración", "Piensa demasiado", "Se estresa con facilidad", "Muy emocional"],
      zh: ["注意力不集中", "想太多", "容易焦虑", "情绪波动较大"],
    },
  },
  {
    type: "ISTJ", emoji: "📋", color: "from-stone-500 to-gray-700",
    nickname: { en: "The Inspector", es: "El Inspector", zh: "检查员" },
    tagline: { en: "Responsible. Thorough. Dependable.", es: "Responsable. Minucioso. Confiable.", zh: "责任心强，做事周全，值得依赖" },
    description: {
      en: "ISTJs are meticulous, dependable pillars of any organization. They value duty, tradition, and doing things right, and their steady reliability makes them indispensable in any team or community.",
      es: "Los ISTJ son pilares meticulosos y confiables de cualquier organización. Valoran el deber, la tradición y hacer las cosas bien, y su fiabilidad constante los hace indispensables en cualquier equipo o comunidad.",
      zh: "ISTJ 是任何组织中一丝不苟、值得信赖的支柱。他们重视责任、传统和做事的严谨态度，稳定的可靠性使他们在任何团队或群体中都不可或缺。",
    },
    strengths: {
      en: ["Honest", "Responsible", "Highly practical", "Strong-willed"],
      es: ["Honesto", "Responsable", "Muy práctico", "Fuerte de carácter"],
      zh: ["诚实坦率", "责任心强", "极为务实", "意志坚定"],
    },
    weaknesses: {
      en: ["Stubborn", "Insensitive", "Always by the book", "Resistant to change"],
      es: ["Terco", "Insensible", "Siempre por las reglas", "Resistente al cambio"],
      zh: ["固执", "不够体贴", "墨守成规", "抗拒变化"],
    },
  },
  {
    type: "ISFJ", emoji: "🛡️", color: "from-sky-400 to-blue-600",
    nickname: { en: "The Defender", es: "El Defensor", zh: "守护者" },
    tagline: { en: "Warm. Protective. Quietly dedicated.", es: "Cálido. Protector. Dedicado en silencio.", zh: "温暖体贴，保护性强，默默付出" },
    description: {
      en: "ISFJs are warm and dedicated protectors who find meaning in caring for others. Remarkably perceptive about people's needs, they combine practical skills with a genuine desire to make those around them happy.",
      es: "Los ISFJ son protectores cálidos y dedicados que encuentran significado en cuidar a los demás. Sorprendentemente perceptivos ante las necesidades ajenas, combinan habilidades prácticas con un deseo genuino de hacer felices a quienes les rodean.",
      zh: "ISFJ 是温暖而尽心尽力的守护者，在关爱他人中寻找意义。他们对他人需求有着超强的感知力，将实际能力与真心让身边人幸福的愿望完美结合。",
    },
    strengths: {
      en: ["Supportive", "Reliable", "Patient", "Imaginative and observant"],
      es: ["Solidario", "Confiable", "Paciente", "Imaginativo y observador"],
      zh: ["乐于支持他人", "可靠", "有耐心", "富有想象力且善于观察"],
    },
    weaknesses: {
      en: ["Overloads themselves", "Shy", "Too altruistic", "Resistant to change"],
      es: ["Se sobrecarga", "Tímido", "Demasiado altruista", "Resistente al cambio"],
      zh: ["容易承担过多", "内敛腼腆", "过于无私", "抗拒改变"],
    },
  },
  {
    type: "ESTJ", emoji: "⚖️", color: "from-blue-500 to-indigo-700",
    nickname: { en: "The Executive", es: "El Ejecutivo", zh: "总经理" },
    tagline: { en: "Organized. Decisive. Upholds order.", es: "Organizado. Decisivo. Mantiene el orden.", zh: "组织有序，果断决策，维护秩序" },
    description: {
      en: "ESTJs are natural administrators who excel at managing people and processes. They believe in clear rules and hard work, and dedicate themselves to maintaining community and structure with admirable consistency.",
      es: "Los ESTJ son administradores naturales que destacan gestionando personas y procesos. Creen en las reglas claras y el trabajo duro, y se dedican a mantener la comunidad y la estructura con admirable coherencia.",
      zh: "ESTJ 是天生的管理者，擅长管理人员和流程。他们信奉清晰的规则和踏实的工作，以令人钦佩的一贯性致力于维护集体和秩序。",
    },
    strengths: {
      en: ["Dedicated", "Strong-willed", "Direct", "Loyal"],
      es: ["Dedicado", "Fuerte de carácter", "Directo", "Leal"],
      zh: ["专注投入", "意志坚定", "直接坦率", "忠诚"],
    },
    weaknesses: {
      en: ["Inflexible", "Uncomfortable with unconventional situations", "Judgmental", "Too focused on status"],
      es: ["Inflexible", "Incómodo ante situaciones no convencionales", "Crítico", "Demasiado enfocado en el estatus"],
      zh: ["缺乏弹性", "对非常规情况感到不适", "易于评判他人", "过于在意地位"],
    },
  },
  {
    type: "ESFJ", emoji: "🤝", color: "from-lime-400 to-green-600",
    nickname: { en: "The Consul", es: "El Cónsul", zh: "执政官" },
    tagline: { en: "Caring. Social. Loyal to the group.", es: "Afectuoso. Sociable. Leal al grupo.", zh: "关爱他人，善于社交，对集体忠诚" },
    description: {
      en: "ESFJs are warm social butterflies who thrive when helping others. They are deeply attuned to the feelings of those around them and work tirelessly to create a stable, caring environment for everyone.",
      es: "Los ESFJ son mariposas sociales cálidas que prosperan ayudando a los demás. Están muy sintonizados con los sentimientos de quienes les rodean y trabajan incansablemente para crear un entorno estable y afectuoso para todos.",
      zh: "ESFJ 是热情的社交达人，在帮助他人中如鱼得水。他们对周围人的感受高度敏感，孜孜不倦地为每个人营造一个稳定而温暖的环境。",
    },
    strengths: {
      en: ["Strong sense of duty", "Warm and caring", "Loyal", "Practical"],
      es: ["Gran sentido del deber", "Cálido y afectuoso", "Leal", "Práctico"],
      zh: ["责任感强", "温暖体贴", "忠诚", "务实"],
    },
    weaknesses: {
      en: ["Needy for validation", "Inflexible", "Vulnerable to criticism", "Selfless to a fault"],
      es: ["Necesita validación", "Inflexible", "Vulnerable a la crítica", "Demasiado altruista"],
      zh: ["渴望被认可", "缺乏弹性", "对批评敏感", "无私过度"],
    },
  },
  {
    type: "ISTP", emoji: "🔧", color: "from-gray-400 to-zinc-600",
    nickname: { en: "The Craftsman", es: "El Artesano", zh: "鉴赏家" },
    tagline: { en: "Bold. Practical. Masters of tools.", es: "Audaz. Práctico. Maestro de herramientas.", zh: "果敢，务实，工具大师" },
    description: {
      en: "ISTPs are cool, analytical observers who love to figure out how things work. Highly practical and direct, they shine in a crisis and trust their own hands-on judgment above all else.",
      es: "Los ISTP son observadores tranquilos y analíticos a quienes les encanta descubrir cómo funcionan las cosas. Muy prácticos y directos, brillan en una crisis y confían en su propio juicio práctico por encima de todo.",
      zh: "ISTP 是冷静、善于分析的观察者，热衷于探究事物的运作原理。他们高度务实而直接，在危机中表现出色，最信任自己亲身实践得来的判断。",
    },
    strengths: {
      en: ["Optimistic", "Creative", "Practical", "Calm under pressure"],
      es: ["Optimista", "Creativo", "Práctico", "Tranquilo bajo presión"],
      zh: ["乐观", "富有创造力", "务实", "临危不乱"],
    },
    weaknesses: {
      en: ["Stubborn", "Insensitive", "Private", "Easily bored"],
      es: ["Terco", "Insensible", "Reservado", "Se aburre con facilidad"],
      zh: ["固执", "不够体贴", "内敛", "容易感到无聊"],
    },
  },
  {
    type: "ISFP", emoji: "🎸", color: "from-fuchsia-400 to-pink-600",
    nickname: { en: "The Adventurer", es: "El Aventurero", zh: "探险家" },
    tagline: { en: "Gentle. Sensitive. Lives in the moment.", es: "Gentil. Sensible. Vive el momento.", zh: "温柔，敏感，活在当下" },
    description: {
      en: "ISFPs are gentle free spirits with a deep appreciation for beauty and the present moment. They live by their values, express themselves through creativity, and resist being boxed into categories.",
      es: "Los ISFP son espíritus libres gentiles con una profunda apreciación por la belleza y el momento presente. Viven según sus valores, se expresan a través de la creatividad y se resisten a ser encasillados.",
      zh: "ISFP 是温柔的自由灵魂，对美和当下有着深刻的感受力。他们以价值观为指引，通过创作表达自我，抗拒被任何标签束缚。",
    },
    strengths: {
      en: ["Charming", "Sensitive to others", "Imaginative", "Passionate"],
      es: ["Encantador", "Sensible con los demás", "Imaginativo", "Apasionado"],
      zh: ["魅力十足", "对他人敏感", "富有想象力", "充满激情"],
    },
    weaknesses: {
      en: ["Unpredictable", "Easily stressed", "Overly competitive", "Fluctuating self-esteem"],
      es: ["Impredecible", "Se estresa fácilmente", "Demasiado competitivo", "Autoestima fluctuante"],
      zh: ["难以捉摸", "容易焦虑", "有时过于好胜", "自尊心起伏不定"],
    },
  },
  {
    type: "ESTP", emoji: "⚡", color: "from-red-400 to-orange-600",
    nickname: { en: "The Entrepreneur", es: "El Emprendedor", zh: "企业家" },
    tagline: { en: "Energetic. Perceptive. Action-first.", es: "Enérgico. Perceptivo. Acción primero.", zh: "精力充沛，洞察力强，先行动后思考" },
    description: {
      en: "ESTPs are fast-moving, bold risk-takers who live in the moment. They have a talent for reading situations and people instantly, and they love the thrill of jumping straight into action.",
      es: "Los ESTP son tomadores de riesgos audaces y de movimiento rápido que viven el momento. Tienen talento para leer situaciones y personas al instante, y adoran la emoción de pasar directamente a la acción.",
      zh: "ESTP 是快节奏、大胆的冒险者，活在当下。他们天生善于迅速读懂局势和人心，热爱直接行动带来的刺激感。",
    },
    strengths: {
      en: ["Bold", "Rational", "Original", "Perceptive"],
      es: ["Audaz", "Racional", "Original", "Perspicaz"],
      zh: ["大胆无畏", "理性务实", "独具一格", "洞察力强"],
    },
    weaknesses: {
      en: ["Impatient", "Risky", "Unstructured", "May miss the big picture"],
      es: ["Impaciente", "Arriesgado", "Sin estructura", "Puede perder el panorama general"],
      zh: ["缺乏耐心", "冒险倾向", "缺少规划", "容易忽略大局"],
    },
  },
  {
    type: "ESFP", emoji: "🎭", color: "from-rose-400 to-fuchsia-600",
    nickname: { en: "The Entertainer", es: "El Animador", zh: "表演者" },
    tagline: { en: "Spontaneous. Fun. Lights up any room.", es: "Espontáneo. Divertido. Ilumina cualquier sala.", zh: "自发行动，充满乐趣，走到哪里哪里亮" },
    description: {
      en: "ESFPs are vivacious entertainers who love being the center of attention. With infectious enthusiasm and a gift for making others feel included, they turn even mundane moments into memorable experiences.",
      es: "Los ESFP son animadores vivaces a quienes les encanta ser el centro de atención. Con un entusiasmo contagioso y el don de hacer que los demás se sientan incluidos, convierten incluso los momentos mundanos en experiencias memorables.",
      zh: "ESFP 是充满活力的表演者，热爱成为关注的焦点。他们以极具感染力的热情和让每个人都备受关注的天赋，将哪怕最平淡的时刻变成令人难忘的体验。",
    },
    strengths: {
      en: ["Bold", "Original", "Aesthetic", "Practical"],
      es: ["Audaz", "Original", "Estético", "Práctico"],
      zh: ["大胆", "独特", "审美出众", "务实"],
    },
    weaknesses: {
      en: ["Easily bored", "Poor long-term focus", "Sensitive to conflict", "Fiercely independent"],
      es: ["Se aburre fácilmente", "Poca concentración a largo plazo", "Sensible al conflicto", "Fieramente independiente"],
      zh: ["容易厌倦", "长期专注力差", "对冲突敏感", "强烈的独立意识"],
    },
  },
];

// ─── Score calculator ────────────────────────────────────────────────────────

export function calculateMbtiType(answers: Record<number, "a" | "b">): string {
  const scores: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (!answer) continue;
    if (answer === "a") scores[q.aLetter]++;
    else scores[q.bLetter]++;
  }

  const e = scores.E >= scores.I ? "E" : "I";
  const s = scores.S >= scores.N ? "S" : "N";
  const t = scores.T >= scores.F ? "T" : "F";
  const j = scores.J >= scores.P ? "J" : "P";

  return `${e}${s}${t}${j}`;
}
