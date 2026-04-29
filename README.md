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
| 🎴 Tile Match (三消脑力关) | 羊了个羊式三消 | 通过的关卡数 | 图案种类 + 牌总数 + 堆叠层数 + 锁牌数 + 槽位（Hell 缩到 6） |
| 🦢 Goose Grab (抓大鹅) | **3D 物理三消**（基于 Rapier）| 通过的关卡数 | 同上 + **摇晃次数**（Easy 5 → Hell 1）|
| 🕳️ Black Hole (黑洞大作战) | Hole.io **3D 单人版** | 最终质量 (kg) | **不分难度**，一个 90s 畅玩模式 |

休闲游戏额外细节：
- **Tile Match 板内 3D 背景**（`TileMatchBackground.tsx` 用 R3F 渲染 10 个糖果系几何体）—— 嵌在游戏板内部，牌堆在 3D 形状上层（z-index 控制）。
- **Goose Grab** 升级为 **3D 物理版**：
  - R3F + Rapier 物理引擎，食物模型自然堆叠在透明容器里
  - 8 种 GLB 食物模型（XOIAL 在 Sketchfab 的免费 Low Poly Food Pack —— ice-cream / cookie-man / cheese / hotdog / sandwich / sandwich-toast / pancake / toast）
  - 点击食物 → GSAP 弹到底部卡槽 → 3 同自动消除
  - 摇一摇 = 重置物理场景，物体重新落下
  - 借鉴自 [goose-catch 开源 sample](https://github.com/goose-catch)（用户提供）
- **Black Hole 双引擎模式** 🎨：
  - **优先**：如果 `public/godot-hole/index.html` 存在 → 自动 iframe 嵌入 Godot 4 HTML5 导出版本（参考 [Hole.io Godot 模板](https://github.com/your-source-here)）
  - **Fallback**：自动 fallback 到 Three.js 实现 + GLB 模型池
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

### 🍀 今日运势

每天一次确定性生成的运势签：**大吉 / 吉 / 平 / 小凶 / 大凶**（按实际体验做了加权分布）。包含整体运势、事业/感情/财运/健康四分类、幸运色、幸运数字、今日宜/忌。

- 已登录 → 按账号个性化（同一天不同人不同）
- 未登录 → 当天全站共享一版（大众运势）
- 0 点过后自动换新

### 📊 我的数据（Stats）

登录后可见的个人统计页 (`/stats`)：

- **顶部汇总**：总测试次数、参与游戏数、活跃天数、首次开始日期
- **每个游戏一张卡**：展示最近 30 次得分的**迷你进度曲线**（SVG 绘制，点颜色按难度区分；"上 = 更好"无论游戏方向），以及四档难度各自的最佳成绩和尝试次数
- **最近记录列表**：最近 20 次测试的时间线，相对时间（刚刚 / 3 小时前 / 2 天前）

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
│   │   ├── tile-match/              # 三消脑力关 (羊了个羊 启发)
│   │   │   ├── page.tsx
│   │   │   └── TileMatchBackground.tsx  # R3F 糖果系 3D 漂浮背景
│   │   ├── goose-grab/              # 抓大鹅 (R3F + Rapier 物理 3D 版)
│   │   │   ├── page.tsx             # GameWrapper + HUD + idle/done
│   │   │   └── GooseGrabScene.tsx   # 3D 场景 + 物理 + 8 GLB 食物
│   │   └── black-hole/              # 黑洞大作战 (R3F 3D，无难度，畅玩)
│   │       ├── page.tsx             # GameWrapper + HUD + idle/done 屏
│   │       └── BlackHoleScene.tsx   # R3F Canvas + 游戏逻辑 + GLB 模型池支持
│   ├── mbti/                        # MBTI 测试
│   ├── tarot/                       # 塔罗三牌阵
│   ├── fortune/                     # 今日运势
│   ├── stats/                       # 我的数据（总览 + 进度曲线 + 最近记录）
│   ├── leaderboard/                 # 按游戏 × 难度的排行榜
│   ├── profile/                     # 个人中心
│   └── (auth)/                      # 登录 / 注册
├── components/
│   ├── Header.tsx
│   └── GameWrapper.tsx              # 通用游戏外壳（难度选择、成绩保存等）
└── lib/
    ├── auth.ts                      # NextAuth 配置
    ├── prisma.ts                    # Prisma 客户端单例
    ├── utils.ts                     # 游戏注册表 & 通用工具
    ├── difficulty.ts                # 难度枚举 + 每个游戏的参数配置
    ├── translations.ts              # 三语文案
    ├── language-context.tsx         # 语言切换 Context
    ├── mbti-data.ts                 # 16 型人格描述
    ├── mbti-scenarios.ts            # MBTI 场景化题目 + 加权计分
    ├── tarot-data.ts                # 22 大阿尔卡那 + 三牌抽取
    ├── fortune-data.ts              # 运势等级 + 文案池 + 确定性哈希
    └── typing-passages.ts           # 打字测试分级文章池
```

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
