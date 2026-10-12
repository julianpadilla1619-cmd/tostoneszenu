import Image from "next/image";
import clsx from "clsx";

export function Logo({ size = 48, className, priority }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Tostones Zenú · Sabor Tuchinero"
      width={size}
      height={Math.round(size * 1.05)}
      priority={priority}
      className={clsx("select-none", className)}
    />
  );
}

export function Wordmark({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={clsx("flex flex-col leading-none", className)}>
      <span className={clsx("font-display text-[1.15rem] font-black tracking-tight", dark ? "text-cana" : "text-noche")}>
        Tostones Zenú
      </span>
      <span className={clsx("mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.28em]", dark ? "text-oro" : "text-canela")}>
        Sabor tuchinero
      </span>
    </span>
  );
}

/** Rombo Zenú (las "pintas" a los lados del sello). */
export function Rombo({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none" stroke={color} strokeWidth="2.2">
      <path d="M20 2 38 20 20 38 2 20Z" />
      <path d="M20 10 30 20 20 30 10 20Z" />
      <path d="M20 16 24 20 20 24 16 20Z" fill={color} />
      <path d="M2 20h6M32 20h6M20 2v6M20 32v6" />
    </svg>
  );
}

/** Ilustración simple del producto (rodajas de tostón o bastones de papa). */
export function ProductArt({ kind, className }: { kind: "toston" | "papa"; className?: string }) {
  if (kind === "papa") {
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden>
        <circle cx="60" cy="60" r="56" fill="var(--color-noche)" />
        {[
          [28, 34, -18], [44, 26, -6], [60, 22, 4], [76, 26, 14], [90, 34, 24],
          [36, 44, -12], [52, 38, 0], [68, 38, 8], [84, 46, 18],
        ].map(([x, y, r], i) => (
          <rect key={i} x={x - 6} y={y} width="12" height="52" rx="5" transform={`rotate(${r} ${x} ${y + 26})`}
            fill={i % 2 ? "var(--color-toston)" : "var(--color-oro-claro)"} stroke="var(--color-noche)" strokeWidth="3" />
        ))}
        <path d="M18 78h84l-8 30H26z" fill="var(--color-oro)" stroke="var(--color-noche)" strokeWidth="3" />
        <path d="M26 86h68M30 96h60" stroke="var(--color-noche)" strokeWidth="3" strokeDasharray="6 5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--color-noche)" />
      {[
        [38, 52, -24], [60, 44, 0], [82, 52, 24], [46, 74, -12], [74, 74, 12],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="17" ry="22" fill="var(--color-toston)" stroke="var(--color-noche)" strokeWidth="3" />
          <ellipse cx={x - 4} cy={y - 7} rx="6" ry="4" fill="var(--color-oro-claro)" opacity=".8" />
          <path d={`M${x} ${y - 7}v14M${x - 6} ${y}h12M${x - 4} ${y - 5}l8 10M${x + 4} ${y - 5}l-8 10`} stroke="var(--color-cafe)" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}
