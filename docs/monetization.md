# AdSense 与 GA4 接入

实现日期：2026-11-11。当前没有正式域名、GA4 衡量 ID 或广告单元 ID，**尚未启用真实广告与 Analytics 采集**。发布商沿用公开配置 `ca-pub-7552640548182350`，不代表站点已获批准。

## 配置

将 `.env.adsense.example` 和 `.env.analytics.example` 中需要的变量加入部署环境；不要覆盖已有 `.env`。`NEXT_PUBLIC_` 配置在构建时写入客户端，修改后重新构建部署。

| 变量 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_ADSENSE_MODE` | `off` 关闭；`preview` 明确标注的样板；`live` 请求真实广告。未配置时开发环境预览、生产环境关闭。 |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | 现有公开发布商 ID。 |
| `NEXT_PUBLIC_ADSENSE_HOME_SLOT` | AdSense 首页展示广告单元的 `data-ad-slot`。 |
| `NEXT_PUBLIC_ADSENSE_RESULT_SLOT` | 另一个展示广告单元，在用户完成设备检查之后显示。缺失时不复用首页 ID。 |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 网站数据流的 `G-...` ID；留空时不加载。 |

localhost、`.localhost` 子域和环回 IP 不加载这两项真实服务。广告样板不请求 Google。页面已有发布商 meta 标签及 `/ads.txt`，保留用于站点接入。

## 正式上线时

1. 给网站绑定正式域名与 HTTPS，在 AdSense 添加站点并完成验证、审核；确认实际 `/ads.txt` 内容。
2. 创建首页、完成检测后的展示广告单元，填写各自 ID。关闭 AdSense Auto ads，避免自动广告覆盖键盘、鼠标或全屏检测表面；本次集成使用明确广告位。
3. 在 AdSense「隐私权与消息」配置并发布所需的 Google 认证 CMP 消息，包含适用地区、语言和隐私政策链接。本站偏好开关不是 TCF CMP，不能替代它。适用地区的实际同意流程需要上线验证。
4. 创建 GA4 网站数据流并填写衡量 ID。**关闭该数据流的增强型衡量（Enhanced Measurement）**：应用已手动发送路由 page_view；自动 history page_view 会重复计数，自动表单或站内搜索事件也不属于本次允许采集的范围。
5. 在 GA4 创建事件范围的自定义维度 `tool_id`、`content_id`、`content_type`、`placement`。可将 `tool_complete` 标为关键事件，并建立下面的漏斗。
6. 使用正式站点的自有测试访问核实拒绝、允许、撤回、换页和再次检测。通过 GA4 Realtime / Tag Assistant 检查事件及重复计数。AdSense 填充和收入只能由后台真实数据确认。

## 检测漏斗

| 事件 | 触发条件 | 参数 |
| --- | --- | --- |
| `page_view` | 同意统计后的初始页面或路径变化 | 过滤后的页面地址、前一页面 |
| `tool_open` | 进入一个设备检查页面；同意之后可补记当前页面打开 | `tool_id` |
| `tool_start` | 用户主动开始接收、播放、采样、全屏观察等操作 | `tool_id` |
| `tool_complete` | 已有观察/样本且停止后，用户点击「完成检测，查看下一步」 | `tool_id` |
| `recommendation_click` | 在完成区域点击测试、小游戏、继续检查或驱动入口 | `tool_id`, `content_id`, `content_type`, `placement=checkup_complete` |

同一轮暂停/恢复不会反复发 start；重复完成不会反复发 complete。重新开始/重置才进入下一轮。访问自检记录不算进行一次检测；保存摘要也不等于完成。

漏斗只反映同意采集且未阻止统计的访问；不重放同意前操作，不把完成计数当成全部访客或收入。`tool_complete` 表示用户结束观察，不表示硬件通过检测。录音、图像、按键内容、原始输入、设备 ID、备注、自定义标签和检查指标都不在 GA4 事件参数中。

地址不含查询参数/片段；私有动态路径归为 `/other`。外部 referrer 只保留来源域名。GA4 配置关闭 Google Signals 和广告个性化信号；统计与展示广告是分开的选择。首次未选择时不加载；页脚可撤回并刷新以卸载已加载脚本。没有 ID 的环境依然能正常使用所有工具。

## 官方依据

以下动态文档核对于 2026-11-11；页面未明确标注发布日期。

- Google Developers：[手动 page_view 与关闭重复自动事件](https://developers.google.com/analytics/devguides/collection/ga4/views)。
- Google Developers：[Basic consent mode](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic)。
- Google AdSense：[认证 CMP 要求](https://support.google.com/adsense/answer/13554116?hl=en)。
- Google AdSense：[创建欧洲法规消息](https://support.google.com/adsense/answer/10960768?hl=en)。

现有隐私、Cookie 等页面仍是草稿；本次同步新增统计与偏好控制的事实说明，不将草稿宣称为已完成法律审查。
