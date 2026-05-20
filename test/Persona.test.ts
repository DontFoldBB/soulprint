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
  const persona = await hre.viem.deployContract("Persona", [platform.address]);
  // seed the contract reserve so it can fund agent deposits + refunds
  await deployer.sendTransaction({ to: persona.address, value: parseEther("50") });
  return { platform, persona, user, deployer };
}

describe("Persona", () => {
  it("read() creates a JSON API stats request", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], {
      value: parseEther("1"),
      account: user.account,
    });
    const p = await platform.read.pending([1n]);
    // tuple: [callbackAddress, callbackSelector, agentId, payload, exists]
    expect(p[4]).to.equal(true);
    expect(p[2]).to.equal(JSON_API_AGENT_ID);
  });

  it("read() rejects underpayment", async () => {
    const { persona, user } = await deploy();
    await expect(
      persona.write.read([user.account.address], {
        value: parseEther("0.1"),
        account: user.account,
      })
    ).to.be.rejected;
  });

  it("handleStats triggers an LLM request", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    const p = await platform.read.pending([2n]);
    expect(p[4]).to.equal(true);
    expect(p[2]).to.equal(LLM_AGENT_ID);
  });

  it("handleDossier mints a soulbound NFT and stores the dossier", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    const tokenId = await persona.read.personaOf([user.account.address]);
    expect(tokenId).to.equal(1n);
    expect(getAddress(await persona.read.ownerOf([tokenId]))).to.equal(getAddress(user.account.address));
    expect(await persona.read.dossier([tokenId])).to.equal(SAMPLE_DOSSIER);
    expect(await persona.read.generation([tokenId])).to.equal(1n);
  });

  it("is soulbound: transfer reverts and locked() is true", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await persona.read.personaOf([user.account.address]);

    expect(await persona.read.locked([tokenId])).to.equal(true);
    await expect(
      persona.write.transferFrom(
        [user.account.address, "0x000000000000000000000000000000000000cafe", tokenId],
        { account: user.account }
      )
    ).to.be.rejected;
  });

  it("enforces one persona per wallet", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);

    await expect(
      persona.write.read([user.account.address], { value: parseEther("1"), account: user.account })
    ).to.be.rejected;
  });

  it("tokenURI is a base64 data JSON", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await persona.read.personaOf([user.account.address]);
    const uri = await persona.read.tokenURI([tokenId]);
    expect(uri.startsWith("data:application/json;base64,")).to.equal(true);
  });

  it("refunds the first minter (freeMintsRemaining decrements)", async () => {
    const { persona, platform, user } = await deploy();
    expect(await persona.read.freeMintsRemaining()).to.equal(100n);
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    expect(await persona.read.freeMintsRemaining()).to.equal(99n);
  });

  it("reread() refreshes dossier and bumps generation", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(SAMPLE_DOSSIER), Success]);
    const tokenId = await persona.read.personaOf([user.account.address]);

    await persona.write.reread([tokenId], { account: user.account });
    await platform.write.deliver([3n, statsResult(200n), Success]);
    await platform.write.deliver([4n, dossierResult("TYPE: Satori Holder, Type II\nRARITY: 4"), Success]);

    expect(await persona.read.generation([tokenId])).to.equal(2n);
    expect(await persona.read.dossier([tokenId])).to.equal("TYPE: Satori Holder, Type II\nRARITY: 4");
  });

  it("does not mint on a failed stats response", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(0n), Failed]);
    expect(await persona.read.personaOf([user.account.address])).to.equal(0n);
  });

  it("does not mint on a timed-out dossier response", async () => {
    const { persona, platform, user } = await deploy();
    await persona.write.read([user.account.address], { value: parseEther("1"), account: user.account });
    await platform.write.deliver([1n, statsResult(87n), Success]);
    await platform.write.deliver([2n, dossierResult(""), TimedOut]);
    expect(await persona.read.personaOf([user.account.address])).to.equal(0n);
  });
});
