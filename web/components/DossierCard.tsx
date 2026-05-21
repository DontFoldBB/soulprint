import { Dossier } from "@/lib/soulprint";

export function DossierCard({ d, generation }: { d: Dossier; generation?: number }) {
  const stars = Math.max(0, Math.min(5, Number(d.rarity ?? 0)));
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 font-mono text-zinc-100 shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
        <span>SOULPRINT{generation ? ` · gen ${generation}` : ""}</span>
        <span className="text-amber-400">
          {"★".repeat(stars)}
          {"☆".repeat(5 - stars)}
        </span>
      </div>
      <div className="text-lg font-bold text-emerald-400">{d.type ?? "Unknown"}</div>
      <dl className="mt-3 space-y-1 text-sm">
        {d.strength && (
          <div>
            <span className="text-zinc-500">Strength: </span>
            {d.strength}
          </div>
        )}
        {d.weakness && (
          <div>
            <span className="text-zinc-500">Weakness: </span>
            {d.weakness}
          </div>
        )}
        {d.style && <div className="italic text-zinc-300">&ldquo;{d.style}&rdquo;</div>}
        {d.karma && (
          <div>
            <span className="text-zinc-500">Karma: </span>
            {d.karma}
          </div>
        )}
        {d.notes && <p className="mt-2 text-zinc-300">{d.notes}</p>}
      </dl>
    </div>
  );
}
