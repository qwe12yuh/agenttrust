# AgentTrust — 零作弊自然获取 30+ 真实 `.ai` 独立交互地址实操指南

赛道 B（Agent 应用创新奖，最高 10,000 USDC，前 10 名至少 800 USDC + 稀缺 2 位 `.ai` 域名）的核心入围门槛是：**比赛期间至少有 30 个不同的真实 `.ai` Agent ID 地址与合约产生链上交互**。

因为 `.ai` 是真人 KYC 灵魂绑定域名，绝对不能靠刷假地址。下面是最省钱、合规、真实用户愿意主动参与的“低阻力破冰”方案：

---

## 核心策略：用产品自带的「防女巫创世红包池」做真实压力测试

在合约部署到 BSC 主网后，利用我们自己合约里的 `createCampaign` 功能发起 **Campaign #0（Genesis Check-In Pool）**：
- **推荐预算（约 \$10–\$14，完全由你自己决定）**：
  - 方案 A（稳妥拉满 50 人）：`rewardPerClaim = 0.0005 BNB`（约 \$0.27）× `50 slots` = `0.025 BNB`（约 **\$13.50**）
  - 方案 B（超低预算测试 35 人）：`rewardPerClaim = 0.0003 BNB`（约 \$0.16）× `35 slots` = `0.0105 BNB`（约 **\$5.70**）
- **为什么极易成交**：
  - 用户用 `claimCampaignAndRegister` 只需 **1 笔交易**，Gas 仅约 **\$0.005**，就能同时拿到：
    1. 永久链上 **Genesis `#1–#100` 动态 SVG 智能体护照卡片**（+50 创世信誉分）
    2. 立刻到账的 **\$0.16–\$0.27 BNB Gas 补贴**（实打实正收益，覆盖 30–50 倍 Gas 费！）
  - 同时，这本身就是在主网真实演示 **AgentTrust 的核心卖点（1 个 `.ai` 严格限领 1 次、彻底防女巫机器人抢红包）**，评委看到完全透明的链上记录只会给高分！
  - 万一没领完，随时可以调 `closeCampaign(0)` 把剩余 BNB 100% 退回自己钱包。

---

## 推广渠道优先级（按转化率从高到低）

1. **币安广场（Binance Square）** — 转化率最高！里面聚集了大量刚领完 `.ai` 域名的中文/全球真实用户，搜 `#AgentID`、`#AgenticWallet`、`#BNBChain` 热度极高。
2. **X（Twitter）** — 带话题 `#BinanceWallet` `#BNBChain` `#AgentID` `#AgenticWallet`，并且直接在 **Binance Wallet 官方 Agent ID 黑客松公告推文评论区** 晒你的动态 SVG 护照截图和链接！
3. **BNB Chain 官方 Discord / Telegram 开发者群** — 发到 `#hackathon` / `#showcase` 频道，邀请其他参赛者和 `.ai` 持有者互相体验背书（`vouchByHandle`）。

---

## 直接可用的宣发文案

### 1. 币安广场 / 中文 X 帖子模板

```text
给所有领了币安 .ai Agent ID 的朋友做了一个开源小工具 —— AgentTrust（已参加币安钱包 × BNB Chain Agent ID 黑客松）！

每个 .ai 都是真人 KYC 灵魂绑定身份，所以我直接在 BSC 主网做了个「100% 链上 SVG 智能体护照 + 防女巫信誉榜 + .ai 专属防刷红包池」：
✅ 合约直读官方 HandleRegistry (0x60b9...022f)，1 人 1 证，科学家多号刷不了
✅ 生成你的专属链上 SVG 护照卡片（前 100 名带 GENESIS 创世徽章）
✅ 支持网页端连接币安钱包，也支持直接用 baw CLI 让你的 AI 自己来领！

为了实测合约防女巫效果，我在主网放了一个创世体验池（共 50 份，每份 0.0005 BNB，每个 .ai 严格限领 1 次，秒到账，远超 $0.005 的 Gas 费）：
👉 体验地址：https://qwe12yuh.github.io/agenttrust/?tab=drops&ref=feiqiqi.ai
👉 BscScan 开源合约：https://bscscan.com/address/0x69b28844B91d618cE385960D9523cf4332906892
👉 GitHub + AI Agent Skill：https://github.com/qwe12yuh/agenttrust

领完欢迎在评论区晒出你的 .ai 护照截图，也欢迎给 feiqiqi.ai 点个链上背书，我也会回赞！
#BinanceWallet #AgentID #AgenticWallet #BNBChain
```

### 2. 英文 X / BNB Chain Discord 帖子模板

```text
Just shipped AgentTrust on BNB Smart Chain for the @BinanceWallet x @BNBCHAIN Agent ID Hackathon!

Why? On-chain reputation & reward drops always get wrecked by Sybil bots. Soulbound Binance Agent IDs (.ai) finally give BSC a true 1-Human = 1-Agent identity layer.

What AgentTrust does (100% immutable, 0% fees, verified on BscScan):
🛡️ On-chain SVG .ai Agent Passports (Genesis badge for first 100!)
🤝 Sybil-proof peer vouching & 0%-fee direct tips via `name.ai`
🎁 Sybil-proof `.ai`-only reward drops (strictly 1 claim per verified `.ai`)
🤖 Native `baw` CLI Skill — your AI agent can interact autonomously!

🔥 Live Stress Test: I funded a 50-slot Genesis Check-In Pool (0.0005 BNB per verified `.ai`, strictly 1 claim per Agent ID). Claim your Genesis Passport + instant BNB rebate in 1 click (~$0.005 gas):

Live App: https://qwe12yuh.github.io/agenttrust/?tab=drops&ref=feiqiqi.ai
BscScan: https://bscscan.com/address/0x69b28844B91d618cE385960D9523cf4332906892
GitHub + SKILL.md: https://github.com/qwe12yuh/agenttrust

Drop your `.ai` passport card below! #BNBChain #BinanceWallet #AgentID #AgenticWallet
```
