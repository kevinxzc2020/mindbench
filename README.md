# MindBench 🧠

> 测试你的大脑极限 — 类 Human Benchmark 的认知能力测试平台

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) + TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | SQLite (开发) via Prisma ORM |
| 认证 | NextAuth.js (邮箱+密码) |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npm run db:push

# 3. （可选）填充演示数据
npm run db:seed

# 4. 启动开发服务器
npm run dev
```

打开 http://localhost:3000

## 游戏列表

| 游戏 | 说明 | 计分方式 |
|------|------|---------|
| ⚡ 反应时间 | 绿色出现时点击 | 5次平均 ms（越低越好）|
| 🔢 数字记忆 | 记住越来越长的数字 | 通过关卡数（越高越好）|
| 🧩 序列记忆 | 记住方块亮起顺序 | 通过关卡数（越高越好）|
| 👁️ 视觉记忆 | 记住哪些方块亮过 | 通过关卡数（越高越好）|

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth + 注册接口
│   │   └── scores/        # 成绩提交 & 排行榜 & 个人记录
│   ├── games/             # 4个游戏页面
│   ├── leaderboard/       # 排行榜页面
│   ├── profile/           # 个人中心
│   └── (auth)/            # 登录 / 注册
├── components/
│   ├── Header.tsx
│   └── GameWrapper.tsx    # 通用游戏外壳（保存成绩等）
└── lib/
    ├── auth.ts            # NextAuth 配置
    ├── prisma.ts          # Prisma 客户端单例
    └── utils.ts           # 游戏配置、工具函数
```

## 添加新游戏

1. 在 `src/lib/utils.ts` 的 `GAMES` 数组中加入游戏配置
2. 创建 `src/app/games/<game-id>/page.tsx`
3. 用 `<GameWrapper gameId="...">` 包裹游戏逻辑
4. 调用 `onComplete(score)` 提交成绩

## 生产部署

```bash
# 替换 .env.local 中的 NEXTAUTH_SECRET 为安全随机值
# 将 DATABASE_URL 改为生产数据库（推荐 PostgreSQL）

npm run build
npm start
```
