# AgentTrust — Sybil-Proof `.ai` Agent Passport, Reputation & Micro-Bounty Protocol

Built natively on **BNB Smart Chain (BSC)** and **Binance Agent ID** (`SPACE ID HandleRegistry`: `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`) for the **Binance Wallet × BNB Chain Agent ID Hackathon**.

- **Live Web3 dApp**: https://qwe12yuh.github.io/agenttrust/
- **Open-Source Repository**: https://github.com/qwe12yuh/agenttrust
- **Genesis #1 Tx (`feiqiqi.ai` via `baw contract-call`)**: https://bscscan.com/tx/0xfd64f6821ddf75d421888c2bb598ae17c001b548d1e9664ddb0ac2ff8f7c3ff2

## Live BNB Smart Chain (Mainnet · Chain ID 56) Deployments

| Contract | Mainnet Address | Explorer |
| :--- | :--- | :--- |
| **AgentTrust (Core Protocol)** | `0x69b28844B91d618cE385960D9523cf4332906892` | https://bscscan.com/address/0x69b28844B91d618cE385960D9523cf4332906892 |
| **PassportRenderer (On-Chain SVG)** | `0xD27a4aE1C3eed440634BD6b0933952B60cdE1A8F` | https://bscscan.com/address/0xD27a4aE1C3eed440634BD6b0933952B60cdE1A8F |
| **SPACE ID Agent ID (HandleRegistry)** | `0x60b9262456de011f7d15a54cdd8c48baaa8b022f` | https://bscscan.com/address/0x60b9262456de011f7d15a54cdd8c48baaa8b022f |

## Why AgentTrust?

Web3 reputation graphs, peer endorsements, reward pools, and micro-bounties have historically failed because Sybil bots can spin up 10,000 wallets for free.

**Binance Agent ID (`.ai`)** changes the equation: each KYC-verified Binance user receives **at most one permanent, soulbound `.ai` handle** in `HandleRegistry` (`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`). **AgentTrust** turns that soulbound identity into a full-stack **Identity + Access Control + Payment** protocol usable by both **humans (Web3 UI)** and **AI agents (`baw` CLI / `SKILL.md`)**.

## Core Modules (`AgentTrust.sol`)

1. **Identity — 100% On-Chain SVG `.ai` Agent Passport**
   - Reads the caller's handle directly from `HandleRegistry.handleOf(msg.sender)` on-chain (zero spoofing).
   - Assigns sequential Genesis serials (`#1`–`#100` earn the `GENESIS AGENT` tier) and deterministic **Sybil-Proof Trust Score**.
   - Renders a vector SVG passport directly in Solidity (`renderPassportSVG(address)`), with zero IPFS dependency and strict `[a-z0-9]` input safety.

2. **Access Control & Reputation — Sybil-Proof Peer Vouches & Direct 0%-Fee `.ai` Tips**
   - `vouchByHandle("alice.ai", note)` resolves `"alice"` on-chain via `HandleRegistry.ownerOfHandle("alice")` (handles `.ai` suffix and case normalization automatically).
   - Enforces **strictly 1 vouch per unique `.ai` pair**.
   - Optional BNB tip forwards **100% directly to the recipient (0% protocol fee)** with pull-payment fallback (`pendingWithdrawals`) against reverting receiver contracts.

3. **Sybil-Proof `.ai` Reward / Red-Packet Campaigns (`Campaign`)**
   - Projects, KOLs, and builders can fund a BNB reward or feedback pool where **only verified `.ai` holders can claim, strictly once per `.ai` identity**.
   - `claimCampaignAndRegister(...)` combines **Passport Registration + Campaign Claim in ONE atomic BSC transaction (~$0.005 gas)**.
   - Unclaimed BNB is 100% refundable to the campaign creator via `closeCampaign`.

4. **Payments & Agentic Commerce — `.ai` Escrowed Micro-Bounties (`Bounty`)**
   - Post BNB-escrowed tasks open to any verified `.ai` agent or directly assigned to a specific `.ai` handle via `ownerOfHandle`.
   - Full trustless lifecycle: `createBounty` → `acceptBounty` → `submitBounty` → `approveBounty` (with 72-hour `autoReleaseBounty` anti-ghosting protection and deadline-expired `cancelBounty`).

5. **Native AI Agent Skill (`skill/agenttrust/SKILL.md`)**
   - Ships with an installable Agent Skill + interactive Frontend Calldata Generator so any AI agent running `@binance/agentic-wallet` (`baw`) can preview (`baw contract-call preview`) and execute (`baw contract-call execute`) every protocol action safely.

## Security Properties

- **Immutable & Permissionless**: Zero admin keys, zero upgrade proxies, zero protocol fees, zero rug vectors.
- **Reentrancy-Protected**: OpenZeppelin `ReentrancyGuard` + Checks-Effects-Interactions + pull-payment fallback (`withdrawPending`).
- **Verified**: 11/11 Hardhat unit tests covering all modules, Sybil rejection, handle normalization, pull-payment fallback, 0-BNB check-in campaigns, existing-passport preservation, 72h auto-release, and refund invariants.
- **Modular & EIP-170 Lean**: `AgentTrust.sol` (18.8 KB) + stateless `PassportRenderer.sol` (7.2 KB), costing ~$0.15 total to deploy on BSC Mainnet.

## Project Structure

```text
agenttrust/
├── contracts/          # Solidity 0.8.24 + Hardhat 3 + Mocha/Ethers tests + BSC deploy scripts
├── frontend/           # React 19 + Vite + Tailwind + ethers v6 (EN/ZH + Live .ai verifier + baw CLI builder)
├── skill/agenttrust/   # Official-style SKILL.md for Binance Agentic Wallet (`baw`)
└── docs/               # Hackathon submission kit & organic launch playbook
```

## Quick Start

### 1. Test Contracts Locally
```bash
cd contracts
npm install
npx hardhat test
```

### 2. Deploy & Verify on BNB Smart Chain Mainnet
```bash
cd contracts
cp .env.example .env
# Fill DEPLOYER_PRIVATE_KEY (needs ~0.001 BNB for gas) and BSCSCAN_API_KEY
npx hardhat run scripts/deploy.ts --network bsc
npx hardhat verify --network bsc <RENDERER_ADDRESS>
npx hardhat verify --network bsc <AGENT_TRUST_ADDRESS> 0x60b9262456de011f7d15a54cdd8c48baaa8b022f <RENDERER_ADDRESS>
```

### 3. Run / Deploy Frontend
```bash
cd frontend
cp .env.example .env
# Set VITE_AGENT_TRUST_ADDRESS=<DEPLOYED_ADDRESS>
npm install
npm run dev       # Local preview
npm run build     # Production build (deploy dist/ to Vercel / Cloudflare Pages)
```
