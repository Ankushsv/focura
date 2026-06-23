export default function Vessel({
  progress,
  colors,
  glow,
  size = 320,
  mini = false,
  timeLabel,
}: {
  progress: number;
  colors: [string, string];
  glow: string;
  size?: number;
  mini?: boolean;
  timeLabel?: string;
}) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {!mini && (
        <>
          <div className="vessel-ring" style={{ borderColor: glow }} />
          <div className="vessel-ring" style={{ borderColor: glow }} />
          <div className="vessel-ring" style={{ borderColor: glow }} />
        </>
      )}

      <div
        className="absolute inset-0 overflow-hidden rounded-full border border-white/15 bg-white/5"
        style={mini ? undefined : { boxShadow: `0 0 60px ${glow}40, inset 0 0 30px ${glow}20` }}
      >
        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-linear"
          style={{
            height: `${Math.min(progress, 100)}%`,
            background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
          }}
        >
          <div className="wave" style={{ background: colors[0] }} />
          <div className="wave wave-2" style={{ background: colors[1] }} />
        </div>
      </div>

      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={glow}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(progress, 100) / 100)}
          className="transition-all duration-1000"
        />
      </svg>

      {!mini && (
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="text-5xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] tabular-nums">{Math.round(progress)}%</span>
          {timeLabel && (
            <span className="text-sm font-mono font-bold text-white/70 mt-1 drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)] tracking-wider">
              {timeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
