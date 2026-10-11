export function HiloRojo({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 300 520" className="h-full w-full">
        <path
          d="M -10 80 C 80 140, 40 220, 160 260 S 280 360, 310 480"
          fill="none"
          stroke="#ff2a5f"
          strokeWidth="2.4"
          className="thread-draw"
          style={{ filter: "drop-shadow(0 0 8px #ff2a5f)" }}
        />
      </svg>
      <div className="absolute inset-x-0 top-4 text-center text-[11px] uppercase tracking-[0.35em] text-thread">
        Hilo Rojo
      </div>
    </div>
  );
}

