export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const text = size === "sm" ? "text-lg" : "text-2xl";
  return (
    <div className="flex items-center gap-2">
      <span className="relative grid h-8 w-8 place-items-center">
        <span className="absolute inset-0 rounded-full bg-astral/40 blur-sm" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-thread thread-pulse" />
      </span>
      <span className={`font-serif ${text} tracking-wide`}>
        Astra<span className="text-thread">Red</span>
      </span>
    </div>
  );
}
