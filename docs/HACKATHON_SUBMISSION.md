# Binance Wallet × BNB Chain Agent ID Hackathon — Submission Kit

> **Submission Deadline**: December 9, 2026, 08:00 UTC  
> **Target Track**: Agent Application Innovation Award (29,000 USDC + Rare 2-char `.ai` Agent ID) + Ecosystem Pioneer Award eligibility

---

## Pre-Submission Checklist

- [x] Deploy `AgentTrust.sol` (`0x69b28844B91d618cE385960D9523cf4332906892`) & `PassportRenderer.sol` (`0xD27a4aE1C3eed440634BD6b0933952B60cdE1A8F`) to **BNB Smart Chain Mainnet (chainId 56)** bound to `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`
- [x] Verify & open-source contract source code on **BscScan** (`AgentTrust`: https://bscscan.com/address/0x69b28844B91d618cE385960D9523cf4332906892#code , `PassportRenderer`: https://bscscan.com/address/0xD27a4aE1C3eed440634BD6b0933952B60cdE1A8F#code )
- [x] Push full repo to public **GitHub** (`https://github.com/qwe12yuh/agenttrust`)
- [x] Deploy `frontend/` live to **GitHub Pages HTTPS** (`https://qwe12yuh.github.io/agenttrust/`)
- [x] Register Genesis Passport `#1` (`feiqiqi.ai`, Trust Score `150 PTS`) live on BSC Mainnet via `baw contract-call`: https://bscscan.com/tx/0xfd64f6821ddf75d421888c2bb598ae17c001b548d1e9664ddb0ac2ff8f7c3ff2
- [x] Launch live Sybil-Proof Campaign `#0` (`BNB Chain Agent ID Hackathon Genesis Check-In`) via `baw contract-call`: https://bscscan.com/tx/0xb8bb43d3123e64c7135d9a06eb8767c9ff2da070dc6bfe49e63f8d06fe4f7376
- [ ] (Recommended) Launch Genesis Campaign #0 (e.g., 40–50 slots × `0.0005 BNB`) to organically attract **30+ unique real `.ai` Agent ID interactors**
- [ ] Confirm `getProtocolStats().totalUniqueInteractors >= 30` on BscScan before December 9, 08:00 UTC
- [ ] Submit project form via the official Binance Wallet Announcement portal

---

## Copy-Paste Submission Answers (English — Recommended for Global Judges)

### Project Name
**AgentTrust**

### One-Line Tagline
Sybil-Proof `.ai` Agent Passports, On-Chain Reputation Graph, 1-Per-Agent-ID Reward Pools & Escrowed AI Micro-Bounties on BNB Chain.

### Problem & Why Agent ID (`.ai`) Is Essential
On-chain reputation, community reward drops, and decentralized task markets are chronically broken by Sybil attacks — anyone can generate 1,000 disposable wallets to farm drops or fake endorsements.

Binance Agent ID (`HandleRegistry: 0x60b9262456de011f7d15a54cdd8c48baaa8b022f`) solves this at the identity layer: **each KYC-verified Binance user gets at most one non-transferable, soulbound `.ai` handle**. AgentTrust integrates `HandleRegistry` directly on-chain (`handleOf` + `ownerOfHandle`) to turn `.ai` into a composable **Identity, Access Control, and Payment** layer for the emerging Agentic Economy.

### How Agent ID Is Integrated (All 3 Official Use Cases)
1. **Identity**: `AgentTrust` calls `HandleRegistry.handleOf(msg.sender)` on-chain to verify ownership and render a 100% on-chain SVG Agent Passport (`renderPassportSVG`) displaying the user's verified `name.ai`, Genesis serial, capabilities, and deterministic Trust Score.
2. **Access Control**:
   - Peer vouching (`vouchByHandle`) is strictly restricted to verified `.ai` holders, 1 vouch per unique `.ai` pair.
   - Reward/check-in campaigns (`claimCampaign` / `claimCampaignAndRegister`) mathematically enforce **1 claim per unique `.ai` address**, stopping multi-wallet bots at the EVM level.
   - Micro-bounties (`acceptBounty`) restrict workers to verified `.ai` holders (or a specific `.ai` handle assigned by the poster).
3. **Payments**:
   - Native `.ai` handle-addressed 0%-fee tipping (`tipByHandle("alice.ai")` / `vouchByHandle("alice.ai")`) resolved trustlessly on-chain via `HandleRegistry.ownerOfHandle`.
   - Trustless BNB escrow for AI micro-bounties with a 72-hour anti-ghosting `autoReleaseBounty` safeguard and pull-payment fallback.
4. **Native AI Agent UX (`baw` CLI + `SKILL.md`)**:
   - Beyond the bilingual (EN/ZH) Web3 frontend, AgentTrust ships with `skill/agenttrust/SKILL.md` and an in-app **`baw contract-call preview` calldata generator** so any user's AI agent (Binance AI Pro, Claude, OpenClaw, Antigravity) can autonomously register passports, claim Sybil-proof drops, vouch, tip, and accept bounties.

### How to Test / Verify (For Judges)
1. Open the live dApp URL and enter any `.ai` handle (e.g. `feiqiqi.ai`) in the **Live BSC Mainnet .ai Handle Verifier** — resolves directly against `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`.
2. Connect a wallet holding a Binance `.ai` Agent ID (or switch to the **AI Agent (`baw` CLI)** tab to copy a pre-encoded `baw contract-call preview` command).
3. Register a Genesis Passport (`upsertPassport`) or use **1-Click Register + Claim** (`claimCampaignAndRegister`) on an active Sybil-proof drop.
4. Call `renderPassportSVG(address)` on BscScan or download the live SVG card in the UI.
5. Vouch/tip another `.ai` handle via `vouchByHandle("feiqiqi.ai", "...")` and watch the Trust Score update immediately on-chain.
