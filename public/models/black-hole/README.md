# Black Hole — 3D 模型池

把 **GLB 文件**（推荐）或 **GLTF / FBX** 文件丢到这个文件夹的对应 tier 子目录下，并在 `manifest.json` 里登记。游戏会自动随机抽取使用。

## 目录约定

```
public/models/black-hole/
├── manifest.json           # 你手动维护这个文件
├── tier_0/                 # 小物体 (mass 4-12)，比如 树苗、灌木、栏杆
├── tier_1/                 # 中物体 (mass 20-50)，比如 小车、电话亭、长椅
├── tier_2/                 # 大物体 (mass 70-150)，比如 房屋、商店
└── tier_3/                 # 巨物 (mass 200+)，比如 大楼、塔
```

## manifest.json 格式

```json
{
  "tier_0": [
    {
      "file": "tier_0/tree.glb",
      "name": "Tree",
      "mass": 8,
      "scaleHint": 1.0,
      "yOffset": 0
    }
  ],
  "tier_1": [...],
  "tier_2": [...],
  "tier_3": [...]
}
```

字段说明：
- `file` — 相对于 `public/models/black-hole/` 的路径
- `name` — 给开发看的，UI 上不显示
- `mass` — 这个物体被吞噬时增加多少质量给玩家
- `scaleHint` — 全局缩放系数（如果模型本来太大或太小，调这个）
- `yOffset` — 模型应该放在地面之上多高（一般 0 就行；如果模型原点在脚底就 0，原点在中心就 = 高度的一半）

## 在 3D AI Studio 出图的 prompt 建议

为了视觉风格统一，建议所有 prompt 都加：
- `low-poly stylized` 或 `cartoon style`（避免过度写实跟其他物体不协调）
- `solid color, no texture detail`（轻量化）
- `centered, isolated, white background`（背景必须删掉）
- `simple geometry`

**Tier 0 例子：**
- "low-poly cartoon tree, single trunk and round canopy, green and brown, no background"
- "stylized fire hydrant, red and gold, simple geometry"

**Tier 1 例子：**
- "low-poly cartoon sedan car, red, simple shape with 4 wheels"
- "British red phone booth, low-poly stylized"

**Tier 2 例子：**
- "low-poly stylized house, beige walls and brown roof, single story"
- "stylized small shop building with awning, cartoon style"

**Tier 3 例子：**
- "low-poly stylized skyscraper, glass and concrete, modern, with antenna"
- "tall observation tower with golden top, stylized"

## 出完图的工作流

1. 在 3D AI Studio 生成 → 下载 GLB
2. 命名清晰：`tree-01.glb` / `red-car.glb` 等
3. 放到对应 `tier_X/` 子目录
4. 编辑 `manifest.json` 添加一行
5. 刷新游戏 — 新模型立刻出现在物体池里

## 备用方案

manifest 里 tier 为空时，游戏会**自动 fallback** 到内置的几何体形状（树、车、房子、大楼），所以你可以**逐步替换**，不用一次出齐 30 个。
