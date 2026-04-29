# Godot Hole.io Web Export

把 Godot 4 导出的 HTML5 文件放在这个文件夹里。游戏页（/games/black-hole）会自动检测 `index.html` 是否存在；存在就用 Godot 版本，不存在就 fallback 到我们写的 Three.js 版本。

## 怎么从 `Hole.io/` 项目导出 Web 版本

### 1. 装 Godot 4

下载：https://godotengine.org/download （选 4.x，标准版即可）

### 2. 装 Web Export Template

第一次导出 web 之前需要装一次模板：

- 打开 Godot
- `Editor → Manage Export Templates → Download and Install`
- 等一下下载完毕（几百 MB）

### 3. 打开 Hole.io 项目

- `Project → Open Project`
- 选根目录里的 `Hole.io/project.godot`

### 4. 添加 Web 导出 preset

- 顶栏 `Project → Export...`
- 点 `Add...` → 选 `Web`
- `Export Path` 选这个文件夹（`mindbench/public/godot-hole/`），**文件名填 `index.html`**（**关键**）
- 设置（保持默认就行，重点是 `Variant → Threads Support` 勾上以获得最好性能；如果有问题再取消）
- 点 `Export Project`（不是 Pack）

### 5. 检查输出

导出完后，这个文件夹应该出现：

```
public/godot-hole/
├── index.html        ← 主入口（必需）
├── index.js          ← Godot 引擎
├── index.wasm        ← 引擎的 WASM
├── index.pck         ← 你的游戏数据
└── (可能还有 .audio.worklet.js 等)
```

### 6. 刷新游戏页面

打开 `http://localhost:3000/games/black-hole`，应该自动加载 Godot 版本（iframe 嵌入）。

## ⚠️ 已知坑

1. **Threads Support 需要 cross-origin isolation** —— 如果导出时勾了 Threads，Next.js 可能需要加 COOP/COEP 头。如果游戏白屏 / 控制台报"SharedArrayBuffer not defined"，**重新导出取消勾 Threads** 即可。

2. **文件名必须是 `index.html`** —— 我的探测逻辑就找这个文件。其他名字 fallback 会触发。

3. **不要 commit 这些大文件到 git** —— `index.wasm` 几 MB，`.pck` 也几 MB，加起来对 git 不友好。我把这文件夹（除了这份 README）加到 `.gitignore`。

## 临时回到 Three.js 版本

把这文件夹里的 `index.html` 删掉/改名，刷新页面 → 自动 fallback。
