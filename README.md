# MindBench 🧠

> 测试你的大脑极限 — 认知能力测试 + 性格测试 + 占卜小工具的综合平台

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) + TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | PostgreSQL (Neon 云端) via Prisma ORM |
| 认证 | NextAuth.js (邮箱 + 密码) |
| 国际化 | 自建 `language-context` （en / zh / es） |

## 功能一览

### 🗂️ 游戏分类（首页按 category 分区展示）

| 分类 | 简介 |
|---|---|
| 🧠 **认知测试 (cognitive)** | Human Benchmark 风的脑力测验 |
| ⚔️ **MOBA 衍生 (moba)** | LoL 玩法启发的技能训练 |
| 🍡 **休闲小游戏 (casual)** | 三消等放松小游戏（受羊了个羊 / 抓大鹅启发）|
| 🔮 **性格 & 玄学** | MBTI / 塔罗 / 今日运势（独立路径，不在 GAMES 注册表） |

### 🎮 游戏列表（13 个，黑洞除外都支持难度分级）

所有游戏（CPS Test 除外）都有四档难度：🟢 Easy / 🔵 Medium / 🟠 Hard / 🔥 Hell，**每档独立排行榜**。

**基础 7 个：**

| 游戏 | 类型 | 计分 | 难度差异点 |
|------|------|------|-----------|
| ⚡ Reaction Time | 反应速度 | 5 次平均 ms（越低越好）| 颜色干扰（黄红假闪）+ Hell 模式绿色会变红 |
| 🔢 Number Memory | 数字记忆 | 通过关卡数 | 显示时长 + 输入倒计时（Hell 输入只有 0.5s/位）|
| 🧩 Sequence Memory | 序列记忆 | 通过关卡数 | 网格大小 + 闪烁节奏 |
| 👁️ Visual Memory | 视觉记忆 | 通过关卡数 | 起始格子数 + 网格大小 + 可容错次数 |
| 🎯 Aim Trainer | 瞄准训练 | 命中数 | 靶大小 + Medium/Hell 的自动消失计时环 |
| 🖱️ CPS Test | 点击速度 | 每秒点击数 | 无难度分级（5/10/15 秒纯速度测试）|
| ⌨️ Typing Test | 打字速度 | WPM | **内容本身分级** —— 从日常短句到 SQL/密码样式 |

**MOBA 风格 3 个**（灵感来自 PC MOBA 如英雄联盟）：

| 游戏 | 类型 | 计分 | 难度差异点 |
|------|------|------|-----------|
| 🗡️ Last-Hit Timing | 补刀计时（LoL 式）| 击杀数 / 总波数 | **真实 LoL 模型**：盟军箭手离散伤害小兵，你有自己的 ATK 值，击杀窗口 = HP ≤ 你的 ATK；弹道飞行时间期间盟军可能抢尸。Hell 加防御塔（固定间隔 50 伤害） |
| ✨ Skill Shot | 技能预判 | N / 15 命中数 | 目标运动模式（直线→Z 字→正弦波→随机）+ 飞行时间 + 容差 |
| ⚡ Combo Attempt | 连招尝试 | 通过连招长度 | 按键池（Q/W → QWE → QWER → QWERA）+ 节奏 + 输入倒计时 |

所有 MOBA 游戏支持**键盘输入**（LoL 式 Q/W/E/R/A 键位 + 补刀用 Space）以及鼠标点击。

**休闲小游戏（casual）—— 受微信小游戏启发：**

| 游戏 | 类型 | 计分 | 难度差异点 |
|------|------|------|-----------|
| 🦢 Goose Grab (抓大鹅) | **3D 物理三消**（基于 Rapier）| 通过的关卡数 | 图案种类 + 牌总数 + 堆叠层数 + 锁牌数 + 槽位（Hell 缩到 6）+ **摇晃次数**（Easy 5 → Hell 1）|
| 🕳️ Black Hole (黑洞大作战) | Hole.io **3D 单人版** | 最终质量 (kg) | **不分难度**，一个 90s 畅玩模式 |

休闲游戏额外细节：
- **Goose Grab** 升级为 **3D 物理版**：
  - R3F + Rapier 物理引擎，食物模型自然堆叠在透明容器里
  - 8 种 GLB 食物模型（XOIAL 在 Sketchfab 的免费 Low Poly Food Pack —— ice-cream / cookie-man / cheese / hotdog / sandwich / sandwich-toast / pancake / toast）
  - 点击食物 → GSAP 弹到底部卡槽 → 3 同自动消除
  - 摇一摇 = 重置物理场景，物体重新落下
  - 借鉴自 [goose-catch 开源 sample](https://github.com/goose-catch)（用户提供）
- **Black Hole 双引擎模式** 🎨（**当前激活：Three.js**）：
  - **当前默认走 Three.js**（`page.tsx` 的 `USE_GODOT = false`）—— 视觉丰富度远超开源 Godot Hole.io 模板（4 球+4 方块+灰地面），且无需用户等 36MB wasm 加载
  - **可切回 Godot 版**：把 `USE_GODOT` 改成 `true`，并确保 `public/godot-hole/index.html` 存在。Godot 版的优势是真 CSG 挖洞 + warp 扭曲 shader（视觉上确实"穿过"地面）；劣势是模板很简陋且 wasm 巨大
  - Godot 项目源码留在仓库根 `Hole.io/`（Godot 4.6.2，主场景 `res://Scenes/test_scene.tscn`）。重新导出：编辑器里 `Project → Export → Web (Runnable) → Export Project`，路径填 `mindbench/public/godot-hole/index.html`，**Threads Support 必须关**
- **Black Hole 模型池** 🎨：扔 GLB 到 `public/models/black-hole/tier_X/` 并在 `manifest.json` 登记 → 游戏自动用上。每个实例还会随机：缩放 ±15% / Y 轴旋转 / X 轴翻转 / **色调微偏移**（material override），让一个模型出 N 种"看起来不同"的实例。manifest 为空时**自动 fallback** 到内置几何体形状。
- **Black Hole** 用 **R3F (Three.js) 3D 渲染**：
  - **9 种形状物体**（不是 box），按 tier 分布：
    - tier 0：灌木 / 树（双层圆锥）/ 消防栓
    - tier 1：小汽车（车身 + 车顶 + 4 轮 + 玻璃）/ 红色电话亭
    - tier 2：小屋（带屋顶 + 窗户 + 门）/ 商店（带招牌 + 大窗）
    - tier 3：摩天楼（带避雷针 + 黄色窗光）/ 电视塔（多段渐细 + 顶部金球）
  - 每个物体有 **shadow casting**、自然旋转 + 尺寸抖动；总共 70 个散在 80×80 世界
  - 黑洞：**3 层渲染** —— 黑色圆盘 + 紫色旋转环 + 反向旋转的青色外环（事件视界感）
  - 摄像机俯视并跟随黑洞中心，黑洞越大视野越拉远
  - 楼被吃 → **700ms** 沿黑洞方向移动 + 倒下 + 缩小 + 沉入地下 → 替换

### 🧬 MBTI 人格测试

12 个**场景化多选题**，不再是抽象的 A/B 二选一。例如：
> "你第一次参加公司部门聚餐，桌上大多数人你不熟。"
> - A) 主动找人聊天，介绍自己
> - B) 先观察一下，找熟人旁边坐下再说
> - C) 等别人主动跟你聊
> - D) 专注吃饭，偶尔点头接话

每个选项带权重，4 维度累加 → 16 种人格类型 + 详细解读。

### 🔮 塔罗牌三牌阵

22 张大阿尔卡那（Major Arcana），**过去 / 现在 / 未来**三牌阵。每张 50/50 正逆位，带关键词和简短解读。

### 📊 我的数据（Stats）

登录后可见的个人统计页 (`/stats`)：

- **顶部汇总**：总测试次数、参与游戏数、活跃天数、首次开始日期
- **每个游戏一张卡**：展示最近 30 次得分的**迷你进度曲线**（SVG 绘制，点颜色按难度区分；"上 = 更好"无论游戏方向），以及四档难度各自的最佳成绩和尝试次数
- **最近记录列表**：最近 20 次测试的时间线，相对时间（刚刚 / 3 小时前 / 2 天前）

### 🏆 排行榜（公开访问 + 150 个合成对手）

`/leaderboard` 不需要登录就能浏览。即使数据库里一个真实分都没有，榜单也始终热闹 —— 我们在 `lib/leaderboard-fixtures.ts` 里 hard-code 了 **150 个合成用户**（中英西三语昵称 + 国旗 emoji 头像 + 给每人一个 0..1 综合 skill 和 1~2 个 specialty 游戏）。

每次 `GET /api/scores` 时：
1. 拉真实数据库分数（每用户每难度取最佳）
2. 用确定性 hash 给每个合成用户算出他在当前 (game × difficulty) 下的分数
3. 真假合并 → 按游戏的 `lowerIsBetter` 排序 → 切前 N 条返回

合成分数对每个用户在每个游戏上稳定不变（hash 种子 = userId + game + difficulty），但分布合理 —— 反应时间从 165ms（顶尖）到 480ms（新手），WPM 从 32 到 118。难度档对分数有修正（easy 比 hell 容易出高分）。真实玩家分数高就自然冒到合成用户上面。

数据库连不上也不影响排行榜可见 —— 拉真实数据失败时只展示合成榜单（不会白屏）。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 建 .env 文件（DATABASE_URL / NEXTAUTH_SECRET / NEXTAUTH_URL）
#    详见 SETUP.md

# 3. 同步 schema 到数据库
npx prisma db push

# 4. （可选）填充演示分数
npm run db:seed

# 5. 启动
npm run dev
```

打开 http://localhost:3000

> ⚠️ `.env` 不进 git，首次 clone 或换电脑时需要手动创建。参考 `SETUP.md`。

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                    # NextAuth + 注册接口
│   │   ├── scores/                  # 成绩提交 & 按难度过滤的排行榜 & 个人记录
│   │   └── stats/me/                # 个人统计数据聚合接口
│   ├── games/                       # 10 个游戏页面
│   │   ├── reaction-time/
│   │   ├── number-memory/
│   │   ├── sequence-memory/
│   │   ├── visual-memory/
│   │   ├── aim-trainer/
│   │   ├── cps-test/
│   │   ├── typing-test/
│   │   ├── last-hit/                # MOBA 补刀计时
│   │   ├── skill-shot/              # MOBA 技能预判
│   │   ├── combo/                   # MOBA 连招输入
│   │   ├── goose-grab/              # 抓大鹅 (R3F + Rapier 物理 3D 版)
│   │   │   ├── page.tsx             # GameWrapper + HUD + idle/done
│   │   │   └── GooseGrabScene.tsx   # 3D 场景 + 物理 + 8 GLB 食物
│   │   └── black-hole/              # 黑洞大作战 (R3F 3D，无难度，畅玩)
│   │       ├── page.tsx             # GameWrapper + HUD + idle/done 屏
│   │       └── BlackHoleScene.tsx   # R3F Canvas + 游戏逻辑 + GLB 模型池支持
│   ├── mbti/                        # MBTI 测试
│   ├── tarot/                       # 塔罗三牌阵
│   ├── stats/                       # 我的数据（总览 + 进度曲线 + 最近记录）
│   ├── leaderboard/                 # 按游戏 × 难度的排行榜
│   ├── profile/                     # 个人中心
│   └── (auth)/                      # 登录 / 注册
├── components/
│   ├── Header.tsx                   # 顶栏（用 BrainMark + 改 a11y 的 lang switcher）
│   ├── BrainMark.tsx                # 自制神经网络 SVG logo（带脉冲动画，currentColor 着色）
│   ├── AuroraBackground.tsx         # 全屏星云背景（三色光雾慢漂 CSS 动画）
│   ├── MagneticCard.tsx             # 鼠标位置 3D 倾斜的卡片包装（Link wrapper）
│   └── GameWrapper.tsx              # 通用游戏外壳（难度选择、成绩保存等）
└── lib/
    ├── auth.ts                      # NextAuth 配置
    ├── prisma.ts                    # Prisma 客户端单例
    ├── utils.ts                     # 游戏注册表 & 通用工具 + categoryCta()
    ├── difficulty.ts                # 难度枚举 + 每个游戏的参数配置
    ├── translations.ts              # 三语文案
    ├── language-context.tsx         # 语言切换 Context
    ├── mbti-data.ts                 # 16 型人格描述
    ├── mbti-scenarios.ts            # MBTI 场景化题目 + 加权计分
    ├── tarot-data.ts                # 22 大阿尔卡那 + 三牌抽取
    ├── leaderboard-fixtures.ts      # 150 个合成用户 + 确定性分数生成（让排行榜不空）
    ├── icons.tsx                    # 所有 lucide 图标注册表（GAME_ICONS / CATEGORY_ICONS / DIFFICULTY_LUCIDE_ICONS / MBTI_ICONS / rankMedal）
    └── typing-passages.ts           # 打字测试分级文章池
```

## 🎨 视觉系统

整站走 dark mode + indigo brand color，但首页和排行榜做了一波"surprise"级的视觉升级：

- **Aurora 星云背景**（`AuroraBackground.tsx`）—— 三个超大模糊渐变光斑（紫 / 蓝 / 粉）以不同速度慢漂，加微噪 + vignette。底色用 `#070914` 而不是死黑，整页是"会呼吸"的。
- **自制 BrainMark logo** —— 半圆双脑结构 + 6 个节点 + 9 条连接线（含胼胝体）。节点循环脉冲，纯 SVG，`currentColor` 上色，从 16px favicon 到 92px hero 都好看。
- **磁吸 3D 卡片** —— 游戏卡 hover 时跟随鼠标位置 rotateX/Y 最多 5 度，同时一个跟着鼠标位置的径向光斑 (`::before` + `--mx/--my` CSS var)。
- **流动渐变 hero 标题** —— `linear-gradient` + `background-size: 200%` + `@keyframes` 慢循环，从 indigo → purple → pink → 回。
- **滚动渐入** —— `IntersectionObserver` 给所有 `.reveal` 元素加 `is-visible` class 触发 `translateY+opacity`。
- **自定义 scrollbar** —— 暗色 + 半透 brand-500 滑块，`::selection` 也染成 brand-600。
- **`prefers-reduced-motion`** —— 所有动画在尊重用户偏好的前提下统一禁用（aurora、磁吸、渐入、脉冲都关）。
- **字体走 `next/font/google`** —— 自托管 Inter + JetBrains Mono，编译期 subset，干掉 `@import url(...)` 的 CDN 阻塞。
- **全站 lucide 图标系统** —— 所有 UI 上的 emoji 都换成了 [lucide-react](https://lucide.dev) 的线性 SVG 图标，注册在 `lib/icons.tsx`：游戏图标 (`Zap` / `Hash` / `Eye` / `Target` / `Sword` / `Crosshair` / `Flame` / `Bird` / `Aperture` 等)、分类图标 (`Brain` / `Swords` / `Gamepad2`)、难度图标 (`Sprout` / `Activity` / `Flame` / `Skull`)、MBTI 16 型图标 (`Castle` / `FlaskConical` / `Crown` 等)。状态反馈也是 lucide：`CircleCheck` / `CircleX` / `PartyPopper` / `AlarmClockOff` / `Loader2` 等。
- **排行榜头像** —— 不再用国旗 emoji。`UserAvatar` 组件根据 `userId` hash 算两个 HSL 色相 → linear-gradient 头像 + 用户名首字母。中文名取 1 个字，拉丁名取 2 个大写字母。每个用户跨平台一致，每个用户独一无二。
- **奖牌升级** —— 前 3 名不再用 🥇🥈🥉 emoji，换成 `Trophy` / `Medal` / `Award` lucide 图标 + 金 / 银 / 铜渐变圆形 badge。

第一印象的 funnel 也换了：hero CTA 从"看排行榜"反转成 **"试一下 30 秒反应力测试 →"** 直跳第一个游戏；旁边小字"Leaderboard"带绿色脉冲点表示"现在有人在玩"。stats 区不再写 `∞` 这种假大空数字，换成确切的 `13 / 4 / 3`（游戏数 / 难度档 / 语言数）。每个游戏分类的 CTA 文案根据 category 区分：cognitive 是 **Take test**、moba 是 **Train**、casual 是 **Play**。

## 数据模型

```prisma
model Score {
  id         String   @id @default(cuid())
  userId     String
  game       String   // 7 种游戏之一
  difficulty String   @default("medium")  // easy / medium / hard / hell
  value      Float    // reaction-time 越低越好，其他越高越好
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([game, difficulty, value])
  @@index([userId, game, difficulty])
}
```

排行榜按 `(game, difficulty)` 复合索引查询，每人每档保留最佳成绩。

## 添加新游戏

1. 在 `src/lib/utils.ts` 的 `GAMES` 数组里加游戏配置（icon、配色、`lowerIsBetter`）
2. 在 `src/lib/difficulty.ts` 加 `<GAME_ID>_CONFIG: Record<Difficulty, {...}>` 定义四档参数
3. 在 `src/lib/translations.ts` 加三语标题/描述
4. 创建 `src/app/games/<game-id>/page.tsx`，用 `<GameWrapper gameId="..." noDifficulty?>` 包住
5. 游戏组件接受 `(onComplete, difficulty)` 两个参数，基于 difficulty 读取对应 config
6. 调用 `onComplete(score)` 提交成绩

## 生产部署

当前配置已经是"生产就绪"的 Postgres（Neon 云端）。部署到 Vercel：

```bash
# 1. 把仓库推到 GitHub
# 2. 在 Vercel 里 import 仓库
# 3. 配环境变量（照 .env 那几个，DATABASE_URL 换成 Neon pooled URL 更好）
# 4. Deploy
```

⚠️ 线上的 `NEXTAUTH_SECRET` **必须**重新生成，不要用开发环境那个：

```bash
openssl rand -base64 32
```

## 难度系统设计原则

不同游戏"什么叫难"差别很大，所以难度参数是**按游戏独立设计**的：

- **反应速度类** → 加干扰信号（颜色诱饵、绿色倒计时）
- **记忆类** → 起始规模 + 展示/输入时间
- **技巧类**（打字）→ 内容本身分级（日常词 → 代码符号）
- **纯度量类**（CPS）→ 不适合分级，只给时长选项
- **MOBA 时机类**（Last-Hit）→ 你的 ATK 值 + 盟军伤害/频率 + 弹道飞行时间 + (Hell) 防御塔
- **MOBA 预判类**（Skill Shot）→ 飞行时间 + 容差 + 目标运动复杂度
- **MOBA 连招类**（Combo）→ 按键池大小 + 起始长度 + 输入节奏

排行榜按难度独立 → 不同档不可比，鼓励挑战更高难度而不是反复刷低难度。
