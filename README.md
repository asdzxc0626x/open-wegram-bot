# Open Wegram Bot - OWB
## 一个让人呼吸顺畅的 Telegram 双向私聊机器人 🤖（零费用）
### *LivegramBot 不死，战斗不止！*

简体中文 | [English](README_EN.md) 

这是一个基于 Cloudflare Worker / Vercel 的 Telegram 双向私聊机器人，无需服务器、无需数据库、无需自己的域名即可轻松部署。

用户可以通过您的机器人向您发送消息，您可以直接回复这些消息，实现双向通信。

## ✨ 特色功能

- 🔄 **双向通信** - 轻松接收和回复来自用户的消息
- 💾 **无需数据库** - 完全无状态设计，零存储成本
- 🌐 **无需自己的域名** - 使用 Cloudflare Worker 提供的免费域名
- 🚀 **轻量级部署** - 几分钟内即可完成设置
- 💰 **零成本运行** - 在 Cloudflare 免费计划范围内使用
- 🔒 **安全可靠** - 使用 Telegram 官方 API 和安全令牌
- 🔌 **多机器人支持** - 一个部署可注册多个私聊机器人
- 🛠️ **多种部署方式** - 支持 GitHub 一键部署、Vercel 一键部署、Wrangler CLI 和 Dashboard 部署
- 🤖 **智能人机验证** - 可选的数学题验证功能，防止垃圾消息和机器人滥用（需配置 KV 存储）

## 🛠️ 前置要求

- Cloudflare 账号
- Telegram 账号
- 一个科学工具（仅设置阶段需要，用于访问 Worker 默认域名，自绑域名无视）

## 📝 设置步骤

### 1. 获取 Telegram UID

> [!NOTE]
> 您需要知道自己的 Telegram 用户 ID (UID)，这是一串数字，用于将消息转发给您。

您可以通过以下方式获取：

- 向 [@userinfobot](https://t.me/userinfobot) 发送任意消息，它会告诉您自己的 UID

请记下您的数字 ID（例如：`123456789`）。

### 2. 创建 Telegram Bot

1. 在 Telegram 中搜索并打开 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 命令
3. 按照提示设置您的机器人名称和用户名（用户名必须以 `bot` 结尾）
4. 成功后，BotFather 会发给您一个 Bot API Token（格式类似：`000000000:ABCDEFGhijklmnopqrstuvwxyz`）
5. 请安全保存这个 Bot API Token

### 3. 选择部署方式

#### 方法一：GitHub Actions 自动部署（推荐 ⭐）

这是最灵活的部署方式，支持自动化 CI/CD 流程，可以在推送代码时自动部署到 Cloudflare Workers。

**优势**：
- ✅ 完全自动化：推送代码到 master 分支自动触发部署
- ✅ 安全管理：通过 GitHub Secrets 管理所有敏感配置
- ✅ 可选配置：未设置的配置项不会传递，保持默认行为
- ✅ 支持验证功能：可选配置 KV namespace 启用人机验证

**快速开始**：

1. Fork 本仓库到您的 GitHub 账户
2. 在仓库的 `Settings` → `Secrets and variables` → `Actions` 中添加必需的 secrets：
   - `CLOUDFLARE_API_TOKEN`：您的 Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`：您的 Cloudflare Account ID
3. （可选）添加其他配置 secrets：
   - `PREFIX`：URL 路径前缀（默认：`public`）
   - `SECRET_TOKEN`：Webhook 安全令牌
   - `KV_NAMESPACE_ID`：启用人机验证功能（需先创建 KV namespace）
   - `VERIFICATION_ENABLED`：是否启用验证（`true`/`false`）
   - `VERIFICATION_TIMEOUT_DAYS`：验证有效期天数（默认：`7`）
4. 推送代码到 master 分支，或在 Actions 页面手动触发部署

**详细配置指南**：请查看 [GitHub Actions 部署文档](./GITHUB_ACTIONS_DEPLOY.md)

#### 方法二：GitHub 集成部署

这是另一种简单的部署方式，无需本地开发环境，直接通过 Cloudflare 连接 GitHub 仓库部署。

1. Fork 或克隆本仓库到您的 GitHub 账户
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 导航到 **Workers & Pages** 部分
4. 点击 **Create Application**
5. 选择 **Connect to Git**
6. 授权 Cloudflare 访问您的 GitHub，并选择您 fork 的仓库
7. 配置部署设置：
   - **Project name**：设置您的项目名称（例如 `open-wegram-bot`）
   - **Production branch**：选择主分支（通常是 `master`）
   - 其他设置保持默认
8. 配置环境变量：
   - 点击 **Environment Variables**
   - 添加 `PREFIX`（例如：`public`）
   - 添加 `SECRET_TOKEN`（必须包含大小写字母和数字，长度至少16位），并标记为**加密**
9. 点击 **Save and Deploy** 按钮完成部署

这种方式的优点是：当您更新 GitHub 仓库时，Cloudflare 会自动重新部署您的 Worker。

#### 方法二：Vercel 一键部署

Vercel 提供了另一种简单的部署方式，也支持从 GitHub 仓库自动部署。

1. 点击下方的"Deploy with Vercel"按钮：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwozulong%2Fopen-wegram-bot&env=SECRET_TOKEN,PREFIX&envDescription=配置您的机器人参数&project-name=open-wegram-bot&repository-name=open-wegram-bot)

2. 按照 Vercel 的提示完成部署流程
3. 配置环境变量：
   - `PREFIX`：设置为您想要的 URL 前缀（例如 `public`）
   - `SECRET_TOKEN`：设置一个安全的令牌（必须包含大小写字母和数字，长度至少16位）
4. 完成部署后，Vercel 会提供一个域名，如 `your-project.vercel.app`

Vercel 部署的优点是简单快速，支持自动更新，并且默认提供 HTTPS。

#### 方法三：使用 Wrangler CLI

如果您熟悉命令行工具，可以使用 Wrangler CLI 进行部署。

1. 确保安装了 Node.js 和 npm
2. 克隆本仓库：
   ```bash
   git clone https://github.com/wozulong/open-wegram-bot.git
   cd open-wegram-bot
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 部署 Worker：
   ```bash
   npx wrangler deploy
   ```
5. 设置您的安全令牌：
   ```bash
   npx wrangler secret put SECRET_TOKEN
   ```

#### 方法四：通过 Cloudflare Dashboard 手动部署

如果您不想使用 GitHub 或命令行，也可以直接在 Cloudflare Dashboard 中创建。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 导航到 **Workers & Pages** 页面
3. 点击 **Create Worker**
4. 删除默认代码，粘贴本项目的 `src/worker.js` 和 `src/core.js` 代码
5. 点击 **Save and Deploy**
6. 在 Worker 设置中添加环境变量：
   - `PREFIX`（例如：`public`）
   - `SECRET_TOKEN`（必须包含大小写字母和数字，长度至少16位）

#### 方法五：Deno 一键部署

Deno 提供了另一种简单的部署方式，也支持从 GitHub 仓库自动部署。

1. Fork 本仓库到您的 GitHub 账户
2. 登录 [Deno Deploy](https://dash.deno.com) 并点击 **New Project**
3. 选择已授权的 GitHub 账户并选择您的 Fork 仓库
4. 在 **Project Configuration** -> **Entrypoint** 下选择 `deno/server.js`
5. 点击 **Deploy Project** 按钮，等待部署完成
6. 点击页面底部 **Add environment variables** 按钮，添加环境变量：
   - `PREFIX`：URL前缀，例如 `public`
   - `SECRET_TOKEN`：加密令牌，必须包含大小写字母和数字，长度至少16位
7. 点击 **Save (2 new)** 按钮保存环境变量后即完成部署，环境变量上方即为 Deno 提供的域名，如 `project-name.deno.dev`

#### 方法六：Netlify 一键部署

Netlify 提供了另一种简单的部署方式，也支持从 GitHub 仓库自动部署。

1. Fork 本仓库到您的 GitHub 账户
2. 登录 [Netlify](https://app.netlify.com/) 并点击 **Add new site** -> **Add new site
Import an existing project**
3. 选择已授权的 GitHub 账户并选择您的 Fork 仓库
4. 填写 **Site name** 并添加环境变量：
   - 点击 **Add environment variables** -> **Add key/value pairs**
   - `NETLIFY_PREFIX`：URL前缀，例如 `public`
   - `SECRET_TOKEN`：加密令牌，必须包含大小写字母和数字，长度至少16位
5. 点击 **Deploy xxx** 按钮，部署完成后即可在站点名称下看到 Netlify 提供的域名，如 `site-name.netlify.app`

#### 方法七：EdgeOne 一键部署

EdgeOne 提供了另一种简单的部署方式，也支持从 GitHub 仓库自动部署。

1. Fork 本仓库到您的 GitHub 账户
2. 登录 [EdgeOne Pages](https://edgeone.ai/login?s_url=https://console.tencentcloud.com/edgeone/pages) 并点击 **创建项目** -> **导入 Git 仓库**
3. 选择已授权的 GitHub 账户并选择您的 Fork 仓库
4. 添加环境变量：
   - `EDGEONE_PREFIX`：URL前缀，例如 `public`
   - `SECRET_TOKEN`：加密令牌，必须包含大小写字母和数字，长度至少16位
5. 点击 **开始部署** 按钮，部署完成后转到 **项目设置** -> **域名管理** 添加自定义域名，默认域名 `project-name.edgeone.app` 只支持预览，有效期仅 3 个小时！

### 3.1 (可选) 绑定自定义域名 🌐

> [!TIP]
> 为您的 Worker 绑定自定义域名可以避免使用科学工具访问，更加便捷！

Cloudflare 允许您将自己的域名绑定到 Worker 上，这样您就可以通过自己的域名访问 Worker，而不需要使用被和谐的默认域名。

1. 在 Cloudflare 仪表板中添加您的域名
2. 在 Workers & Pages 部分，选择您的 worker
3. 点击 **Triggers**，然后点击 **Add Custom Domain**
4. 按照说明将您的域名绑定到 Worker

绑定后，您可以使用类似 `https://your-domain.com/YOUR_PREFIX/install/...` 的地址来注册/卸载机器人，无需科学工具。

### 4. 注册您的 Telegram Bot

部署 Worker 后，您将获得一个 URL，形如：
- GitHub 集成：`https://your-project-name.username.workers.dev`
- Vercel 部署：`https://your-project.vercel.app`
- Wrangler/Dashboard：`https://your-worker-name.your-subdomain.workers.dev`
- Deno 部署：`https://project-name.deno.dev`
- Netlify 部署：`https://site-name.netlify.app`
- EdgeOne 部署：`https://your.custom.domain`

现在您需要注册您的 Bot：

> [!WARNING]
> 由于 Cloudflare Workers 默认域名被和谐，此步骤需要科学。如果您已绑定自定义域名，可以直接使用您的域名进行访问，无需科学工具。

1. 在浏览器中访问以下 URL 来注册您的 Bot（替换相应参数）：

```
https://your-worker-url/YOUR_PREFIX/install/YOUR_TELEGRAM_UID/BOT_API_TOKEN
```

例如：
```
https://open-wegram-bot.username.workers.dev/public/install/123456789/000000000:ABCDEFGhijklmnopqrstuvwxyz
```

2. 如果看到成功消息，说明您的 Bot 已经注册成功

> [!NOTE]
> 一个 Worker 实例可以注册多个不同的 Bot！只需重复上述注册步骤，使用不同的 Bot API Token 即可。

## 📱 使用方法

### 接收消息 📩

一旦设置完成，任何人给您的 Bot 发送消息，您都会在自己的 Telegram 账号中收到这些消息，并且消息下方会显示发送者的信息。

### 回复消息 📤

要回复某个用户的消息：
1. 在 Telegram 中找到您想回复的转发消息
2. 直接回复该消息（使用 Telegram 的回复功能）
3. 您的回复会被自动发送给原始发送者

### 卸载 Bot ❌

如果您想卸载 Bot，请访问以下 URL（替换相应参数）：

```
https://your-worker-url/YOUR_PREFIX/uninstall/BOT_API_TOKEN
```

## 🤖 人机验证功能（可选）

本项目支持可选的智能人机验证功能，可以有效防止垃圾消息和机器人滥用。

### 功能特点

- ✅ **复杂数学题验证** - 使用包含 3 个运算符的数学表达式，支持加减乘运算和运算优先级
- ✅ **Owner 完全豁免** - Bot 所有者（Owner）发送和回复消息时完全不触发验证
- ✅ **失败惩罚机制** - 用户验证失败 3 次后将被禁用 24 小时
- ✅ **友好的用户体验** - 显示剩余尝试次数和禁用剩余时间
- ✅ **自动过期清理** - 定期清理过期的验证记录和禁用记录
- ✅ **验证有效期** - 通过验证后在指定天数内无需重复验证

### 配置要求

要启用人机验证功能，需要配置以下环境变量：

#### 必需配置

1. **KV_NAMESPACE_ID** - Cloudflare KV 存储命名空间 ID
   - 用途：存储用户验证状态和禁用记录
   - 获取方式：
     ```bash
     # 使用 Wrangler CLI 创建 KV namespace
     npx wrangler kv:namespace create "VERIFICATION_STORE"
     ```
   - 创建后会返回类似 `id = "abc123def456..."` 的 ID，将此 ID 配置为环境变量

2. **VERIFICATION_ENABLED** - 是否启用验证功能
   - 可选值：`true` 或 `false`
   - 默认值：`false`（未配置时）
   - 说明：即使配置了 KV namespace，也需要将此项设置为 `true` 才会启用验证

#### 可选配置

3. **VERIFICATION_TIMEOUT_DAYS** - 验证有效期天数
   - 类型：数字
   - 默认值：`7`（7 天）
   - 说明：用户通过验证后，在此天数内发送消息无需重复验证

### 配置示例

#### Cloudflare Workers (wrangler.toml)

```toml
name = "open-wegram-bot"

[[kv_namespaces]]
binding = "KV"
id = "your_kv_namespace_id_here"

[vars]
PREFIX = "public"
VERIFICATION_ENABLED = "true"
VERIFICATION_TIMEOUT_DAYS = "7"
```

#### GitHub Actions 部署

在 GitHub Secrets 中添加：
- `KV_NAMESPACE_ID`: 您的 KV namespace ID
- `VERIFICATION_ENABLED`: `true`
- `VERIFICATION_TIMEOUT_DAYS`: `7`（可选，默认为 7）

#### Vercel / Deno / Netlify / EdgeOne

在对应平台的环境变量配置中添加：
- `KV_NAMESPACE_ID`: 您的 KV namespace ID（注意：仅 Cloudflare Workers 支持 KV 存储）
- `VERIFICATION_ENABLED`: `true`
- `VERIFICATION_TIMEOUT_DAYS`: `7`

> [!NOTE]
> KV 存储是 Cloudflare Workers 的特性，其他平台（Vercel、Deno、Netlify、EdgeOne）暂不支持人机验证功能。

### 验证流程说明

1. **首次发送消息**：未验证的用户发送消息时，会收到一道数学题（例如：`12 + 5 × 3 - 8 = ?`）
2. **回答问题**：用户点击正确答案后，验证通过，消息正常转发给 Owner
3. **验证失败**：
   - 第 1 次失败：显示"❌ 答案错误，剩余 2 次机会"，重新生成新题目
   - 第 2 次失败：显示"❌ 答案错误，剩余 1 次机会"，重新生成新题目
   - 第 3 次失败：显示"❌ 验证失败次数过多，已被禁用 24 小时"，用户被禁用 24 小时
4. **禁用期间**：被禁用的用户发送消息时会收到提示："⛔ 您因多次验证失败已被暂时禁用。请在 X 小时后再试。"
5. **验证有效期**：通过验证后，用户在配置的天数内（默认 7 天）发送消息无需重复验证
6. **Owner 豁免**：Bot 所有者（Owner）发送消息和回复消息时完全不触发验证流程

### 自动清理功能

项目支持定期清理过期的验证记录和禁用记录，释放 KV 存储空间。

#### 方式一：Cron Trigger（推荐）

在 `wrangler.toml` 中启用 Cron Trigger：

```toml
[triggers]
crons = ["0 2 * * *"]  # 每天凌晨 2 点执行清理
```

#### 方式二：手动清理

访问清理端点（需要 Bearer Token 认证）：

```bash
curl -X GET "https://your-worker-url/YOUR_PREFIX/cleanup" \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN"
```

返回示例：
```json
{
  "success": true,
  "scannedCount": 150,
  "deletedVerifications": 45,
  "deletedBans": 3,
  "message": "Cleanup completed successfully"
}
```

## 🔒 安全说明

> [!IMPORTANT]
> 请妥善保管您的 Bot API Token 和安全令牌（Secret Token），这些信息关系到您服务的安全性。

> [!WARNING]
> **请勿随意更改已设置的 Secret Token！** 更改后，所有已注册的机器人将无法正常工作，因为无法匹配原来的令牌。如需更改，所有机器人都需要重新注册。

- 在初始设置时选择一个安全且便于记忆的 Secret Token
- 避免使用简单或常见的前缀名称
- 不要将敏感信息分享给他人

## ⚠️ 使用限制

### Cloudflare Worker 免费套餐限制

> [!NOTE]
> Cloudflare Worker 免费套餐有以下限制：
> - **请求数量**：每日 10 万请求
> - **KV 存储空间**：1 GB（启用人机验证功能时使用）
> - **KV 读取操作**：每日 10 万次
> - **KV 写入操作**：每日 1000 次

对于个人使用的私聊机器人来说，这些限制通常足够宽松。即使您注册了多个机器人，除非您的机器人极其活跃，否则不太可能达到这些限制。

### 关于 KV 存储使用

如果启用了人机验证功能：
- 每个用户通过验证会产生 1 次 KV 写入操作
- 每次用户发送消息会产生 1-2 次 KV 读取操作
- 验证失败会产生额外的 KV 写入操作
- 建议启用自动清理功能，定期删除过期记录以节省存储空间

### 升级选项

如果您预计使用量较大，可以考虑升级到 Cloudflare 的付费计划：
- **Workers Paid**（$5/月）：每月 1000 万请求，KV 操作限制大幅提升
- 超出部分按量计费，价格合理

## 🔍 故障排除

### 基础问题

- **消息未转发**: 确保 Bot 已正确注册，并检查 Worker 日志
- **无法访问注册 URL**: 确认您是否相信科学，或者考虑绑定自定义域名解决访问问题
- **回复消息失败**: 检查您是否正确使用 Telegram 的回复功能
- **注册失败**: 确保您的 `SECRET_TOKEN` 符合要求（包含大小写字母和数字，长度至少16位）
- **GitHub 部署失败**: 检查环境变量是否正确设置，仓库权限是否正确
- **Worker 部署失败**: 检查 Wrangler 配置并确保您已登录到 Cloudflare

### 人机验证相关问题

- **验证功能未生效**:
  - 检查是否正确配置了 `KV_NAMESPACE_ID`
  - 确认 `VERIFICATION_ENABLED` 设置为 `true`
  - 确保 KV namespace 已在 Cloudflare 中创建并绑定到 Worker
  - 查看 Worker 日志确认 KV 绑定是否成功

- **Owner 也收到验证题目**:
  - 确认注册 Bot 时使用的 `OWNER_UID` 是否正确
  - 检查是否使用了正确的 Telegram UID（数字格式）
  - 可以向 [@userinfobot](https://t.me/userinfobot) 确认您的 UID

- **用户被误封禁**:
  - 可以通过手动清理端点清除特定用户的禁用记录
  - 或等待 24 小时后自动解除禁用
  - 检查是否有多个用户共享同一 IP 导致的误判

- **验证记录未自动清理**:
  - 确认 `wrangler.toml` 中的 Cron Trigger 配置是否正确
  - 检查 Cloudflare Dashboard 中的 Cron Trigger 是否已启用
  - 可以使用手动清理端点测试清理功能是否正常

- **KV 存储空间不足**:
  - Cloudflare 免费计划提供 1GB KV 存储空间
  - 启用自动清理功能定期删除过期记录
  - 可以适当缩短 `VERIFICATION_TIMEOUT_DAYS` 减少存储占用

- **验证题目太难/太简单**:
  - 当前使用 3 个运算符的数学表达式（加减乘）
  - 如需调整难度，可以修改 `src/core.js` 中的 `generateMathQuestion()` 函数
  - 支持自定义数字范围和运算符类型

## 🤝 贡献与联系

如果您有任何问题、建议或想贡献代码，请提 Issue/PR 或通过以下方式联系我：

- [LINUX DO](https://linux.do)

## 📄 许可证

- GPL v3，希望你能完善并继续开源，而不是改头换面闭源，谢谢。

---

希望这个工具能让您的 Telegram 私聊体验更加便捷！🎉 如果你只想直接使用，请访问 [@WegramBot](https://t.me/wegram_bot)