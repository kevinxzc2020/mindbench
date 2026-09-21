# MindBench — 非蓝色视觉改版

后续动效补充及其独立验证范围见 [MOTION.md](./MOTION.md)；下面保留静态改版阶段的记录。

日期：2026-09-21。设计决策记录，不是流量或盈利预测。

## 五轮收敛
1. **拆解参考**：阅读用户提供的 Nightkidz 首页 HTML、字体 CSS、全局 CSS、图片与滑动字标 CSS，并浏览 https://www.nightkidz.shop/us （查阅日期：2026-09-21；页面未标明发布时间）。提取满幅影像、超大字、直角图片网格、细分隔线。没有复制其商标、产品图片或脚本。
2. **玩法适配**：电商产品网格转换为游戏目录；保留来自 src/lib/utils.ts 的全部 14 个可见游戏和三个探索入口。原有隐藏游戏保持隐藏。去掉无功能滚动词条，主按钮直达反应测试，不设置入场加载门。
3. **视觉定稿**：设计选色为墨黑 #111110、米白 #f0eee7、朱红 #ff593e；这些是本项目设计参数，不是引用数据。旧全站蓝色背景不再挂载，旧 CSS 变量通过兼容别名切换主题，游戏语义红绿提示仍保留。
4. **实现与用户修正**：新首页使用三列/两列响应式玩法卡片。用户明确要求完整 MindBench Logo，因此弃用先生成的 M 图标，采用完整 MINDBENCH 金属字标。导航、登录/注册品牌图、页面图标采用新字标。原图保留未覆盖。游戏封面是轻量代码绘制的玩法示意，不是生成图片或真实玩家成绩。
5. **验收与调整**：TypeScript 检查通过；桌面和手机检查了图片、布局和中英西语言。筛选得到 14 / 8 / 3 / 3 张卡片，三个额外入口始终保留。补齐手机导航登录/注册/退出入口。反应测试完成了开始→等待→绿色→单次结果的 UI 冒烟测试；测试未登录，未提交排名成绩。进一步验收见本次任务最终说明。

## 素材交付
生成方式：内置 imagegen 工具，不使用付费 CLI/API 回退。工具接口未提供可独立核验的底层模型版本标识，不据此声称具体模型版本。

- public/brand/mindbench-wordmark-v2.png — 完整 MINDBENCH 字标，透明 PNG；用于 Header、登录/注册及站点图标。
- public/images/arcade-still-life-v2.png — 反应按钮、记忆方格、靶盘主题主图。
- 原有 mindbench-logo.png 和 cognitive-training.png 保留；先生成的单字母 M 草稿不接入项目。

## 最终 Logo 提示词
Use case: logo-brand. Asset type: finished primary brand logo wordmark for MINDBENCH, a cognitive games arcade. IMPORTANT: the logo must spell the COMPLETE name "MINDBENCH", exactly M I N D B E N C H, all nine letters clearly legible as one complete custom wordmark. NOT a standalone M, NOT an MB monogram. Design an original striking motorsport-meets-arcade typographic logo: bold condensed forward-leaning bespoke uppercase lettering, deliberate sharp cuts in a few letter terminals, confident tight but legible spacing, balanced horizontal silhouette. Subtle physically realistic 3D extrusion and broad chamfered bevels, polished silver and warm ivory chrome face with charcoal sidewalls, restrained vermilion red in one lower edge detail. Dynamic and collectible like a premium arcade-machine metal badge. Nearly straight-on view so the complete brand name is readable at 180px wide. Transparent background with true alpha, isolated complete wordmark with generous clear margins, no ground plane. Wide landscape 3:1 canvas. No blue/cyan/purple, no brain anatomy, no icon alongside, no tagline, no extra letters, no tiny intricate decoration, no busy reflections, no watermark, no presentation mockup.

## 最终主图提示词
Use case: stylized-concept. Asset type: wide photographic editorial hero for MindBench cognitive-games website. A striking close-up still-life of a physical arcade cognitive testing kit, on a matte near-black studio tabletop. Three recognizable objects: a large sculptural circular reaction push-button in vivid vermilion red enamel and brushed aluminum housing in foreground right, a square nine-tile memory board with exactly 3 rows and 3 columns in satin ivory and graphite, and a standing brushed-chrome concentric target behind. Tactile real manufactured materials, beautiful hard flash lighting, slight film grain, dramatic deep shadows, high-end underground arcade magazine aesthetic, not a futuristic SaaS illustration. Wide 2:1 framing. Objects arranged mostly on right half because website heading and playable call-to-action will overlay left; left half very dark subtly textured negative space; keep recognisable objects fully inside middle-right safe area. Restricted palette: black, charcoal, warm white, silver, vermilion red. No blue, cyan, purple, text, digits, brand names, logos, UI overlays, invented scores, brain, people, floating debris, neon glows, watermark.

## 最后一轮验收补充
- 1440×1000 桌面、390×844 手机及 320×800 窄屏已查看实际渲染；手机西班牙语长标题不横向溢出，320px 筛选改为两列。
- 认知、解谜、休闲、全部筛选的可见卡片数量均与原目录匹配；切换分类不会移除三个探索入口。
- Make Seven 选择难度后可以移动方块并更新本局分数；排行榜成功加载且切换到 Number Memory。
- 语言切换同步 HTML lang，保留键盘焦点提示；静态卡片不依赖进场动画，减少动态效果偏好关闭装饰过渡。
- 浏览器记录中存在创建组件前的一次热更新缺失模块报错；GameCover 创建完成后 TypeScript 和实际目录渲染通过，不是当前缺失文件。

## 验收范围与限制
- 不改变游戏计时、胜负规则、成绩保存、认证和 AdSense 请求逻辑。
- AdSense 仍沿用原来的预览/关闭/启用配置；本地显示的是占位预览，没有真实广告或收益。
- 未执行发布、git commit 或 git push。
- 未执行新的生产构建；以 TypeScript、开发服务器浏览器验证、git diff --check 验证本次改版。
