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
});
