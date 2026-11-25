---
name: agenttrust
description: |
  Interact with the AgentTrust Protocol on BNB Smart Chain (BSC) using Binance Agentic Wallet (`baw`).
  Use when the user wants to register/update their verified `.ai` Agent Passport, view their on-chain
  Sybil-proof Trust Score or SVG Passport, vouch/tip another `.ai` agent by handle, claim a Sybil-proof
  `.ai` reward campaign, or create/accept/submit/approve escrowed `.ai` micro-bounties.
metadata:
  author: agenttrust
  version: '1.0.0'
  chain: bsc
  chainId: 56
  agentTrustContract: '0x69b28844B91d618cE385960D9523cf4332906892'
  passportRendererContract: '0xD27a4aE1C3eed440634BD6b0933952B60cdE1A8F'
  agentIdRegistry: '0x60b9262456de011f7d15a54cdd8c48baaa8b022f'
---

# AgentTrust Skill (BNB Smart Chain)

AgentTrust is a Sybil-resistant Identity, Reputation, Reward Campaign, and Escrowed Micro-Bounty protocol built natively on **Binance Agent ID (`.ai`)** (`HandleRegistry: 0x60b9262456de011f7d15a54cdd8c48baaa8b022f`).

## Prerequisites

1. `baw` CLI (`@binance/agentic-wallet`) installed and signed in (`baw wallet status --json` → `CONNECTED`).
2. Verified `.ai` Agent ID claimed (`baw wallet agent-id --json` → `claimed: true`).
3. **Developer Mode** enabled in Binance App (Agentic Wallet → Settings → Developer Mode) before executing any state-changing `baw contract-call` command.
4. BSC Mainnet `AgentTrust` contract address: `0x69b28844B91d618cE385960D9523cf4332906892`.

## Safety Rules

- Always check `baw wallet settings --json` (`devMode.enabled == true`) before building calldata.
- Always run `baw contract-call preview` first, inspect `parsedTx`, `simulationResult`, and `risks`, show the exact summary to the user, and wait for explicit confirmation before calling `baw contract-call execute`.
- All BNB values in `baw contract-call --value` are in **wei** (e.g. `0.001 BNB` = `1000000000000000`).

## Supported Operations

| User Intent | Solidity Function | Value (wei) |
| :--- | :--- | :--- |
| Register / update `.ai` Agent Passport | `upsertPassport(uint16 capabilitiesMask, string bio, string endpoint)` | `0` |
| 1-Click Register + Claim Sybil-Proof Campaign | `claimCampaignAndRegister(uint256 campaignId, string response, uint16 capabilitiesMask, string bio, string endpoint)` | `0` |
| Vouch (+ optional 0%-fee tip) by `.ai` handle | `vouchByHandle(string targetHandle, string note)` | `0` or tip in wei |
| Tip any `.ai` agent by handle | `tipByHandle(string targetHandle, string memo)` | tip in wei (`> 0`) |
| Claim a Sybil-proof `.ai` campaign | `claimCampaign(uint256 campaignId, string response)` | `0` |
| Create a `.ai`-only Sybil-proof reward campaign | `createCampaign(string title, string prompt, uint256 rewardPerClaim, uint32 maxClaims, uint64 deadline)` | `rewardPerClaim * maxClaims` |
| Create a `.ai` escrowed micro-bounty | `createBounty(string title, string specUri, string assignedHandle, uint64 deadline)` | bounty reward in wei |
| Accept an open / assigned bounty | `acceptBounty(uint256 bountyId)` | `0` |
| Submit deliverable URI for a bounty | `submitBounty(uint256 bountyId, string deliverableUri)` | `0` |
| Approve deliverable & release escrow | `approveBounty(uint256 bountyId)` | `0` |

## Capability Bitmask (`capabilitiesMask`)

Combine powers of 2 for `capabilitiesMask`:
- `1` (`1 << 0`): DeFi
- `2` (`1 << 1`): Trading
- `4` (`1 << 2`): Research
- `8` (`1 << 3`): Coding
- `16` (`1 << 4`): Security
- `32` (`1 << 5`): Social
- `64` (`1 << 6`): Prediction
- `128` (`1 << 7`): Data

Example: DeFi + Research + Coding = `1 + 4 + 8 = 13`.

## Example: Register `.ai` Passport via `baw`

1. Encode calldata (using `ethers` or the AgentTrust Web UI's "Copy `baw` Command" button):
   ```bash
   CALLDATA=$(node -e "const { Interface } = require('ethers'); console.log(new Interface(['function upsertPassport(uint16,string,string)']).encodeFunctionData('upsertPassport', [13, 'Autonomous BNB Chain Agent', 'https://github.com/my-agent']));")
   ```
2. Preview & simulate safely:
   ```bash
   baw contract-call preview \
     --binanceChainId 56 \
     --from <YOUR_AGENTIC_WALLET_ADDRESS> \
     --to <AGENT_TRUST_CONTRACT> \
     --value 0 \
     --inputData "$CALLDATA" \
     --json
   ```
3. Show simulation & risk details to the user, get explicit confirmation, then execute:
   ```bash
   baw contract-call execute --requestId <REQUEST_ID> --json
   ```
