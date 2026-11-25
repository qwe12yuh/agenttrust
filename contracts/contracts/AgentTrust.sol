// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IHandleRegistry} from "./interfaces/IHandleRegistry.sol";
import {IPassportRenderer} from "./PassportRenderer.sol";

/// @title AgentTrust
/// @notice Sybil-Resistant AI Agent Identity, Reputation Graph, Reward Campaigns & Escrowed Micro-Bounty Protocol
///         built natively on Binance Agent ID (.ai) on BNB Smart Chain.
/// @dev Immutable, zero-admin, zero-protocol-fee design. All identity & handle resolution reads directly from
///      SPACE ID Agent ID (HandleRegistry: 0x60b9262456de011f7d15a54cdd8c48baaa8b022f).
contract AgentTrust is ReentrancyGuard {
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint256 public constant MAX_BIO_BYTES = 160;
    uint256 public constant MAX_URI_BYTES = 160;
    uint256 public constant MAX_NOTE_BYTES = 200;
    uint256 public constant MAX_TITLE_BYTES = 100;
    uint256 public constant REVIEW_WINDOW = 72 hours;
    uint32 public constant GENESIS_LIMIT = 100;

    // -------------------------------------------------------------------------
    // Immutable Dependencies
    // -------------------------------------------------------------------------

    IHandleRegistry public immutable agentIdRegistry;
    IPassportRenderer public immutable passportRenderer;

    // -------------------------------------------------------------------------
    // Data Structures
    // -------------------------------------------------------------------------

    struct AgentProfile {
        uint32 serial;
        uint64 registeredAt;
        uint64 updatedAt;
        uint32 vouchesReceived;
        uint32 vouchesGiven;
        uint32 bountiesCompleted;
        uint32 campaignsClaimed;
        uint128 tipsReceivedWei;
        uint16 capabilitiesMask;
        string bio;
        string endpoint;
    }

    struct VouchRecord {
        address voucher;
        address target;
        uint64 timestamp;
        uint128 tipWei;
        string note;
    }

    struct VouchFeedItem {
        address voucher;
        string voucherHandle;
        address target;
        string targetHandle;
        uint64 timestamp;
        uint128 tipWei;
        string note;
    }

    struct Campaign {
        uint256 id;
        address creator;
        uint256 rewardPerClaim;
        uint32 maxClaims;
        uint32 claimedCount;
        uint64 createdAt;
        uint64 deadline;
        bool closed;
        string title;
        string prompt;
    }

    struct ClaimRecord {
        address claimer;
        string handle;
        uint64 timestamp;
        string response;
    }

    enum BountyStatus {
        Open,
        Accepted,
        Submitted,
        Completed,
        Cancelled
    }

    struct Bounty {
        uint256 id;
        address poster;
        address assignedAgent; // address(0) means open to any verified .ai Agent ID holder
        address worker;
        uint256 rewardWei;
        uint64 createdAt;
        uint64 deadline;
        uint64 submittedAt;
        BountyStatus status;
        string title;
        string specUri;
        string deliverableUri;
    }

    struct AgentSummary {
        address agent;
        string handle;
        uint32 serial;
        uint256 trustScore;
        uint32 vouchesReceived;
        uint32 bountiesCompleted;
        uint32 campaignsClaimed;
        uint128 tipsReceivedWei;
        uint16 capabilitiesMask;
        string bio;
        string endpoint;
    }

    struct ProtocolStats {
        uint256 totalAgents;
        uint256 totalUniqueInteractors;
        uint256 totalVouches;
        uint256 totalTipsWei;
        uint256 totalCampaigns;
        uint256 totalCampaignClaims;
        uint256 totalBounties;
        uint256 totalBountiesCompleted;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    mapping(address => AgentProfile) private _profiles;
    address[] private _agentList;

    mapping(address => bool) public hasInteracted;
    uint256 public totalUniqueInteractors;

    mapping(address => mapping(address => bool)) public hasVouched;
    VouchRecord[] private _vouches;
    mapping(address => uint256[]) private _receivedVouchIds;
    uint256 public totalTipsWei;

    Campaign[] private _campaigns;
    mapping(uint256 => mapping(address => bool)) public hasClaimedCampaign;
    mapping(uint256 => ClaimRecord[]) private _campaignClaims;
    uint256 public totalCampaignClaims;

    Bounty[] private _bounties;
    uint256 public totalBountiesCompleted;

    /// @notice Fallback pull-payment balance if direct BNB transfer to a smart-contract recipient fails.
    mapping(address => uint256) public pendingWithdrawals;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event PassportUpserted(
        address indexed agent,
        string handle,
        uint32 indexed serial,
        bool isNew,
        uint16 capabilitiesMask
    );

    event AgentVouched(
        uint256 indexed vouchId,
        address indexed voucher,
        address indexed target,
        string voucherHandle,
        string targetHandle,
        uint256 tipWei,
        string note
    );

    event AgentTipped(
        address indexed sender,
        address indexed target,
        string targetHandle,
        uint256 amountWei,
        string memo
    );

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 rewardPerClaim,
        uint32 maxClaims,
        uint64 deadline
    );

    event CampaignClaimed(
        uint256 indexed campaignId,
        address indexed claimer,
        string handle,
        uint256 rewardWei,
        string response
    );

    event CampaignClosed(uint256 indexed campaignId, address indexed creator, uint256 refundedWei);

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed poster,
        address indexed assignedAgent,
        uint256 rewardWei,
        uint64 deadline,
        string title
    );

    event BountyAccepted(uint256 indexed bountyId, address indexed worker, string workerHandle);
    event BountySubmitted(uint256 indexed bountyId, address indexed worker, string deliverableUri);
    event BountyCompleted(uint256 indexed bountyId, address indexed worker, uint256 rewardWei, bool autoReleased);
    event BountyCancelled(uint256 indexed bountyId, address indexed poster, uint256 refundedWei);

    event WithdrawalCredited(address indexed recipient, uint256 amountWei);
    event WithdrawalClaimed(address indexed recipient, uint256 amountWei);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error ZeroAddress();
    error NotAgentIdHolder();
    error HandleNotFound();
    error CannotTargetSelf();
    error AlreadyVouched();
    error StringTooLong();
    error EmptyInput();
    error InvalidAmount();
    error InvalidParams();
    error InvalidDeadline();
    error CampaignNotFound();
    error CampaignInactive();
    error CampaignSoldOut();
    error AlreadyClaimed();
    error Unauthorized();
    error BountyNotFound();
    error InvalidBountyStatus();
    error ReviewWindowNotElapsed();
    error NothingToWithdraw();
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _agentIdRegistry, address _passportRenderer) {
        if (_agentIdRegistry == address(0) || _passportRenderer == address(0)) revert ZeroAddress();
        agentIdRegistry = IHandleRegistry(_agentIdRegistry);
        passportRenderer = IPassportRenderer(_passportRenderer);
    }

    // -------------------------------------------------------------------------
    // Module 1: Identity — On-Chain .ai Agent Passport
    // -------------------------------------------------------------------------

    /// @notice Register or update the caller's verified `.ai` Agent Passport.
    function upsertPassport(
        uint16 capabilitiesMask,
        string calldata bio,
        string calldata endpoint
    ) external {
        string memory handle = _requireAgentId(msg.sender);
        _recordUniqueInteractor(msg.sender);
        _upsertPassportInternal(msg.sender, handle, capabilitiesMask, bio, endpoint);
    }

    function getAgentProfile(address agent) external view returns (AgentProfile memory) {
        return _profiles[agent];
    }

    /// @notice Direct single-call lookup of an agent's verified profile & trust score by `.ai` handle.
    function getAgentSummaryByHandle(string calldata targetHandle) external view returns (AgentSummary memory) {
        (address agent, string memory handle) = _resolveHandle(targetHandle);
        return _buildAgentSummary(agent, handle);
    }

    /// @notice Deterministic Sybil-resistant Trust Score for an Agent ID holder.
    function getTrustScore(address agent) public view returns (uint256 score) {
        if (bytes(agentIdRegistry.handleOf(agent)).length == 0) return 0;

        AgentProfile storage p = _profiles[agent];
        score = 50; // Soulbound Agent ID base
        if (p.serial > 0) {
            score += 50; // Registered passport
            if (p.serial <= GENESIS_LIMIT) {
                score += 50; // Genesis first-100 bonus
            }
        }
        score += uint256(p.vouchesReceived) * 25;
        score += uint256(p.bountiesCompleted) * 40;
        score += uint256(p.campaignsClaimed) * 10;

        // Capped tip bonus (+1 pt per 0.001 BNB received, max +100 pts to prevent pay-to-win)
        uint256 tipBonus = uint256(p.tipsReceivedWei) / 1e15;
        if (tipBonus > 100) tipBonus = 100;
        score += tipBonus;
    }

    /// @notice Renders a 100% on-chain SVG Agent Passport for any verified `.ai` holder.
    function renderPassportSVG(address agent) external view returns (string memory) {
        string memory handle = agentIdRegistry.handleOf(agent);
        if (bytes(handle).length == 0) revert NotAgentIdHolder();

        AgentProfile storage p = _profiles[agent];
        return passportRenderer.renderSVG(
            IPassportRenderer.RenderData({
                handle: handle,
                serial: p.serial,
                trustScore: getTrustScore(agent),
                vouchesReceived: p.vouchesReceived,
                bountiesCompleted: p.bountiesCompleted,
                campaignsClaimed: p.campaignsClaimed,
                capabilitiesMask: p.capabilitiesMask
            })
        );
    }

    /// @notice Paginated read of registered `.ai` agents for zero-backend directory & leaderboard.
    function getAgentsPage(uint256 offset, uint256 limit) external view returns (AgentSummary[] memory items) {
        uint256 total = _agentList.length;
        if (offset >= total || limit == 0) return new AgentSummary[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 len = end - offset;

        items = new AgentSummary[](len);
        for (uint256 i = 0; i < len; ++i) {
            address agent = _agentList[offset + i];
            items[i] = _buildAgentSummary(agent, agentIdRegistry.handleOf(agent));
        }
    }

    // -------------------------------------------------------------------------
    // Module 2: Access Control & Reputation — Sybil-Proof Vouches & .ai Tips
    // -------------------------------------------------------------------------

    /// @notice Endorse another verified `.ai` agent by handle (accepts "alice" or "alice.ai"), with optional 0%-fee BNB tip.
    function vouchByHandle(string calldata targetHandle, string calldata note) external payable nonReentrant {
        string memory voucherHandle = _requireAgentId(msg.sender);
        if (bytes(note).length > MAX_NOTE_BYTES) revert StringTooLong();
        if (msg.value > type(uint128).max) revert InvalidAmount();

        (address target, string memory normalizedTarget) = _resolveHandle(targetHandle);
        if (target == msg.sender) revert CannotTargetSelf();
        if (hasVouched[msg.sender][target]) revert AlreadyVouched();

        _recordUniqueInteractor(msg.sender);

        hasVouched[msg.sender][target] = true;
        _profiles[msg.sender].vouchesGiven += 1;
        _profiles[target].vouchesReceived += 1;

        if (msg.value > 0) {
            _profiles[target].tipsReceivedWei += uint128(msg.value);
            totalTipsWei += msg.value;
        }

        uint256 vouchId = _vouches.length;
        _vouches.push(
            VouchRecord({
                voucher: msg.sender,
                target: target,
                timestamp: uint64(block.timestamp),
                tipWei: uint128(msg.value),
                note: note
            })
        );
        _receivedVouchIds[target].push(vouchId);

        emit AgentVouched(vouchId, msg.sender, target, voucherHandle, normalizedTarget, msg.value, note);

        if (msg.value > 0) {
            _payout(target, msg.value);
        }
    }

    /// @notice Direct 0%-fee BNB tip sent natively to any verified `.ai` handle on-chain.
    function tipByHandle(string calldata targetHandle, string calldata memo) external payable nonReentrant {
        if (msg.value == 0 || msg.value > type(uint128).max) revert InvalidAmount();
        if (bytes(memo).length > MAX_NOTE_BYTES) revert StringTooLong();

        (address target, string memory normalizedTarget) = _resolveHandle(targetHandle);
        if (target == msg.sender) revert CannotTargetSelf();

        if (bytes(agentIdRegistry.handleOf(msg.sender)).length > 0) {
            _recordUniqueInteractor(msg.sender);
        }

        _profiles[target].tipsReceivedWei += uint128(msg.value);
        totalTipsWei += msg.value;

        emit AgentTipped(msg.sender, target, normalizedTarget, msg.value, memo);
        _payout(target, msg.value);
    }

    /// @notice Returns recent vouches received by an agent (newest first).
    function getVouchesFor(address target, uint256 limit) external view returns (VouchRecord[] memory records) {
        uint256[] storage ids = _receivedVouchIds[target];
        uint256 len = ids.length;
        if (len == 0 || limit == 0) return new VouchRecord[](0);

        uint256 count = len < limit ? len : limit;
        records = new VouchRecord[](count);
        for (uint256 i = 0; i < count; ++i) {
            records[i] = _vouches[ids[len - 1 - i]];
        }
    }

    /// @notice Global live vouch feed (newest first) with resolved `.ai` handles for zero-backend UI.
    function getRecentVouches(uint256 limit) external view returns (VouchFeedItem[] memory items) {
        uint256 len = _vouches.length;
        if (len == 0 || limit == 0) return new VouchFeedItem[](0);

        uint256 count = len < limit ? len : limit;
        items = new VouchFeedItem[](count);
        for (uint256 i = 0; i < count; ++i) {
            VouchRecord storage v = _vouches[len - 1 - i];
            items[i] = VouchFeedItem({
                voucher: v.voucher,
                voucherHandle: agentIdRegistry.handleOf(v.voucher),
                target: v.target,
                targetHandle: agentIdRegistry.handleOf(v.target),
                timestamp: v.timestamp,
                tipWei: v.tipWei,
                note: v.note
            });
        }
    }

    // -------------------------------------------------------------------------
    // Module 3: Sybil-Proof .ai Reward / Check-In Campaigns (1 Claim Per .ai)
    // -------------------------------------------------------------------------

    /// @notice Create a Sybil-proof `.ai`-only campaign (supports both BNB-funded drops and 0-BNB on-chain check-ins).
    function createCampaign(
        string calldata title,
        string calldata prompt,
        uint256 rewardPerClaim,
        uint32 maxClaims,
        uint64 deadline
    ) external payable returns (uint256 campaignId) {
        if (bytes(title).length == 0) revert EmptyInput();
        if (bytes(title).length > MAX_TITLE_BYTES || bytes(prompt).length > MAX_NOTE_BYTES) revert StringTooLong();
        if (maxClaims == 0) revert InvalidParams();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (msg.value != rewardPerClaim * uint256(maxClaims)) revert InvalidAmount();

        if (bytes(agentIdRegistry.handleOf(msg.sender)).length > 0) {
            _recordUniqueInteractor(msg.sender);
        }

        campaignId = _campaigns.length;
        _campaigns.push(
            Campaign({
                id: campaignId,
                creator: msg.sender,
                rewardPerClaim: rewardPerClaim,
                maxClaims: maxClaims,
                claimedCount: 0,
                createdAt: uint64(block.timestamp),
                deadline: deadline,
                closed: false,
                title: title,
                prompt: prompt
            })
        );

        emit CampaignCreated(campaignId, msg.sender, title, rewardPerClaim, maxClaims, deadline);
    }

    /// @notice Claim a Sybil-proof campaign reward/check-in (strictly 1 claim per verified `.ai` address).
    function claimCampaign(uint256 campaignId, string calldata response) external nonReentrant {
        string memory handle = _requireAgentId(msg.sender);
        _recordUniqueInteractor(msg.sender);
        _claimCampaignInternal(campaignId, msg.sender, handle, response);
    }

    /// @notice Atomic 1-tx onboarding: registers `.ai` Passport (if new) AND claims a Sybil-proof campaign in one signature.
    /// @dev If caller already registered a passport, preserves their existing profile to prevent accidental overwrite.
    function claimCampaignAndRegister(
        uint256 campaignId,
        string calldata response,
        uint16 capabilitiesMask,
        string calldata bio,
        string calldata endpoint
    ) external nonReentrant {
        string memory handle = _requireAgentId(msg.sender);
        _recordUniqueInteractor(msg.sender);
        if (_profiles[msg.sender].serial == 0) {
            _upsertPassportInternal(msg.sender, handle, capabilitiesMask, bio, endpoint);
        }
        _claimCampaignInternal(campaignId, msg.sender, handle, response);
    }

    /// @notice Close a campaign and refund 100% of unclaimed BNB back to its creator.
    function closeCampaign(uint256 campaignId) external nonReentrant {
        if (campaignId >= _campaigns.length) revert CampaignNotFound();
        Campaign storage c = _campaigns[campaignId];
        if (msg.sender != c.creator) revert Unauthorized();
        if (c.closed) revert CampaignInactive();

        c.closed = true;
        uint256 remainingSlots = uint256(c.maxClaims - c.claimedCount);
        uint256 refundWei = remainingSlots * c.rewardPerClaim;

        emit CampaignClosed(campaignId, msg.sender, refundWei);
        if (refundWei > 0) {
            _payout(msg.sender, refundWei);
        }
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        if (campaignId >= _campaigns.length) revert CampaignNotFound();
        return _campaigns[campaignId];
    }

    function getCampaignsPage(uint256 offset, uint256 limit) external view returns (Campaign[] memory items) {
        uint256 total = _campaigns.length;
        if (offset >= total || limit == 0) return new Campaign[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 len = end - offset;

        items = new Campaign[](len);
        for (uint256 i = 0; i < len; ++i) {
            items[i] = _campaigns[offset + i];
        }
    }

    /// @notice Returns recent verified `.ai` claimers & on-chain responses for a campaign (newest first).
    function getCampaignClaims(uint256 campaignId, uint256 limit) external view returns (ClaimRecord[] memory items) {
        if (campaignId >= _campaigns.length) revert CampaignNotFound();
        ClaimRecord[] storage all = _campaignClaims[campaignId];
        uint256 len = all.length;
        if (len == 0 || limit == 0) return new ClaimRecord[](0);

        uint256 count = len < limit ? len : limit;
        items = new ClaimRecord[](count);
        for (uint256 i = 0; i < count; ++i) {
            items[i] = all[len - 1 - i];
        }
    }

    // -------------------------------------------------------------------------
    // Module 4: Agentic Commerce — .ai Escrowed Micro-Bounties
    // -------------------------------------------------------------------------

    /// @notice Create a BNB-escrowed task bounty open to any verified `.ai` agent or assigned to a specific `.ai` handle.
    function createBounty(
        string calldata title,
        string calldata specUri,
        string calldata assignedHandle,
        uint64 deadline
    ) external payable returns (uint256 bountyId) {
        if (msg.value == 0 || msg.value > type(uint128).max) revert InvalidAmount();
        if (bytes(title).length == 0) revert EmptyInput();
        if (bytes(title).length > MAX_TITLE_BYTES || bytes(specUri).length > MAX_URI_BYTES) revert StringTooLong();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        address assignedAgent = address(0);
        if (bytes(assignedHandle).length > 0) {
            (assignedAgent, ) = _resolveHandle(assignedHandle);
            if (assignedAgent == msg.sender) revert CannotTargetSelf();
        }

        if (bytes(agentIdRegistry.handleOf(msg.sender)).length > 0) {
            _recordUniqueInteractor(msg.sender);
        }

        bountyId = _bounties.length;
        _bounties.push(
            Bounty({
                id: bountyId,
                poster: msg.sender,
                assignedAgent: assignedAgent,
                worker: address(0),
                rewardWei: msg.value,
                createdAt: uint64(block.timestamp),
                deadline: deadline,
                submittedAt: 0,
                status: BountyStatus.Open,
                title: title,
                specUri: specUri,
                deliverableUri: ""
            })
        );

        emit BountyCreated(bountyId, msg.sender, assignedAgent, msg.value, deadline, title);
    }

    /// @notice Accept an open bounty (strictly gated to verified `.ai` Agent ID holders).
    function acceptBounty(uint256 bountyId) external {
        string memory handle = _requireAgentId(msg.sender);
        if (bountyId >= _bounties.length) revert BountyNotFound();

        Bounty storage b = _bounties[bountyId];
        if (b.status != BountyStatus.Open) revert InvalidBountyStatus();
        if (block.timestamp > b.deadline) revert InvalidDeadline();
        if (msg.sender == b.poster) revert CannotTargetSelf();
        if (b.assignedAgent != address(0) && b.assignedAgent != msg.sender) revert Unauthorized();

        _recordUniqueInteractor(msg.sender);

        b.worker = msg.sender;
        b.status = BountyStatus.Accepted;

        emit BountyAccepted(bountyId, msg.sender, handle);
    }

    /// @notice Submit a deliverable URI/proof hash for an accepted bounty.
    function submitBounty(uint256 bountyId, string calldata deliverableUri) external {
        if (bountyId >= _bounties.length) revert BountyNotFound();
        if (bytes(deliverableUri).length == 0) revert EmptyInput();
        if (bytes(deliverableUri).length > MAX_URI_BYTES) revert StringTooLong();

        Bounty storage b = _bounties[bountyId];
        if (b.status != BountyStatus.Accepted) revert InvalidBountyStatus();
        if (msg.sender != b.worker) revert Unauthorized();

        b.deliverableUri = deliverableUri;
        b.submittedAt = uint64(block.timestamp);
        b.status = BountyStatus.Submitted;

        emit BountySubmitted(bountyId, msg.sender, deliverableUri);
    }

    /// @notice Poster approves the submitted deliverable and releases 100% of escrowed BNB to the `.ai` worker.
    function approveBounty(uint256 bountyId) external nonReentrant {
        if (bountyId >= _bounties.length) revert BountyNotFound();
        Bounty storage b = _bounties[bountyId];
        if (msg.sender != b.poster) revert Unauthorized();
        if (b.status != BountyStatus.Submitted) revert InvalidBountyStatus();

        b.status = BountyStatus.Completed;
        _profiles[b.worker].bountiesCompleted += 1;
        totalBountiesCompleted += 1;

        uint256 reward = b.rewardWei;
        emit BountyCompleted(bountyId, b.worker, reward, false);
        _payout(b.worker, reward);
    }

    /// @notice Worker claims escrowed payout if poster does not respond within the 72-hour review window.
    function autoReleaseBounty(uint256 bountyId) external nonReentrant {
        if (bountyId >= _bounties.length) revert BountyNotFound();
        Bounty storage b = _bounties[bountyId];
        if (msg.sender != b.worker) revert Unauthorized();
        if (b.status != BountyStatus.Submitted) revert InvalidBountyStatus();
        if (block.timestamp < uint256(b.submittedAt) + REVIEW_WINDOW) revert ReviewWindowNotElapsed();

        b.status = BountyStatus.Completed;
        _profiles[b.worker].bountiesCompleted += 1;
        totalBountiesCompleted += 1;

        uint256 reward = b.rewardWei;
        emit BountyCompleted(bountyId, b.worker, reward, true);
        _payout(b.worker, reward);
    }

    /// @notice Poster cancels an open bounty, or reclaims an accepted bounty whose worker missed the deadline.
    function cancelBounty(uint256 bountyId) external nonReentrant {
        if (bountyId >= _bounties.length) revert BountyNotFound();
        Bounty storage b = _bounties[bountyId];
        if (msg.sender != b.poster) revert Unauthorized();

        bool canCancel = (b.status == BountyStatus.Open) ||
            (b.status == BountyStatus.Accepted && block.timestamp > b.deadline);
        if (!canCancel) revert InvalidBountyStatus();

        b.status = BountyStatus.Cancelled;
        uint256 refund = b.rewardWei;

        emit BountyCancelled(bountyId, msg.sender, refund);
        _payout(b.poster, refund);
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        if (bountyId >= _bounties.length) revert BountyNotFound();
        return _bounties[bountyId];
    }

    function getBountiesPage(uint256 offset, uint256 limit) external view returns (Bounty[] memory items) {
        uint256 total = _bounties.length;
        if (offset >= total || limit == 0) return new Bounty[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 len = end - offset;

        items = new Bounty[](len);
        for (uint256 i = 0; i < len; ++i) {
            items[i] = _bounties[offset + i];
        }
    }

    // -------------------------------------------------------------------------
    // Pull-Payment Fallback & Global Views
    // -------------------------------------------------------------------------

    /// @notice Withdraw any BNB held in fallback escrow if a previous direct push transfer reverted.
    function withdrawPending() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        pendingWithdrawals[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit WithdrawalClaimed(msg.sender, amount);
    }

    /// @notice Resolve any handle (accepts "alice", "alice.ai", or uppercase variants) via HandleRegistry.
    function resolveAgentHandle(string calldata input) external view returns (address owner, string memory normalized) {
        normalized = _normalizeHandle(input);
        owner = agentIdRegistry.ownerOfHandle(normalized);
    }

    /// @notice Aggregate on-chain metrics for dashboards and hackathon verification.
    function getProtocolStats() external view returns (ProtocolStats memory) {
        return ProtocolStats({
            totalAgents: _agentList.length,
            totalUniqueInteractors: totalUniqueInteractors,
            totalVouches: _vouches.length,
            totalTipsWei: totalTipsWei,
            totalCampaigns: _campaigns.length,
            totalCampaignClaims: totalCampaignClaims,
            totalBounties: _bounties.length,
            totalBountiesCompleted: totalBountiesCompleted
        });
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------

    function _buildAgentSummary(address agent, string memory handle) internal view returns (AgentSummary memory) {
        AgentProfile storage p = _profiles[agent];
        return AgentSummary({
            agent: agent,
            handle: handle,
            serial: p.serial,
            trustScore: getTrustScore(agent),
            vouchesReceived: p.vouchesReceived,
            bountiesCompleted: p.bountiesCompleted,
            campaignsClaimed: p.campaignsClaimed,
            tipsReceivedWei: p.tipsReceivedWei,
            capabilitiesMask: p.capabilitiesMask,
            bio: p.bio,
            endpoint: p.endpoint
        });
    }

    function _requireAgentId(address account) internal view returns (string memory handle) {
        handle = agentIdRegistry.handleOf(account);
        if (bytes(handle).length == 0) revert NotAgentIdHolder();
    }

    function _recordUniqueInteractor(address account) internal {
        if (!hasInteracted[account]) {
            hasInteracted[account] = true;
            totalUniqueInteractors += 1;
        }
    }

    function _upsertPassportInternal(
        address agent,
        string memory handle,
        uint16 capabilitiesMask,
        string calldata bio,
        string calldata endpoint
    ) internal {
        if (bytes(bio).length > MAX_BIO_BYTES || bytes(endpoint).length > MAX_URI_BYTES) {
            revert StringTooLong();
        }

        AgentProfile storage p = _profiles[agent];
        bool isNew = (p.serial == 0);
        if (isNew) {
            _agentList.push(agent);
            p.serial = uint32(_agentList.length);
            p.registeredAt = uint64(block.timestamp);
        }
        p.updatedAt = uint64(block.timestamp);
        p.capabilitiesMask = capabilitiesMask;
        p.bio = bio;
        p.endpoint = endpoint;

        emit PassportUpserted(agent, handle, p.serial, isNew, capabilitiesMask);
    }

    function _claimCampaignInternal(
        uint256 campaignId,
        address claimer,
        string memory handle,
        string calldata response
    ) internal {
        if (campaignId >= _campaigns.length) revert CampaignNotFound();
        if (bytes(response).length > MAX_NOTE_BYTES) revert StringTooLong();

        Campaign storage c = _campaigns[campaignId];
        if (c.closed || block.timestamp > c.deadline) revert CampaignInactive();
        if (c.claimedCount >= c.maxClaims) revert CampaignSoldOut();
        if (hasClaimedCampaign[campaignId][claimer]) revert AlreadyClaimed();

        hasClaimedCampaign[campaignId][claimer] = true;
        c.claimedCount += 1;
        _profiles[claimer].campaignsClaimed += 1;
        totalCampaignClaims += 1;

        _campaignClaims[campaignId].push(
            ClaimRecord({
                claimer: claimer,
                handle: handle,
                timestamp: uint64(block.timestamp),
                response: response
            })
        );

        uint256 reward = c.rewardPerClaim;
        emit CampaignClaimed(campaignId, claimer, handle, reward, response);
        if (reward > 0) {
            _payout(claimer, reward);
        }
    }

    function _resolveHandle(string calldata input) internal view returns (address owner, string memory normalized) {
        normalized = _normalizeHandle(input);
        owner = agentIdRegistry.ownerOfHandle(normalized);
        if (owner == address(0)) revert HandleNotFound();
    }

    /// @dev Lowercases ASCII letters and strips an optional trailing ".ai".
    function _normalizeHandle(string calldata input) internal pure returns (string memory) {
        bytes calldata raw = bytes(input);
        uint256 len = raw.length;
        if (len == 0) revert EmptyInput();

        if (len > 3) {
            bytes1 c0 = raw[len - 3];
            bytes1 c1 = raw[len - 2];
            bytes1 c2 = raw[len - 1];
            bool isDotAi = (c0 == 0x2e) &&
                (c1 == 0x61 || c1 == 0x41) &&
                (c2 == 0x69 || c2 == 0x49);
            if (isDotAi) {
                len -= 3;
            }
        }

        bytes memory out = new bytes(len);
        for (uint256 i = 0; i < len; ++i) {
            uint8 ch = uint8(raw[i]);
            if (ch >= 0x41 && ch <= 0x5a) {
                out[i] = bytes1(ch + 32);
            } else {
                out[i] = raw[i];
            }
        }
        return string(out);
    }

    function _payout(address recipient, uint256 amount) internal {
        (bool ok, ) = payable(recipient).call{value: amount, gas: 30_000}("");
        if (!ok) {
            pendingWithdrawals[recipient] += amount;
            emit WithdrawalCredited(recipient, amount);
        }
    }
}
