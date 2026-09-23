# AdSense 接入

## 当前状态

首页标题下方、游戏目录上方已有一个三语自适应广告位。开发模式默认显示样板，生产环境默认关闭。
样板不加载 Google 脚本、不发广告请求；游戏页面没有新增广告。
小游戏失败后已接入可选的“观看广告获得一次额外机会”流程：只有用户主动选择观看时才请求 rewarded web ad，获得奖励后才向游戏发送复活消息；跳过、广告未填充或广告加载失败都保留正常重玩。
2026-09-21 已在账号信息页核实发布商 ID：`pub-7552640548182350`，账号状态为 Open，Active products 只有 AdMob。
代码默认使用该公开 ID 输出验证信息，可通过环境变量覆盖；这不表示网站收益已开通。
网站公开地址、AdSense for Content 开通、网站审核和广告单元 ID 尚未完成。

## 预览

运行 `npm run dev -- -p 3100` 后，在首页标题下方、游戏目录上方查看。
生产构建如需展示样板，在构建之前设置 `NEXT_PUBLIC_ADSENSE_MODE=preview`。
三种模式：`off` 隐藏，`preview` 样板，`live` 真实广告。

`.env.adsense.example` 提供独立的配置模板。把其中的条目添加到 `.env.local` 或部署平台环境变量，勿覆盖现有数据库和登录配置。

## 连接真实账号

1. 当前账号只有 AdMob。按 [Google 官方升级说明](https://support.google.com/adsense/answer/6023158?hl=en)，从 [AdSense 开始页面](https://adsense.google.com/start/) 使用同一 Google 账号申请添加 AdSense for Content。无需另造一个发布商 ID。
2. 网站部署到公网后，在 AdSense 的“网站”中添加实际网址。本机 localhost 不能供 Google 审核。
3. 设置 `NEXT_PUBLIC_ADSENSE_CLIENT` 为实际 ID，重新构建并部署。此时可以继续使用 `off`，不必先展示广告。
4. 页面 `<head>` 会包含 `google-adsense-account` 验证标签；根路径 `/ads.txt` 会输出该发布商的授权行。未配置有效 ID 时不输出验证标签，`/ads.txt` 返回 404，不生成虚构授权记录。
5. 在 AdSense 选择 meta 标签或 ads.txt 方式验证网站并申请审核。能否获批由 Google 决定。
6. 在上线前补齐与实际数据处理一致的隐私说明，并在 AdSense“隐私权和消息”完成所需的同意管理设置。代码中的广告开关不替代 Google CMP 或其他合适的同意管理平台。
7. 创建一个自适应展示广告单元，将代码的 `data-ad-slot` 数字填入 `NEXT_PUBLIC_ADSENSE_HOME_SLOT`。此实现使用手动广告位；在 AdSense 后台保持自动广告关闭，防止后台设置额外插入覆盖层或游戏区广告。
8. 网站审核通过、同意管理配置完成后，设置 `NEXT_PUBLIC_ADSENSE_MODE=live`，重新构建部署。
9. 如需启用“失败后看广告复活”，在 Google Ad Manager 创建 rewarded web 广告单元，并把完整广告单元路径填入 `NEXT_PUBLIC_AD_MANAGER_REWARDED_UNIT_PATH`，格式类似 `/网络代码/广告单元名称`。这个值不是 `ca-pub-...` 发布商 ID；没有有效路径时，复活广告保持关闭，不会伪造奖励。
10. Rewarded web ad 必须在正式域名和可用广告配置上验证。游戏内会在用户失败后先展示说明和“暂不观看”，只有用户点击观看才打开广告；广告未完成不会发放额外机会。

所有 `NEXT_PUBLIC_` 配置均在构建时固定，修改后需要重建。发布商 ID 和广告单元 ID 是公开标识，不是密码。
真实广告仅在广告位进入视口时加载，防止同一元素重复请求；脚本失败会移除该广告位。
localhost 和 loopback 地址不会请求真实广告。不要通过点击自己的广告测试收益。

## 检查

- 当前默认配置：开发模式看到“广告位预览”；浏览器没有请求 `adsbygoogle.js`；生产模式无占位；已有发布商 ID 输出验证标签和 ads.txt。
- `off`：无广告容器、无广告脚本；若填写有效发布商 ID，仍保留验证标签和 ads.txt，供审核使用。
- `preview`：中文、英文、西班牙语切换同步更新；窄屏无横向溢出。
- `live`：必须填写有效发布商 ID 和广告单元 ID；否则不加载。实际曝光、审核和广告填充仍需在正式域名验证。
- Rewarded revive：必须同时满足 `NEXT_PUBLIC_ADSENSE_MODE=live`、有效的 `NEXT_PUBLIC_AD_MANAGER_REWARDED_UNIT_PATH` 和非 localhost 域名；本地预览不会向 Google 请求 rewarded ad。
- 登录、游戏和排行榜不依赖广告加载成功。

## 官方依据

以下为 Google AdSense 官方帮助，页面未标注统一发布日期；核验日期：2026-09-21。

- [连接网站、meta 验证与审核](https://support.google.com/adsense/answer/7584263?hl=en)
- [ads.txt 配置](https://support.google.com/adsense/answer/12171612?hl=en)
- [自适应广告代码](https://support.google.com/adsense/answer/9183363?hl=en)
- [广告放置政策](https://support.google.com/adsense/answer/1346295?hl=en)
- [同意管理平台设置](https://support.google.com/adsense/answer/7670013?hl=en)
- [从 AdMob 账号申请网站广告](https://support.google.com/adsense/answer/6023158?hl=en)
- [Google Ad Manager：网页奖励广告](https://support.google.com/admanager/answer/9116812?hl=en)
- [Google Publisher Tag：展示奖励广告示例](https://developers.google.com/publisher-tag/samples/display-rewarded-ad)
- [提供奖励的广告单元政策](https://support.google.com/adsense/answer/9121589?hl=en)
