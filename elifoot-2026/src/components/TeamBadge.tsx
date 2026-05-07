interface Props {
  team: { id: string; shortName: string; primaryColor: string; secondaryColor: string };
  size?: number;
  className?: string;
}

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function pickTextColor(bg: string, candidate: string): string {
  if (contrast(bg, candidate) >= 2.5) return candidate;
  return luminance(bg) > 0.4 ? '#000000' : '#ffffff';
}

export default function TeamBadge({ team, size = 32, className }: Props) {
  const { id, shortName, primaryColor, secondaryColor } = team;
  const clipId = `shield-${id}`;
  const textColor = pickTextColor(primaryColor, secondaryColor);
  const label = shortName.slice(0, 3);
  const fontSize = label.length <= 2 ? 11 : label.length === 3 ? 9 : 8;

  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 40 44"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={shortName}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M20 1 L39 9 L39 27 C39 36 20 43 20 43 C20 43 1 36 1 27 L1 9 Z" />
        </clipPath>
      </defs>

      {/* Shield background */}
      <path
        d="M20 1 L39 9 L39 27 C39 36 20 43 20 43 C20 43 1 36 1 27 L1 9 Z"
        fill={primaryColor}
      />

      {/* Diagonal secondary stripe */}
      <rect
        x="-20" y="-5" width="38" height="55"
        fill={secondaryColor}
        opacity="0.35"
        clipPath={`url(#${clipId})`}
        transform="rotate(-20 20 22)"
      />

      {/* Shield border */}
      <path
        d="M20 1 L39 9 L39 27 C39 36 20 43 20 43 C20 43 1 36 1 27 L1 9 Z"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Team abbreviation */}
      <text
        x="20"
        y="23"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={fontSize}
        fontWeight="900"
        fontFamily="Arial Black, Arial, sans-serif"
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>
    </svg>
  );
}
