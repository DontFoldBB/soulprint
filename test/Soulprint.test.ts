import { expect } from "chai";
import hre from "hardhat";
import { parseEther, encodeAbiParameters, getAddress } from "viem";

const JSON_API_AGENT_ID = 13174292974160097713n;
const LLM_AGENT_ID = 12847293847561029384n;

const SAMPLE_DOSSIER =
  'TYPE: Testnet Drifter, Type II\nSTRENGTH: Relentless\nWEAKNESS: Spreads thin\n' +
  'STYLE: "one more dApp"\nKARMA: +7\nNOTES: early explorer energy\nRARITY: 3';

// ResponseStatus enum
const Success = 2;
const Failed = 3;
const TimedOut = 4;

function statsResult(txCount: bigint) {
  return encodeAbiParameters([{ type: "uint256" }], [txCount]);
}
function dossierResult(text: string) {
  return encodeAbiParameters([{ type: "string" }], [text]);
}

async function deploy() {
  const [deployer, user] = await hre.viem.getWalletClients();
  const platform = await hre.viem.deployContract("MockAgentPlatform");
  const soulprint = await hre.viem.deployContract("Soulprint", [platform.address]);
  // seed the contract reserve so it can fund agent deposits + refunds
  await deployer.sendTransaction({ to: soulprint.address, value: parseEther("50") });
  return { platform, soulprint, user, deployer };
}

describe("Soulprint", () => {
  it("read() creates a JSON API stats request", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], {
      value: parseEther("1"),
      account: user.account,
    });
    const pend = await platform.read.pending([1n]);
    // tuple: [callbackAddress, callbackSelector, agentId, payload, exists]
    expect(pend[4]).to.equal(true);
    expect(pend[2]).to.equal(JSON_API_AGENT_ID);
  });

  it("read() rejects underpayment", async () => {
    const { soulprint, user } = await deploy();
    await expect(
      soulprint.write.read([user.account.address], {
        value: parseEther("0.1"),
        account: user.account,
      })
    ).to.be.rejected;
  });

  it("handleStats triggers an LLM request", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    const p = await platform.read.pending([2n]);
    expect(p[4]).to.equal(true);
    expect(p[2]).to.equal(LLM_AGENT_ID);
  });

  it("handleDossier mints a soulbound NFT and stores the dossier", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    expect(tokenId).to.equal(1n);
    expect(getAddress(await soulprint.read.ownerOf([tokenId]))).to.equal(getAddress(user.account.address));
    expect(await soulprint.read.dossier([tokenId])).to.equal(SAMPLE_DOSSIER);
    expect(await soulprint.read.generation([tokenId])).to.equal(1n);
  });

  it("is soulbound: transfer reverts and locked() is true", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    expect(await soulprint.read.locked([tokenId])).to.equal(true);
    await expect(
      soulprint.write.transferFrom(
        [user.account.address, "0x000000000000000000000000000000000000cafe", tokenId],
        { account: user.account }
      )
    ).to.be.rejected;
  });

  it("enforces one soulprint per wallet", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    await expect(
      soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account })
    ).to.be.rejected;
  });

  it("tokenURI is a base64 data JSON", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    const uri = await soulprint.read.tokenURI([tokenId]);
    expect(uri.startsWith("data:application/json;base64,")).to.equal(true);
  });

  it("refunds the first minter (freeMintsRemaining decrements)", async () => {
    const { soulprint, platform, user } = await deploy();
    expect(await soulprint.read.freeMintsRemaining()).to.equal(100n);
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    expect(await soulprint.read.freeMintsRemaining()).to.equal(99n);
  });

  it("reread() refreshes dossier and bumps generation", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    await soulprint.write.reread([tokenId], { account: user.account });
    await platform.write.deliver([3n, statsResult(200n), Success]);
    await platform.write.deliver([4n, dossierResult("TYPE: Satori Holder, Type II\nRARITY: 4"), Success]);

    expect(await soulprint.read.generation([tokenId])).to.equal(2n);
    expect(await soulprint.read.dossier([tokenId])).to.equal("TYPE: Satori Holder, Type II\nRARITY: 4");
  });

  it("exposes a composable profileOf for other contracts/agents", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    const p = await soulprint.read.profileOf([user.account.address]);
    expect(p[0]).to.equal(1n);
    expect(p[1]).to.equal(SAMPLE_DOSSIER);
    expect(p[2]).to.equal(1n);
  });

  it("does not mint on a failed stats response", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(0n), Failed]);
    expect(await soulprint.read.soulprintOf([user.account.address])).to.equal(0n);
  });

  it("does not mint on a timed-out dossier response", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(""), TimedOut]);
    expect(await soulprint.read.soulprintOf([user.account.address])).to.equal(0n);
  });

  it("computes a deterministic on-chain activity score from tx count", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]); // 50..199 bucket -> 60
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    expect(await soulprint.read.activityScore([tokenId])).to.equal(60n);
  });

  it("parses the canonical ARCHETYPE field from the dossier", async () => {
    const { soulprint, platform, user } = await deploy();
    const dossier =
      "TYPE: Gas Goblin, Type III\nARCHETYPE: DeFi User\nKARMA: +5\nRARITY: 4";
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(dossier), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    expect(await soulprint.read.archetypeOf([tokenId])).to.equal("DeFi User");
  });

  it("archetypeOf is empty when the dossier omits the ARCHETYPE field", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    expect(await soulprint.read.archetypeOf([tokenId])).to.equal("");
  });

  it("renders Archetype and Activity as on-chain NFT attributes", async () => {
    const { soulprint, platform, user } = await deploy();
    const dossier = "TYPE: Gas Goblin, Type III\nARCHETYPE: DeFi User\nKARMA: +5\nRARITY: 4";
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]); // activity 60
    await platform.write.deliver([2n, dossierResult(dossier), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    const uri = await soulprint.read.tokenURI([tokenId]);
    const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf8"));
    const traits: Record<string, unknown> = Object.fromEntries(
      json.attributes.map((a: { trait_type: string; value: unknown }) => [a.trait_type, a.value])
    );
    expect(traits.Archetype).to.equal("DeFi User");
    expect(traits.Activity).to.equal(60);
    expect(traits.Generation).to.equal(1);
  });

  it("exposes a composable traitsOf for agents (archetype + activity + generation)", async () => {
    const { soulprint, platform, user } = await deploy();
    const dossier = "TYPE: Gas Goblin, Type III\nARCHETYPE: DeFi User\nKARMA: +5\nRARITY: 4";
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(dossier), Success]);

    const t = await soulprint.read.traitsOf([user.account.address]);
    expect(t[0]).to.equal(1n);          // tokenId
    expect(t[1]).to.equal("DeFi User"); // archetype
    expect(t[2]).to.equal(60n);         // activity
    expect(t[3]).to.equal(1n);          // generation
  });

  it("traitsOf returns zeros for an unprofiled wallet", async () => {
    const { soulprint, user } = await deploy();
    const t = await soulprint.read.traitsOf([user.account.address]);
    expect(t[0]).to.equal(0n);
    expect(t[1]).to.equal("");
    expect(t[2]).to.equal(0n);
    expect(t[3]).to.equal(0n);
  });

  it("lets the owner withdraw STT (for recycling reserve on redeploy)", async () => {
    const { soulprint, deployer } = await deploy();
    const pub = await hre.viem.getPublicClient();
    expect(await pub.getBalance({ address: soulprint.address })).to.equal(parseEther("50"));
    await soulprint.write.withdraw([parseEther("10")], { account: deployer.account });
    expect(await pub.getBalance({ address: soulprint.address })).to.equal(parseEther("40"));
  });

  it("blocks non-owners from withdrawing", async () => {
    const { soulprint, user } = await deploy();
    await expect(
      soulprint.write.withdraw([parseEther("1")], { account: user.account })
    ).to.be.rejected;
  });

  it("charges more to mint a Soulprint for someone else, and mints it to them", async () => {
    const { soulprint, platform, user } = await deploy();
    const other = "0x1111111111111111111111111111111111111111";
    // 1 STT (self price) is not enough to profile a different wallet
    await expect(
      soulprint.write.read([other], { value: parseEther("1"), account: user.account })
    ).to.be.rejected;
    // 2 STT works — and the NFT is minted to `other`, not the payer
    await soulprint.write.read([other], { value: parseEther("2"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([other]);
    expect(tokenId).to.equal(1n);
    expect(getAddress(await soulprint.read.ownerOf([tokenId]))).to.equal(getAddress(other));
  });

  it("ExampleGate: a wallet with enough activity can enter (NFT-as-access)", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]); // activity 60
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    const gate = await hre.viem.deployContract("ExampleGate", [soulprint.address, 60n]);
    await gate.write.enter({ account: user.account });
    expect(await gate.read.entered([user.account.address])).to.equal(true);
  });

  it("ExampleGate: a wallet with no Soulprint is rejected", async () => {
    const { soulprint, user } = await deploy();
    const gate = await hre.viem.deployContract("ExampleGate", [soulprint.address, 60n]);
    await expect(gate.write.enter({ account: user.account })).to.be.rejected;
  });

  it("ExampleGate: activity below the threshold is rejected", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(5n), Success]); // activity 20 < 60
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    const gate = await hre.viem.deployContract("ExampleGate", [soulprint.address, 60n]);
    await expect(gate.write.enter({ account: user.account })).to.be.rejected;
  });

  it("SoulprintCron deploys, stores params, and gates onEvent to the precompile", async () => {
    const { soulprint, user } = await deploy();
    const cron = await hre.viem.deployContract("SoulprintCron", [soulprint.address, 60n, 5n]);
    expect(getAddress(await cron.read.soulprint())).to.equal(getAddress(soulprint.address));
    expect(await cron.read.intervalSeconds()).to.equal(60n);
    expect(await cron.read.batchSize()).to.equal(5n);
    expect(await cron.read.ticks()).to.equal(0n);

    // onEvent is privileged: only the reactivity precompile (0x0100) may invoke it
    await expect(
      cron.write.onEvent(
        ["0x0000000000000000000000000000000000000000", [], "0x"],
        { account: user.account }
      )
    ).to.be.rejected;
  });

  it("evolveBatch re-runs the pipeline for a minted wallet (autonomous evolution)", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    expect(await soulprint.read.generation([tokenId])).to.equal(1n);

    // simulate a scheduler/cron tick — evolveBatch is permissionless
    await soulprint.write.evolveBatch([1n]);
    await platform.write.deliver([3n, statsResult(250n), Success]);
    await platform.write.deliver([4n, dossierResult("TYPE: Power Trader, Type IV\nARCHETYPE: Power User\nRARITY: 5"), Success]);

    expect(await soulprint.read.generation([tokenId])).to.equal(2n);
    expect(await soulprint.read.activityScore([tokenId])).to.equal(80n); // 250 -> 200..999 bucket
  });

  it("evolveBatch pauses (no revert) when a soul is out of fuel", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    // Burn through the initial fuel grant with one real evolution (tx_count changed).
    await soulprint.write.evolveBatch([1n]);
    await platform.write.deliver([3n, statsResult(200n), Success]);
    await platform.write.deliver([4n, dossierResult(SAMPLE_DOSSIER), Success]);
    expect(await soulprint.read.evoBalance([tokenId])).to.equal(0n); // fuel exhausted
    expect(await soulprint.read.generation([tokenId])).to.equal(2n);

    // Out of fuel → cron tick pauses the soul (no revert, no generation bump).
    await soulprint.write.evolveBatch([1n]);
    expect(await soulprint.read.generation([tokenId])).to.equal(2n);
  });

  it("evolveBatch advances a round-robin cursor across wallets", async () => {
    const { soulprint, platform, user, deployer } = await deploy();
    // mint for two wallets (user + deployer)
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    await soulprint.write.read([deployer.account.address], { value: parseEther("1"), account: deployer.account });
    await platform.write.deliver([3n, statsResult(87n), Success]);
    await platform.write.deliver([4n, dossierResult(SAMPLE_DOSSIER), Success]);

    expect(await soulprint.read.evolveCursor()).to.equal(0n);
    await soulprint.write.evolveBatch([1n]); // evolves wallet[0], cursor -> 1
    expect(await soulprint.read.evolveCursor()).to.equal(1n);
  });

  it("rejects a second read while the first is still pending (no double pipeline)", async () => {
    const { soulprint, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    // a second read before the first pipeline's callbacks land must revert
    await expect(
      soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account })
    ).to.be.rejected;
  });

  it("clears the pending guard after a failed read so the wallet can retry", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(0n), Failed]); // stats fails → pending cleared
    // retry now succeeds (it would revert "read in progress" if the guard weren't cleared)
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    const p = await platform.read.pending([2n]);
    expect(p[4]).to.equal(true);
  });

  it("a rejecting recipient can't block the mint (refund fails gracefully)", async () => {
    const { soulprint, platform } = await deploy();
    const minter = await hre.viem.deployContract("RejectingMinter");
    // the contract profiles itself (self-mint → escrowed refund), but rejects ETH
    await minter.write.mintSelf([soulprint.address], { value: parseEther("1") });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]); // must NOT revert
    expect(await soulprint.read.soulprintOf([minter.address])).to.equal(1n);
    expect(await soulprint.read.generation([1n])).to.equal(1n);
    // refund failed, so no free slot was consumed
    expect(await soulprint.read.freeMintsRemaining()).to.equal(100n);
  });

  it("audit: rejects the zero address before spending agent deposits", async () => {
    const { soulprint, user } = await deploy();

    await expect(
      soulprint.write.read(["0x0000000000000000000000000000000000000000"], {
        value: parseEther("2"),
        account: user.account,
      })
    ).to.be.rejected;
  });

  it("audit: tokenURI stays valid JSON when the dossier contains JSON control characters", async () => {
    const { soulprint, platform, user } = await deploy();
    const dossier =
      "TYPE: Control Char Wallet, Type II\n" +
      "ARCHETYPE: Testnet Explorer\n" +
      "STRENGTH: Keeps moving\n" +
      "WEAKNESS: Carries tabs\tand carriage returns\rin notes\n" +
      "STYLE: \"parse me\"\n" +
      "KARMA: +1\n" +
      "NOTES: raw tab\t raw carriage\r return\n" +
      "RARITY: 2";

    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(dossier), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    const uri = await soulprint.read.tokenURI([tokenId]);
    const jsonText = Buffer.from(uri.split(",")[1], "base64").toString("utf8");
    expect(() => JSON.parse(jsonText)).not.to.throw();
  });

  it("SoulprintCron rejects bad constructor params (interval/batch)", async () => {
    const { soulprint } = await deploy();
    await expect(hre.viem.deployContract("SoulprintCron", [soulprint.address, 1n, 5n])).to.be.rejected; // interval < 2
    await expect(hre.viem.deployContract("SoulprintCron", [soulprint.address, 60n, 0n])).to.be.rejected; // zero batch
  });

  it("SoulprintCron setParams validates inputs and is owner-only", async () => {
    const { soulprint, user } = await deploy();
    const cron = await hre.viem.deployContract("SoulprintCron", [soulprint.address, 60n, 5n]);
    await expect(cron.write.setParams([1n, 5n])).to.be.rejected;   // interval too short
    await expect(cron.write.setParams([60n, 0n])).to.be.rejected;  // zero batch
    await expect(cron.write.setParams([120n, 3n], { account: user.account })).to.be.rejected; // not owner
    await cron.write.setParams([120n, 3n]); // owner, valid
    expect(await cron.read.intervalSeconds()).to.equal(120n);
    expect(await cron.read.batchSize()).to.equal(3n);
  });

  it("SoulprintCron forceReset is owner-only (escape hatch to re-arm after a stall)", async () => {
    const { soulprint, user } = await deploy();
    const cron = await hre.viem.deployContract("SoulprintCron", [soulprint.address, 60n, 5n]);
    await expect(cron.write.forceReset({ account: user.account })).to.be.rejected; // not owner
    await cron.write.forceReset(); // owner ok
    expect(await cron.read.subscriptionId()).to.equal(0n);
  });

  // ── Soul evolution: Stage 1..10 + Form 1..30 (on-chain) ──
  async function mintWith(txCount: bigint, archetype: string) {
    const { soulprint, platform, user } = await deploy();
    const dossier = `TYPE: Test, Type II\nARCHETYPE: ${archetype}\nKARMA: +1\nRARITY: 3`;
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(txCount), Success]);
    await platform.write.deliver([2n, dossierResult(dossier), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    return { soulprint, tokenId };
  }

  it("derives Stage 1 for a brand-new wallet (low tx_count)", async () => {
    const { soulprint, tokenId } = await mintWith(3n, "Newborn Wallet");
    expect(await soulprint.read.stageOf([tokenId])).to.equal(1);
    expect(await soulprint.read.formIdOf([tokenId])).to.equal(1);   // newborn-1-spark-mote
    expect(await soulprint.read.formSlugOf([tokenId])).to.equal("newborn-1-spark-mote");
  });

  it("derives mid-Stage (~5) for a mid-activity DeFi User", async () => {
    const { soulprint, tokenId } = await mintWith(220n, "DeFi User");
    expect(await soulprint.read.stageOf([tokenId])).to.equal(5);
    // DeFi line at stage 5 (≥4 threshold) → defi-2-yield-wraith (formId 9)
    expect(await soulprint.read.formIdOf([tokenId])).to.equal(9);
    expect(await soulprint.read.formSlugOf([tokenId])).to.equal("defi-2-yield-wraith");
  });

  it("derives apex Stage 10 + Soul Singularity for an extremely active Power User", async () => {
    const { soulprint, tokenId } = await mintWith(250_000n, "Power User");
    expect(await soulprint.read.stageOf([tokenId])).to.equal(10);
    expect(await soulprint.read.formIdOf([tokenId])).to.equal(30); // power-5-soul-singularity
    expect(await soulprint.read.formSlugOf([tokenId])).to.equal("power-5-soul-singularity");
  });

  it("falls back to the Newborn line when ARCHETYPE is missing/unknown", async () => {
    const { soulprint, tokenId } = await mintWith(8n, "Made-Up Archetype");
    expect(await soulprint.read.stageOf([tokenId])).to.equal(2);
    expect(await soulprint.read.formIdOf([tokenId])).to.equal(2);   // newborn-2-drifting-wisp
  });

  it("exposes evolutionOf(wallet) for composable agent reads and adds Stage+Form to tokenURI", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(2_500n), Success]); // Stage 7
    await platform.write.deliver([
      2n,
      dossierResult("TYPE: Forge Master, Type IV\nARCHETYPE: Contract Deployer\nKARMA: +3\nRARITY: 4"),
      Success,
    ]);

    const evo = await soulprint.read.evolutionOf([user.account.address]);
    expect(evo[0]).to.equal(7);                          // stage
    expect(evo[1]).to.equal(19);                         // formId — deployer-3-forge-specter
    expect(evo[2]).to.equal("deployer-3-forge-specter"); // slug

    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    const uri = await soulprint.read.tokenURI([tokenId]);
    const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf8"));
    const traits: Record<string, unknown> = Object.fromEntries(
      json.attributes.map((a: { trait_type: string; value: unknown }) => [a.trait_type, a.value])
    );
    expect(traits.Stage).to.equal(7);
    expect(traits.Form).to.equal("deployer-3-forge-specter");
  });

  // ─── Prepaid Evolution Fuel ──────────────────────────────────────────────
  // Caps the project's "forever-cost" from autonomous ticks and turns "keep this
  // soul alive" into a public-good mechanic (anyone can top up anyone's soul).

  it("grants INITIAL_FUEL_GRANT to a new soulprint on mint", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    expect(await soulprint.read.evoBalance([tokenId])).to.equal(parseEther("0.4"));
    expect(await soulprint.read.totalReserved()).to.equal(parseEther("0.4"));

    const fuel = await soulprint.read.evolutionFuel([tokenId]);
    expect(fuel[0]).to.equal(parseEther("0.4"));    // balance
    expect(fuel[1]).to.equal(parseEther("0.4"));    // costPerEvolution
    expect(fuel[2]).to.equal(1n);                   // evolutionsRemaining
  });

  it("topUpEvolution accepts STT from anyone and bumps the per-token fuel", async () => {
    const { soulprint, platform, user, deployer } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    // A third party (deployer here) tops up someone else's soul — patronage / boost.
    await soulprint.write.topUpEvolution([tokenId], { value: parseEther("1.6"), account: deployer.account });

    expect(await soulprint.read.evoBalance([tokenId])).to.equal(parseEther("2.0"));   // 0.4 + 1.6
    expect(await soulprint.read.totalReserved()).to.equal(parseEther("2.0"));
    const fuel = await soulprint.read.evolutionFuel([tokenId]);
    expect(fuel[2]).to.equal(5n); // 2.0 / 0.4 = 5 evolutions
  });

  it("topUpEvolution rejects non-existent tokens and zero value", async () => {
    const { soulprint, user } = await deploy();
    await expect(
      soulprint.write.topUpEvolution([99n], { value: parseEther("1"), account: user.account })
    ).to.be.rejected;
    await expect(
      soulprint.write.topUpEvolution([1n], { value: 0n, account: user.account })
    ).to.be.rejected;
  });

  it("withdraw cannot dip into per-token fuel (totalReserved is sacred)", async () => {
    const { soulprint, platform, user, deployer } = await deploy();
    const pub = await hre.viem.getPublicClient();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    const bal = await pub.getBalance({ address: soulprint.address });
    const drainable = await soulprint.read.availableForWithdraw();
    expect(drainable).to.equal(bal - parseEther("0.4")); // 0.4 STT fuel is reserved

    // Trying to withdraw EVERYTHING reverts; only `availableForWithdraw` is fair game.
    await expect(
      soulprint.write.withdraw([bal], { account: deployer.account })
    ).to.be.rejected;
    await soulprint.write.withdraw([drainable], { account: deployer.account });
    expect(await pub.getBalance({ address: soulprint.address })).to.equal(parseEther("0.4"));
  });

  it("fueled cron tick re-fills generation and decrements fuel; second tick pauses without revert", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);

    // Tick 1: tx_count changed → real evolution, fuel consumed.
    await soulprint.write.evolveBatch([1n]);
    await platform.write.deliver([3n, statsResult(250n), Success]);
    await platform.write.deliver([4n, dossierResult(SAMPLE_DOSSIER), Success]);
    expect(await soulprint.read.generation([tokenId])).to.equal(2n);
    expect(await soulprint.read.evoBalance([tokenId])).to.equal(0n);

    // Tick 2: no fuel → pre-filter pauses (no JSON request fired, no revert).
    await soulprint.write.evolveBatch([1n]); // must not revert
    expect(await soulprint.read.generation([tokenId])).to.equal(2n); // unchanged

    // After topUp, the next tick can evolve again.
    await soulprint.write.topUpEvolution([tokenId], { value: parseEther("0.4"), account: user.account });
    await soulprint.write.evolveBatch([1n]);
    // 3 requests have been fired so far (initial JSON+LLM, tick-1 JSON+LLM, tick-3 JSON);
    // platform's request counter is 5n now.
    await platform.write.deliver([5n, statsResult(300n), Success]);
    await platform.write.deliver([6n, dossierResult(SAMPLE_DOSSIER), Success]);
    expect(await soulprint.read.generation([tokenId])).to.equal(3n);
  });

  it("cost-gate skip (tx_count unchanged) does NOT charge fuel", async () => {
    const { soulprint, platform, user } = await deploy();
    await soulprint.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await soulprint.read.soulprintOf([user.account.address]);
    const fuelBefore = await soulprint.read.evoBalance([tokenId]);

    // Idle tick — tx_count unchanged. Should EvolutionSkipped, NOT EvolutionPaused.
    await soulprint.write.evolveBatch([1n]);
    await platform.write.deliver([3n, statsResult(87n), Success]); // same tx_count

    expect(await soulprint.read.evoBalance([tokenId])).to.equal(fuelBefore); // fuel intact
    expect(await soulprint.read.generation([tokenId])).to.equal(1n);
  });
});
