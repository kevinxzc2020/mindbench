import type { Lang } from "./translations";

export const INFORMATION_LINKS = [
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "cookies", href: "/cookies" },
  { key: "rights", href: "/privacy-rights" },
] as const;
export type InformationKind = (typeof INFORMATION_LINKS)[number]["key"];
export const POLICY_DRAFT_UPDATED = "2026-09-21";

export const INFORMATION_LABELS = {
  en: { about: "About", contact: "Contact", privacy: "Privacy policy", terms: "Terms of use", cookies: "Cookies", rights: "Privacy rights" },
  zh: { about: "关于我们", contact: "联系我们", privacy: "隐私政策", terms: "使用条款", cookies: "Cookie 说明", rights: "隐私权利" },
  es: { about: "Acerca de", contact: "Contacto", privacy: "Privacidad", terms: "Términos de uso", cookies: "Cookies", rights: "Derechos de privacidad" },
};

interface InformationContent {
  title: string;
  intro: string;
  sections: { title: string; paragraphs: string[] }[];
}

export const INFORMATION_CONTENT: Record<Lang, Record<InformationKind, InformationContent>> = {
  en: {
    about: {
      title: "A playground for your mind.",
      intro: "Short challenges. Curious minds. One more try.",
      sections: [
        { title: "What is MindBench?", paragraphs: ["MindBench brings reaction, memory, typing, aiming, puzzle and casual games together in your browser. Choose a game, try a difficulty and explore your own performance."] },
        { title: "Play, then compare", paragraphs: ["You can play without an account. Logging in lets you submit scores and view saved results. Leaderboards separate games and difficulty levels; generated demo entries are labelled, not presented as real player records."] },
        { title: "Beyond the scoreboard", paragraphs: ["The site also includes IQ-style questions, an MBTI-style personality activity and tarot. These activities are for entertainment and personal exploration, not clinical diagnoses or certified assessments."] },
      ],
    },
    contact: {
      title: "Let's talk.",
      intro: "A bug, a question, an idea. Start here.",
      sections: [
        { title: "Game feedback", paragraphs: ["When reporting a problem, include the game, difficulty, browser, device and steps that caused it. A screenshot can help; remove personal information first."] },
        { title: "Account & privacy", paragraphs: ["For account or data questions, use the contact address below when it is available. Never send your password, verification codes or payment details. This page has no submission form and does not send messages automatically."] },
      ],
    },
    privacy: {
      title: "Privacy policy.",
      intro: "How the current application handles account details, scores and browser storage.",
      sections: [
        { title: "Account information", paragraphs: ["Email registration stores your display name, email address and a password hash, rather than the plain-text password. These support account creation and sign-in. These fields are required for email registration, but registration is not required to play. If enabled and selected, Google sign-in provides profile details such as your name, email and image; the authentication adapter can also store provider identifiers and tokens to manage the linked account."] },
        { title: "Scores & public rankings", paragraphs: ["Submitted results are associated with your account and include the game, difficulty, score and submission time. They support saved results, statistics and rankings. Your display name, user identifier and score details can be exposed through the leaderboard and its API; do not use sensitive information as a display name."] },
        { title: "Cookies & local storage", paragraphs: ["Authentication uses cookies for sign-in, security and redirects, including a persistent login cookie. The language preference is saved in local storage under mb-lang. The Cookies page lists the current application storage and its duration. Clearing browser storage may sign you out or reset preferences; it does not delete account records on the server."] },
        { title: "Advertising", paragraphs: ["The site has an optional Google AdSense integration. Blocks labelled as layout previews are not live ads. When Google ads are enabled, Google and other advertising vendors may use cookies based on visits to this and other websites to serve ads, including personalised ads. Google's advertising settings and the industry opt-out page are linked below. Advertising-provider disclosures must be completed for the actual production setup before launch."] },
        { title: "Providers, retention & requests", paragraphs: ["Production hosting/database providers, storage locations, retention periods and the process for access, correction or deletion requests still need to be confirmed by the operator. This draft makes no unverified promises about those details. The contact page shows the public contact channel when configured."] },
        { title: "Technical records & security", paragraphs: ["The score service writes submission and error logs, which can include an account identifier and score details. Hosting and infrastructure logs need a separate production inventory. Password hashing is implemented, but this is not a security certification. Access controls, backups, log retention and incident handling still require operational review."] },
        { title: "Legal basis & international processing", paragraphs: ["The operator has not yet confirmed the applicable legal bases or transfer arrangements. These must be documented for the actual deployment, not inferred from this draft. Reading a policy or registering is not consent to advertising tracking."] },
        { title: "Children & policy changes", paragraphs: ["The intended age range and treatment of children's data have not been finalised. This version has no age-verification or parental-consent process. The operator must resolve this before inviting children to register. The date above identifies this draft revision, not a legally approved effective date. Material changes need an appropriate notice process before implementation."] },
      ],
    },
    terms: {
      title: "Terms of use.",
      intro: "A starting point for clear expectations and fair play.",
      sections: [
        { title: "Purpose of the site", paragraphs: ["MindBench offers browser games and exploratory activities. Results are game scores, not professional medical advice, a clinical diagnosis or a certified intelligence/personality assessment. Do not use them to make high-stakes decisions about yourself or others."] },
        { title: "Your account", paragraphs: ["Keep your sign-in information private and do not use someone else's account. Playing does not require registration; submitting and saving account-linked results requires signing in."] },
        { title: "Fair play", paragraphs: ["Do not submit fabricated scores, use automation to manipulate rankings, impersonate other players, interfere with the service or try to access another person's data. Labels identifying demo entries distinguish generated examples from player results."] },
        { title: "Content & third parties", paragraphs: ["Do not assume that the site's code, images or other assets may be copied or redistributed without permission. Third-party materials remain subject to their respective licences. External links and advertising destinations have their own terms and privacy practices."] },
        { title: "Scores, devices & expectations", paragraphs: ["Scores depend on the game rules and your browser, device and input conditions; they are not a controlled comparison of cognitive ability. A position in a leaderboard does not promise a prize, payment or professional qualification."] },
        { title: "Your legal rights", paragraphs: ["This draft is not intended to remove rights that applicable law does not allow you to waive. No arbitration requirement, liability cap or governing law has been selected. Final rules for age eligibility, account restriction, appeals and ending an account remain to be reviewed with the operator."] },
        { title: "Availability & unresolved details", paragraphs: ["The application is being developed; features and scoring rules may change. This draft does not promise uninterrupted access or permanent score storage. The operator identity, applicable jurisdiction, age/access rules and final legal terms need review before publication."] },
      ],
    },
    cookies: {
      title: "Cookies & browser storage.",
      intro: "What the application stores in your browser, why it is used, and what clearing it does.",
      sections: [
        { title: "Login & security cookies", paragraphs: ["MindBench's NextAuth integration uses first-party cookies. next-auth.session-token maintains sign-in, with a rolling 30-day expiry under the current configuration. next-auth.csrf-token protects authentication requests and next-auth.callback-url remembers the return destination; these have no explicit persistent expiry. Browser session restoration may keep session cookies beyond a closed window.", "When an OAuth provider uses them, next-auth.pkce.code_verifier, next-auth.state and next-auth.nonce secure the sign-in exchange, expire after 15 minutes and are cleared when consumed. HTTPS deployments add __Secure- or __Host- prefixes; large session tokens can be split into numbered cookies. These are current application defaults, not an audit of a future hosting platform."] },
        { title: "Language preference", paragraphs: ["The mb-lang local-storage entry remembers English, Chinese or Spanish when you select a language. It has no application-set expiry and remains until changed or cleared. It is a preference, separate from login security and advertising consent."] },
        { title: "Advertising storage", paragraphs: ["The labelled layout-preview banner does not load Google advertising code. Live advertising is a separate optional configuration. The actual advertising cookies, providers and lifetimes need to be inventoried before enabling it. This site has not yet implemented an advertising consent manager or a consent-withdrawal control; this page is an explanation, not a consent banner."] },
        { title: "Your browser controls", paragraphs: ["Use your browser's site-data settings to inspect, block or clear cookies and local storage for this site. Clearing login cookies can sign you out; clearing mb-lang resets your saved language. These actions do not submit a data-deletion request or erase server records. Advertising settings linked below are external controls and do not replace this site's required consent arrangements."] },
      ],
    },
    rights: {
      title: "Your privacy rights.",
      intro: "Understand your options and the current limits of the request process.",
      sections: [
        { title: "Rights that may apply", paragraphs: ["Depending on applicable law, rights may include access, correction, deletion, portability, restriction, objection, withdrawal of consent and a complaint to a regulator. Conditions and exceptions vary; not every right applies to every processing activity."] },
        { title: "Access & account requests", paragraphs: ["Signed-in players can view saved results in their statistics page. There is currently no self-service account deletion, full personal-data export or privacy-request form. Viewing this page does not create a request. A working contact channel and a verified request-handling process must be in place before public launch."] },
        { title: "Preparing a request", paragraphs: ["When a contact channel is available, describe the account and the action you want, such as a copy, correction or deletion of records. Never include a password, sign-in code or identity document in an initial message. The operator must establish proportionate identity checks and applicable response deadlines; none are invented in this draft."] },
        { title: "Advertising & browser data", paragraphs: ["The Cookies page explains browser-level controls. External ad-personalisation settings do not erase MindBench account records. Any legally required site-specific opt-out, consent withdrawal or preference-signal handling must be implemented and tested for the production ad setup; this draft is not such a mechanism."] },
      ],
    },
  },
  zh: {
    about: {
      title: "给大脑一个游乐场。",
      intro: "小小的挑战，好奇的你，再试一次。",
      sections: [
        { title: "MindBench 是什么？", paragraphs: ["MindBench 把反应、记忆、打字、瞄准、益智和休闲游戏放进浏览器。选一个游戏，试一种难度，探索自己的表现。"] },
        { title: "开玩，再比较", paragraphs: ["无需账号即可游玩。登录后可以提交成绩、查看保存的结果。排行榜按游戏和难度区分；系统生成的演示成绩会明确标注，不代表真实玩家记录。"] },
        { title: "分数之外", paragraphs: ["网站还包含 IQ 类题目、MBTI 风格的性格探索和塔罗活动。这些内容用于娱乐与自我探索，不是临床诊断或经认证的专业测评。"] },
      ],
    },
    contact: {
      title: "聊一聊。",
      intro: "一个问题，一个想法，或一次游戏中的小意外。",
      sections: [
        { title: "游戏反馈", paragraphs: ["反馈问题时，请说明游戏名称、难度、浏览器、设备和复现步骤。可以附上截图，但请先遮挡个人信息。"] },
        { title: "账号与隐私", paragraphs: ["联系渠道开放后，可通过下方邮箱咨询账号或数据问题。请勿发送密码、验证码或支付信息。本页没有提交表单，也不会自动发送消息。"] },
      ],
    },
    privacy: {
      title: "隐私政策。",
      intro: "说明当前应用如何处理账号资料、游戏成绩和浏览器存储。",
      sections: [
        { title: "账号信息", paragraphs: ["通过邮箱注册时，应用保存昵称、邮箱和密码哈希，而非明文密码，用于创建账号和登录。这些是邮箱注册的必填信息，但游玩不要求注册。如果启用并选择 Google 登录，应用会接收姓名、邮箱、头像等个人资料；认证适配器还可能存储提供方标识和令牌，以管理关联账号。"] },
        { title: "成绩与公开排行榜", paragraphs: ["提交的成绩会关联到你的账号，包含游戏、难度、分数和提交时间，用于保存结果、统计和排名。昵称、用户标识和成绩信息可能通过排行榜及其接口公开；请不要将敏感信息设为昵称。"] },
        { title: "Cookie 与本地存储", paragraphs: ["认证功能使用 Cookie 完成登录、安全校验和跳转，其中登录 Cookie 会持久保存。语言偏好通过本地存储中的 mb-lang 保存。Cookie 说明页面列出了当前应用的存储项目和期限。清除浏览器数据可能导致退出登录或偏好重置，但不会删除服务器上的账号记录。"] },
        { title: "广告", paragraphs: ["网站预留了可选的 Google AdSense 接入。标注为样板预览的广告块不是真实广告。启用 Google 广告后，Google 及其他广告供应商可能根据你访问本网站或其他网站的记录，利用 Cookie 投放广告，包括个性化广告。下方提供 Google 广告设置及行业退出页面链接。正式上线前，还需根据实际广告配置补全供应商披露。"] },
        { title: "服务商、保留期限与数据请求", paragraphs: ["正式环境的托管和数据库服务商、存储地区、数据保留期限，以及访问、更正或删除数据的处理流程，仍需运营者确认。本草案不承诺未经确认的期限或地域安排。公开联系渠道配置后会显示在联系页面。"] },
        { title: "技术记录与安全", paragraphs: ["成绩服务会记录提交和错误日志，其中可能包含账号标识和成绩信息。托管及基础设施日志需要在正式环境另行核实。应用已实现密码哈希，但这不代表安全认证；访问权限、备份、日志保留和安全事件处理仍需运营审核。"] },
        { title: "法律依据与跨境处理", paragraphs: ["运营者尚未确认适用的处理法律依据及跨境安排，需要根据实际部署补充，不能从本草案推定。阅读政策或注册账号不等于同意广告跟踪。"] },
        { title: "儿童与政策更新", paragraphs: ["目标年龄范围和儿童数据处理安排尚未定稿。当前版本没有年龄验证或监护人同意流程，运营者需在邀请儿童注册前解决这些事项。上方日期代表草案版本更新，不是经法律审核的生效日期。重大变更需要在实施前安排适当通知。"] },
      ],
    },
    terms: {
      title: "使用条款。",
      intro: "明确使用边界，也让每一次挑战更公平。",
      sections: [
        { title: "网站用途", paragraphs: ["MindBench 提供浏览器游戏和探索活动。结果是游戏成绩，不是专业医疗建议、临床诊断或经认证的智力、人格测评，请勿据此对自己或他人作出高风险决定。"] },
        { title: "账号使用", paragraphs: ["请妥善保管登录信息，不要使用他人的账号。游玩无需注册；提交并保存关联账号的成绩需要登录。"] },
        { title: "公平游玩", paragraphs: ["请勿伪造或自动化操纵排行榜成绩、冒充其他玩家、干扰网站运行，或尝试访问他人的数据。带有演示标记的条目是系统生成的示例，不是真实玩家成绩。"] },
        { title: "内容与第三方", paragraphs: ["请勿默认网站代码、图片或其他素材可在未经许可的情况下复制或再分发。第三方素材仍受各自许可约束。外部链接和广告目标网站有其各自的条款及隐私规则。"] },
        { title: "成绩、设备与预期", paragraphs: ["成绩受游戏规则、浏览器、设备和输入条件影响，不是受控条件下的认知能力比较。排行榜名次不构成获得奖品、报酬或专业资格的承诺。"] },
        { title: "你的法定权利", paragraphs: ["本草案不意图排除适用法律不允许放弃的权利。目前未选择强制仲裁条款、责任限额或管辖法律；年龄资格、账号限制、申诉和结束账号使用的正式规则仍需与运营者审核。"] },
        { title: "可用性与待确认事项", paragraphs: ["应用仍在开发，功能和计分规则可能调整。本草案不承诺服务持续无中断或成绩永久保存。运营主体、适用司法辖区、年龄及访问规则和正式法律条款需要在发布前审核确认。"] },
      ],
    },
    cookies: {
      title: "Cookie 与浏览器存储。",
      intro: "说明应用在浏览器中保存什么、为何保存，以及清除后会发生什么。",
      sections: [
        { title: "登录与安全 Cookie", paragraphs: ["MindBench 的 NextAuth 集成使用第一方 Cookie。next-auth.session-token 维持登录，当前配置的到期时间按 30 天滚动续期。next-auth.csrf-token 保护认证请求，next-auth.callback-url 保存登录后的返回地址；后两者没有设置持久化到期时间。浏览器的会话恢复功能可能在关闭窗口后继续保留会话 Cookie。", "OAuth 提供方启用相应校验时，next-auth.pkce.code_verifier、next-auth.state 和 next-auth.nonce 保护登录交换流程，15 分钟到期，使用后会被清除。HTTPS 环境会增加 __Secure- 或 __Host- 前缀，较大的登录令牌可能拆成带编号的 Cookie。这是当前应用默认配置，不代表已审计未来托管平台。"] },
        { title: "语言偏好", paragraphs: ["选择语言时，本地存储 mb-lang 会记住英文、中文或西班牙文。应用没有为它设置到期时间，修改或清除前会继续保留。它属于偏好设置，与登录安全和广告同意是不同事项。"] },
        { title: "广告相关存储", paragraphs: ["明确标注的广告位样板不会加载 Google 广告代码，真实广告属于独立的可选配置。启用前需核对实际广告 Cookie、供应商及期限。网站目前尚未实现广告同意管理器或撤回同意控件；本页是说明，不是 Cookie 同意弹窗。"] },
        { title: "浏览器中的控制方式", paragraphs: ["可在浏览器的网站数据设置中查看、阻止或清除此站点的 Cookie 和本地存储。清除登录 Cookie 可能退出账号，清除 mb-lang 会重置保存的语言。这不会提交数据删除申请，也不会清除服务器记录。下方广告设置链接属于外部控制，不能代替本站应有的同意安排。"] },
      ],
    },
    rights: {
      title: "你的隐私权利。",
      intro: "了解可用选项，以及当前请求处理流程尚未完成的部分。",
      sections: [
        { title: "可能适用的权利", paragraphs: ["依适用法律，你可能享有访问、更正、删除、可携带、限制处理、反对处理、撤回同意及向监管机构投诉等权利。具体条件和例外不同，并非每项权利都适用于每种处理活动。"] },
        { title: "查看数据与账号请求", paragraphs: ["登录后可在个人统计页查看已保存的成绩。目前没有自助删除账号、完整个人数据导出或隐私请求表单，浏览本页不会创建申请。正式公开上线前，需要配置可用联系渠道，并建立经过验证的请求处理流程。"] },
        { title: "准备请求", paragraphs: ["联系渠道开放后，可说明相关账号及希望采取的措施，例如获取副本、更正或删除记录。首次联系请勿附上密码、登录验证码或身份证件。运营者需要确定适度的身份核验方式和适用回复期限；本草案不会编造这些安排。"] },
        { title: "广告与浏览器数据", paragraphs: ["Cookie 说明页面提供浏览器层面的控制说明。外部广告个性化设置不会删除 MindBench 的账号记录。正式广告配置所需的本站退出机制、同意撤回或隐私偏好信号处理，需要另行实现并验证，本草案不具备这些功能。"] },
      ],
    },
  },
  es: {
    about: {
      title: "Un patio de juegos para tu mente.",
      intro: "Retos cortos. Mentes curiosas. Un intento más.",
      sections: [
        { title: "¿Qué es MindBench?", paragraphs: ["MindBench reúne juegos de reacción, memoria, escritura, puntería, puzles y juegos casuales en tu navegador. Elige un juego y una dificultad para explorar tu rendimiento."] },
        { title: "Juega y compara", paragraphs: ["Puedes jugar sin cuenta. Al iniciar sesión puedes enviar resultados y consultar los guardados. Las clasificaciones distinguen juegos y dificultades; los ejemplos generados se identifican como demo, no como resultados de jugadores reales."] },
        { title: "Más allá del marcador", paragraphs: ["También hay preguntas de tipo IQ, una actividad de personalidad de estilo MBTI y tarot. Son actividades de entretenimiento y exploración personal, no diagnósticos clínicos ni evaluaciones certificadas."] },
      ],
    },
    contact: {
      title: "Hablemos.",
      intro: "Un error, una pregunta o una idea. Empieza aquí.",
      sections: [
        { title: "Comentarios sobre juegos", paragraphs: ["Para comunicar un problema, indica el juego, la dificultad, el navegador, el dispositivo y los pasos para reproducirlo. Puedes adjuntar una captura, ocultando antes los datos personales."] },
        { title: "Cuenta y privacidad", paragraphs: ["Para consultas sobre tu cuenta o tus datos, utiliza el correo indicado abajo cuando esté disponible. Nunca envíes contraseñas, códigos de verificación ni datos de pago. Esta página no tiene formulario ni envía mensajes automáticamente."] },
      ],
    },
    privacy: {
      title: "Política de privacidad.",
      intro: "Cómo la aplicación actual trata los datos de cuenta, resultados y almacenamiento del navegador.",
      sections: [
        { title: "Datos de cuenta", paragraphs: ["El registro por correo guarda nombre visible, correo y un hash de la contraseña, no la contraseña en texto plano. Estos campos son necesarios para ese registro, pero no necesitas registrarte para jugar. Si se habilita y eliges Google, se reciben datos de perfil como nombre, correo e imagen; el adaptador de autenticación también puede guardar identificadores del proveedor y tokens para gestionar la cuenta vinculada."] },
        { title: "Resultados y clasificaciones públicas", paragraphs: ["Los resultados enviados se asocian a tu cuenta e incluyen juego, dificultad, puntuación y fecha. Se usan para resultados guardados, estadísticas y clasificaciones. El nombre visible, identificador de usuario y detalles del resultado pueden aparecer en la clasificación y su API. No uses información sensible como nombre."] },
        { title: "Cookies y almacenamiento local", paragraphs: ["La autenticación usa cookies para acceso, seguridad y redirecciones, incluida una cookie persistente de inicio de sesión. El idioma se guarda con la clave mb-lang. La página de Cookies describe el almacenamiento actual y sus plazos. Borrarlo puede cerrar la sesión o restablecer preferencias, pero no borra los registros del servidor."] },
        { title: "Publicidad", paragraphs: ["El sitio incluye una integración opcional de Google AdSense. Los bloques de vista previa no son anuncios reales. Cuando se habiliten los anuncios, Google y otros proveedores pueden usar cookies basadas en visitas a este y otros sitios para mostrar publicidad, incluida publicidad personalizada. Abajo hay enlaces a los ajustes publicitarios de Google y a una página de exclusión del sector. La información sobre proveedores debe completarse según la configuración de producción antes del lanzamiento."] },
        { title: "Proveedores, conservación y solicitudes", paragraphs: ["El operador debe confirmar los proveedores de alojamiento y base de datos, las ubicaciones de almacenamiento, los plazos de conservación y el procedimiento para acceder, corregir o eliminar datos. Este borrador no promete detalles sin verificar. El canal público de contacto se mostrará cuando esté configurado."] },
        { title: "Registros técnicos y seguridad", paragraphs: ["El servicio de resultados registra envíos y errores, que pueden incluir identificadores de cuenta y detalles de puntuación. Los registros del alojamiento requieren un inventario de producción. Hay hashing de contraseñas, pero esto no es una certificación de seguridad. Los accesos, copias de seguridad, conservación de registros y respuesta a incidentes necesitan revisión operativa."] },
        { title: "Base jurídica y transferencias", paragraphs: ["El operador debe confirmar las bases jurídicas y transferencias aplicables a la configuración real. No pueden inferirse de este borrador. Leer una política o registrarse no constituye consentimiento para el seguimiento publicitario."] },
        { title: "Menores y actualizaciones", paragraphs: ["La edad del público y el tratamiento de datos de menores están pendientes. No hay verificación de edad ni proceso de consentimiento parental. El operador debe resolverlo antes de invitar a menores a registrarse. La fecha indicada es la revisión del borrador, no una entrada en vigor aprobada legalmente. Los cambios importantes necesitan un proceso adecuado de aviso antes de aplicarse."] },
      ],
    },
    terms: {
      title: "Términos de uso.",
      intro: "Expectativas claras y juego limpio.",
      sections: [
        { title: "Finalidad del sitio", paragraphs: ["MindBench ofrece juegos y actividades exploratorias en el navegador. Los resultados no son asesoramiento médico, diagnósticos clínicos ni evaluaciones certificadas de inteligencia o personalidad. No los utilices para tomar decisiones de alto impacto sobre ti u otras personas."] },
        { title: "Tu cuenta", paragraphs: ["Protege tus credenciales y no utilices cuentas ajenas. Puedes jugar sin registrarte; para enviar y guardar resultados asociados a una cuenta necesitas iniciar sesión."] },
        { title: "Juego limpio", paragraphs: ["No envíes resultados inventados ni uses automatización para manipular clasificaciones. No suplantes a otros jugadores, interfieras con el servicio ni intentes acceder a datos ajenos. Las etiquetas demo identifican ejemplos generados, no resultados reales."] },
        { title: "Contenido y terceros", paragraphs: ["No presupongas que puedes copiar o redistribuir código, imágenes u otros materiales sin permiso. Los materiales de terceros mantienen sus propias licencias. Los enlaces externos y destinos publicitarios tienen sus propios términos y prácticas de privacidad."] },
        { title: "Resultados, dispositivos y expectativas", paragraphs: ["Las puntuaciones dependen de las reglas, navegador, dispositivo y condiciones de entrada; no son una comparación controlada de capacidad cognitiva. Un puesto en la clasificación no promete premios, pagos ni cualificaciones profesionales."] },
        { title: "Tus derechos legales", paragraphs: ["Este borrador no pretende excluir derechos que la ley aplicable no permita renunciar. No se ha elegido arbitraje obligatorio, límite de responsabilidad ni ley rectora. Las reglas definitivas de edad, restricción de cuentas, recursos y cierre de cuentas requieren revisión con el operador."] },
        { title: "Disponibilidad y detalles pendientes", paragraphs: ["La aplicación está en desarrollo y sus funciones o reglas pueden cambiar. Este borrador no garantiza acceso ininterrumpido ni conservación permanente de resultados. La identidad del operador, jurisdicción, reglas de edad y acceso y términos legales definitivos requieren revisión antes de publicarse."] },
      ],
    },
    cookies: {
      title: "Cookies y almacenamiento.",
      intro: "Qué guarda la aplicación en tu navegador, para qué sirve y qué ocurre al borrarlo.",
      sections: [
        { title: "Cookies de acceso y seguridad", paragraphs: ["La integración NextAuth usa cookies propias. next-auth.session-token mantiene el acceso con una caducidad renovable de 30 días en la configuración actual. next-auth.csrf-token protege la autenticación y next-auth.callback-url recuerda el destino de regreso; estas dos no tienen caducidad persistente explícita. La restauración de sesiones del navegador puede conservarlas después de cerrar una ventana.", "Cuando el proveedor OAuth utiliza estas comprobaciones, next-auth.pkce.code_verifier, next-auth.state y next-auth.nonce protegen el intercambio, caducan en 15 minutos y se borran al utilizarse. En HTTPS llevan prefijos __Secure- o __Host-; los tokens grandes pueden dividirse en cookies numeradas. Son los valores actuales de la aplicación, no una auditoría del futuro alojamiento."] },
        { title: "Preferencia de idioma", paragraphs: ["mb-lang recuerda inglés, chino o español al elegir el idioma. No tiene caducidad fijada por la aplicación y permanece hasta cambiarlo o borrarlo. Es una preferencia distinta de la seguridad del acceso y del consentimiento publicitario."] },
        { title: "Almacenamiento publicitario", paragraphs: ["El banner identificado como vista previa no carga código publicitario de Google. Los anuncios reales son una configuración opcional separada. Sus cookies, proveedores y plazos deben verificarse antes de activarlos. El sitio aún no implementa un gestor de consentimiento publicitario ni un control para retirarlo; esta página es informativa, no un banner de consentimiento."] },
        { title: "Controles del navegador", paragraphs: ["En los ajustes de datos del sitio puedes inspeccionar, bloquear o borrar cookies y almacenamiento local. Borrar cookies de acceso puede cerrar tu sesión; borrar mb-lang restablece el idioma. No se envía una solicitud de eliminación ni se borran registros del servidor. Los ajustes publicitarios enlazados abajo son externos y no sustituyen los mecanismos de consentimiento del sitio."] },
      ],
    },
    rights: {
      title: "Tus derechos de privacidad.",
      intro: "Conoce tus opciones y las limitaciones actuales del proceso de solicitudes.",
      sections: [
        { title: "Derechos que pueden corresponderte", paragraphs: ["Según la ley aplicable, puede haber derechos de acceso, rectificación, supresión, portabilidad, limitación, oposición, retirada del consentimiento y reclamación ante una autoridad. Las condiciones y excepciones varían según el tratamiento."] },
        { title: "Acceso y solicitudes sobre cuentas", paragraphs: ["Con sesión iniciada puedes consultar resultados guardados en tus estadísticas. No hay eliminación de cuentas por autoservicio, exportación completa de datos ni formulario de privacidad. Visitar esta página no crea una solicitud. Antes del lanzamiento público deben existir un canal de contacto y un procedimiento de solicitudes verificado."] },
        { title: "Preparar una solicitud", paragraphs: ["Cuando esté disponible el contacto, indica la cuenta y la acción solicitada: copia, corrección o eliminación de registros. No incluyas contraseñas, códigos de acceso ni documentos de identidad en el primer mensaje. El operador debe definir verificaciones de identidad proporcionadas y plazos de respuesta aplicables; este borrador no los inventa."] },
        { title: "Publicidad y datos del navegador", paragraphs: ["La página de Cookies explica los controles del navegador. Los ajustes externos de personalización publicitaria no borran registros de MindBench. Las opciones de exclusión, retirada del consentimiento o señales de preferencias que exija la configuración publicitaria deben implementarse y probarse. Este borrador no es ese mecanismo."] },
      ],
    },
  },
};
