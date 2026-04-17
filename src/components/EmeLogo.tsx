interface EmeLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function EmeLogo({ size = 48, showText = false, className = "" }: EmeLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="EME Gabinete Estratégico"
      >
        <defs>
          <linearGradient id="emeGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(40, 70%, 70%)" />
            <stop offset="100%" stopColor="hsl(40, 49%, 50%)" />
          </linearGradient>
          <linearGradient id="emeNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(217, 60%, 18%)" />
            <stop offset="100%" stopColor="hsl(217, 50%, 12%)" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="10" fill="url(#emeNavyGrad)" stroke="url(#emeGoldGrad)" strokeWidth="1.5" />
        <text
          x="32"
          y="42"
          textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="24"
          fontWeight="800"
          fill="url(#emeGoldGrad)"
          letterSpacing="-1"
        >
          EME
        </text>
        <line x1="14" y1="50" x2="50" y2="50" stroke="url(#emeGoldGrad)" strokeWidth="1.5" />
      </svg>
      {showText && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-foreground">
            EME <span className="text-gradient-gold">Gabinete</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            Movemos realidades
          </div>
        </div>
      )}
    </div>
  );
}
