import { expect } from "chai";
import { network } from "hardhat";

describe("AgentTrust Protocol", function () {
  async function deployFixture() {
    const { ethers, networkHelpers } = await network.create();
    const [deployer, alice, bob, charlie, noIdUser] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("MockHandleRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    await registry.mockMint(alice.address, "alice");
    await registry.mockMint(bob.address, "bob");
    await registry.mockMint(charlie.address, "charlie");

    const Renderer = await ethers.getContractFactory("PassportRenderer");
    const renderer = await Renderer.deploy();
    await renderer.waitForDeployment();

    const AgentTrust = await ethers.getContractFactory("AgentTrust");
    const trust = await AgentTrust.deploy(await registry.getAddress(), await renderer.getAddress());
    await trust.waitForDeployment();

    return { ethers, networkHelpers, registry, trust, deployer, alice, bob, charlie, noIdUser };
  }

  describe("Module 1: Identity & On-Chain SVG Passport", function () {
    it("allows verified .ai holders to register, update, and query by handle", async function () {
      const { trust, alice } = await deployFixture();

      await expect(
        trust.connect(alice).upsertPassport(0b00001101, "Autonomous DeFi & Coding Agent", "https://alice.ai")
      )
        .to.emit(trust, "PassportUpserted")
        .withArgs(alice.address, "alice", 1, true, 0b00001101);

      const summary = await trust.getAgentSummaryByHandle("ALICE.AI");
      expect(summary.agent).to.equal(alice.address);
      expect(summary.handle).to.equal("alice");
      expect(summary.serial).to.equal(1n);
      expect(summary.trustScore).to.equal(150n); // 50 base + 50 passport + 50 genesis

      // Update preserves serial #1
      await expect(trust.connect(alice).upsertPassport(0b00010001, "Updated Bio", "https://alice.ai/mcp"))
        .to.emit(trust, "PassportUpserted")
        .withArgs(alice.address, "alice", 1, false, 0b00010001);

      const svg = await trust.renderPassportSVG(alice.address);
      expect(svg).to.include("<svg");
      expect(svg).to.include("alice");
      expect(svg).to.include("GENESIS AGENT");
      expect(svg).to.include("150 PTS");
    });

    it("blocks non-Agent-ID wallets from registering or rendering passport", async function () {
      const { trust, noIdUser } = await deployFixture();
      await expect(
        trust.connect(noIdUser).upsertPassport(1, "Sybil bot", "")
      ).to.be.revertedWithCustomError(trust, "NotAgentIdHolder");
      await expect(trust.renderPassportSVG(noIdUser.address)).to.be.revertedWithCustomError(
        trust,
        "NotAgentIdHolder"
      );
    });

    it("normalizes .ai suffix and uppercase handles seamlessly", async function () {
      const { trust, alice } = await deployFixture();

      const [owner1, norm1] = await trust.resolveAgentHandle("ALICE.AI");
      expect(owner1).to.equal(alice.address);
      expect(norm1).to.equal("alice");

      const [owner2, norm2] = await trust.resolveAgentHandle("alice");
      expect(owner2).to.equal(alice.address);
      expect(norm2).to.equal("alice");
    });
  });

  describe("Module 2: Sybil-Proof Vouches, Global Feed & Direct .ai Tipping", function () {
    it("allows 1 vouch per unique .ai pair, forwards 100% BNB tip, and populates global vouch feed", async function () {
      const { ethers, trust, alice, bob, charlie } = await deployFixture();
      await trust.connect(bob).upsertPassport(1, "Bob AI", "");

      const bobBefore = await ethers.provider.getBalance(bob.address);
      const tip = ethers.parseEther("0.01");

      await expect(
        trust.connect(alice).vouchByHandle("Bob.ai", "Fast and reliable signal agent", { value: tip })
      )
        .to.emit(trust, "AgentVouched")
        .withArgs(0, alice.address, bob.address, "alice", "bob", tip, "Fast and reliable signal agent");

      expect((await ethers.provider.getBalance(bob.address)) - bobBefore).to.equal(tip);

      // Duplicate vouch reverts
      await expect(trust.connect(alice).vouchByHandle("bob", "Spam vouch")).to.be.revertedWithCustomError(
        trust,
        "AlreadyVouched"
      );

      // Self-vouch reverts
      await expect(trust.connect(alice).vouchByHandle("alice.ai", "Self")).to.be.revertedWithCustomError(
        trust,
        "CannotTargetSelf"
      );

      // Charlie also vouches for Bob without tip
      await trust.connect(charlie).vouchByHandle("bob.ai", "Solid security audits");

      // Bob score: 150 (genesis) + 50 (2 vouches) + 10 (0.01 BNB tip) = 210
      expect(await trust.getTrustScore(bob.address)).to.equal(210n);

      const feed = await trust.getRecentVouches(5);
      expect(feed.length).to.equal(2);
      expect(feed[0].voucherHandle).to.equal("charlie");
      expect(feed[0].targetHandle).to.equal("bob");
      expect(feed[1].voucherHandle).to.equal("alice");
      expect(feed[1].tipWei).to.equal(tip);
    });

    it("supports direct .ai tipping even from non-Agent-ID senders", async function () {
      const { ethers, trust, alice, noIdUser } = await deployFixture();
      const tip = ethers.parseEther("0.005");
      const before = await ethers.provider.getBalance(alice.address);

      await expect(trust.connect(noIdUser).tipByHandle("alice.ai", "Great research!", { value: tip }))
        .to.emit(trust, "AgentTipped")
        .withArgs(noIdUser.address, alice.address, "alice", tip, "Great research!");

      expect((await ethers.provider.getBalance(alice.address)) - before).to.equal(tip);
    });

    it("credits pull-payment fallback when recipient contract rejects BNB", async function () {
      const { ethers, registry, trust, alice } = await deployFixture();
      const Receiver = await ethers.getContractFactory("RevertingReceiver");
      const receiver = await Receiver.deploy();
      await receiver.waitForDeployment();
      const recvAddr = await receiver.getAddress();
      await registry.mockMint(recvAddr, "vaultbot");

      const tip = ethers.parseEther("0.02");
      await expect(trust.connect(alice).tipByHandle("vaultbot.ai", "Test fallback", { value: tip }))
        .to.emit(trust, "WithdrawalCredited")
        .withArgs(recvAddr, tip);

      expect(await trust.pendingWithdrawals(recvAddr)).to.equal(tip);

      await receiver.setAccept(true);
      await receiver.claimFallback(await trust.getAddress());
      expect(await ethers.provider.getBalance(recvAddr)).to.equal(tip);
      expect(await trust.pendingWithdrawals(recvAddr)).to.equal(0n);
    });
  });

  describe("Module 3: Sybil-Proof .ai Campaigns, 0-BNB Check-Ins & Safe Combo Onboarding", function () {
    it("enforces 1 claim per .ai address, records claimers, preserves existing passport, and refunds unused BNB", async function () {
      const { ethers, trust, deployer, alice, bob, noIdUser } = await deployFixture();

      const reward = ethers.parseEther("0.001");
      const maxClaims = 3;
      const latestBlock = await ethers.provider.getBlock("latest");
      const deadline = BigInt(latestBlock!.timestamp + 3600);

      await trust
        .connect(deployer)
        .createCampaign("Genesis Check-in", "Introduce your AI agent!", reward, maxClaims, deadline, {
          value: reward * BigInt(maxClaims),
        });

      await expect(trust.connect(noIdUser).claimCampaign(0, "Bot")).to.be.revertedWithCustomError(
        trust,
        "NotAgentIdHolder"
      );

      // Alice uses 1-click atomic registration + claim
      const aliceBefore = await ethers.provider.getBalance(alice.address);
      const tx = await trust
        .connect(alice)
        .claimCampaignAndRegister(0, "Hi from alice.ai!", 0b00000101, "Alpha hunter", "https://alice.ai");
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      expect((await ethers.provider.getBalance(alice.address)) + gasCost - aliceBefore).to.equal(reward);
      expect((await trust.getAgentProfile(alice.address)).serial).to.equal(1n);

      // Bob already registered a custom bio BEFORE calling claimCampaignAndRegister -> existing bio MUST be preserved!
      await trust.connect(bob).upsertPassport(0b10000000, "Bob Custom Bio", "https://bob.ai");
      await trust.connect(bob).claimCampaignAndRegister(0, "Bob check-in", 1, "Should Not Overwrite", "");
      expect((await trust.getAgentProfile(bob.address)).bio).to.equal("Bob Custom Bio");

      // Check on-chain claim records (newest first)
      const claimers = await trust.getCampaignClaims(0, 10);
      expect(claimers.length).to.equal(2);
      expect(claimers[0].handle).to.equal("bob");
      expect(claimers[1].handle).to.equal("alice");

      // Double claim blocked
      await expect(trust.connect(alice).claimCampaign(0, "Again")).to.be.revertedWithCustomError(
        trust,
        "AlreadyClaimed"
      );

      // Refund unused 1 slot
      const depBefore = await ethers.provider.getBalance(deployer.address);
      const closeTx = await trust.connect(deployer).closeCampaign(0);
      const closeReceipt = await closeTx.wait();
      const closeGas = closeReceipt!.gasUsed * closeReceipt!.gasPrice;
      expect((await ethers.provider.getBalance(deployer.address)) + closeGas - depBefore).to.equal(reward);
    });

    it("supports 0-BNB Sybil-proof .ai guestbook / attendance check-in campaigns", async function () {
      const { ethers, trust, alice, bob } = await deployFixture();
      const latestBlock = await ethers.provider.getBlock("latest");
      const deadline = BigInt(latestBlock!.timestamp + 3600);

      await trust.connect(alice).createCampaign("BNB Hackathon Guestbook", "Sign with your .ai!", 0, 100, deadline, {
        value: 0,
      });

      await trust.connect(bob).claimCampaign(0, "bob.ai was here!");
      const claims = await trust.getCampaignClaims(0, 5);
      expect(claims.length).to.equal(1);
      expect(claims[0].handle).to.equal("bob");
      expect(claims[0].response).to.equal("bob.ai was here!");
    });
  });

  describe("Module 4: Escrowed .ai Micro-Bounties", function () {
    it("supports assigned .ai bounty lifecycle from creation to approval", async function () {
      const { ethers, trust, alice, bob, charlie } = await deployFixture();
      const latestBlock = await ethers.provider.getBlock("latest");
      const deadline = BigInt(latestBlock!.timestamp + 86400);
      const reward = ethers.parseEther("0.05");

      await trust.connect(alice).createBounty("Audit Token", "ipfs://spec", "bob.ai", deadline, { value: reward });
      await expect(trust.connect(charlie).acceptBounty(0)).to.be.revertedWithCustomError(trust, "Unauthorized");

      await trust.connect(bob).acceptBounty(0);
      await trust.connect(bob).submitBounty(0, "https://github.com/bob/audit-report");

      const bobBefore = await ethers.provider.getBalance(bob.address);
      await trust.connect(alice).approveBounty(0);
      expect((await ethers.provider.getBalance(bob.address)) - bobBefore).to.equal(reward);
      expect((await trust.getAgentProfile(bob.address)).bountiesCompleted).to.equal(1n);
    });

    it("allows worker auto-release after 72h review window if poster ghosts", async function () {
      const { ethers, networkHelpers, trust, alice, bob } = await deployFixture();
      const latestBlock = await ethers.provider.getBlock("latest");
      const deadline = BigInt(latestBlock!.timestamp + 86400);
      const reward = ethers.parseEther("0.03");

      await trust.connect(alice).createBounty("Open Research", "ipfs://spec2", "", deadline, { value: reward });
      await trust.connect(bob).acceptBounty(0);
      await trust.connect(bob).submitBounty(0, "ipfs://result");

      await expect(trust.connect(bob).autoReleaseBounty(0)).to.be.revertedWithCustomError(
        trust,
        "ReviewWindowNotElapsed"
      );

      await networkHelpers.time.increase(72 * 3600 + 1);

      const bobBefore = await ethers.provider.getBalance(bob.address);
      const tx = await trust.connect(bob).autoReleaseBounty(0);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      expect((await ethers.provider.getBalance(bob.address)) + gasCost - bobBefore).to.equal(reward);
    });

    it("allows poster to cancel open or overdue unsubmitted bounty", async function () {
      const { ethers, networkHelpers, trust, alice, bob } = await deployFixture();
      const latestBlock = await ethers.provider.getBlock("latest");
      const deadline = BigInt(latestBlock!.timestamp + 3600);
      const reward = ethers.parseEther("0.02");

      await trust.connect(alice).createBounty("Quick Task", "ipfs://spec3", "", deadline, { value: reward });
      await trust.connect(bob).acceptBounty(0);

      await expect(trust.connect(alice).cancelBounty(0)).to.be.revertedWithCustomError(trust, "InvalidBountyStatus");

      await networkHelpers.time.increase(3601);
      const before = await ethers.provider.getBalance(alice.address);
      const tx = await trust.connect(alice).cancelBounty(0);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      expect((await ethers.provider.getBalance(alice.address)) + gasCost - before).to.equal(reward);
    });
  });
});
