export function DossierSkeleton({ status }: { status: string }) {
  return (
    <div className="rise relative mx-auto w-full max-w-lg">
      <div className="panel relative overflow-hidden rounded-[24px] p-7 sm:p-8">
        {/* scanline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16"
          style={{
            background:
              "linear-gradient(180deg, rgba(45,212,255,0.18), transparent)",
            animation: "scan 2.4s linear infinite",
          }}
        />
        <div className="flex items-center gap-3">
          <span className="spin-slow inline-block h-4 w-4 rounded-full border-2 border-soul-magenta/30 border-t-soul-magenta" />
          <span className="text-xs uppercase tracking-[0.25em] text-soul-violet/80">
            {status || "Reading the chain…"}
          </span>
        </div>
        <div className="mt-7 h-3 w-28 rounded shimmer" />
        <div className="mt-3 h-9 w-3/4 rounded shimmer" />
        <div className="mt-6 h-2 w-full rounded-full shimmer" />
        <div className="mt-7 h-4 w-2/3 rounded shimmer" />
        <div className="mt-6 space-y-3">
          <div className="h-3 w-full rounded shimmer" />
          <div className="h-3 w-5/6 rounded shimmer" />
          <div className="h-3 w-4/6 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}
