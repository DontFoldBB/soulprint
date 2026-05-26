"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { somniaTestnet } from "@/lib/chain";
import { SOULPRINT_ADDRESS, SOULPRINT_ABI } from "@/lib/soulprint";
import { pub, walletClient, ensureChain, connect, detectAddress } from "@/lib/wallet";

type Props = {
  tokenId: number;
  /** Optional after-success callback so the parent can refetch fuel + render the new value. */
  onBoosted?: () => void;
  /** STT to send per boost (1 STT ≈ 2.5 evolutions at the current 0.4 STT EVOLUTION_COST). */
  amountStt?: string; // default "1"
};

/** Public-good boost: anyone can top up anyone's Soulprint fuel. The STT is locked into
 *  the per-token evoBalance (the contract owner can't withdraw it) and only the cron's
 *  future autonomous evolutions of THIS soul will consume it. */
export function BoostButton({ tokenId, onBoosted, amountStt = "1" }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function boost() {
    setBusy(true);
    setStatus("");
    try {
      let addr = await detectAddress();
      if (!addr) addr = await connect();
      const wc = walletClient();
      await ensureChain(wc);
      setStatus("Confirm in wallet…");
      const hash = await wc.writeContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "topUpEvolution",
        args: [BigInt(tokenId)],
        value: parseEther(amountStt),
        account: addr,
        chain: somniaTestnet,
      });
      setStatus("Boost sent — waiting for confirmation…");
      await pub.waitForTransactionReceipt({ hash });
      setStatus("Boosted ✓");
      onBoosted?.();
      // Brief flash, then clear
      setTimeout(() => setStatus(""), 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg.includes("User rejected") ? "" : "Boost failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  const label = busy && status ? status : `★ Boost · ${amountStt} STT`;
  return (
    <button
      type="button"
      onClick={boost}
      disabled={busy}
      title="Top up this soul's prepaid evolution fuel — anyone can fund anyone's soul"
      className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-xs font-semibold text-foreground/80 transition hover:border-white/30 hover:text-foreground disabled:opacity-60"
    >
      {label}
    </button>
  );
}
