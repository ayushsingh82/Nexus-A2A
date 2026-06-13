type Props = {
  size?: number;
  variant?: "default" | "on-brand";
};

export default function NexusLogo({ size = 30, variant = "default" }: Props) {
  const primary = variant === "on-brand" ? "#ffffff" : "#0001FC";
  const soft    = variant === "on-brand" ? "rgba(255,255,255,0.5)" : "rgba(0,1,252,0.35)";
  const bg      = variant === "on-brand" ? "rgba(255,255,255,0.15)" : "rgba(0,1,252,0.08)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nexus-A2A"
    >
      {/* Outer ring */}
      <circle cx="20" cy="20" r="18" stroke={soft} strokeWidth="1.5" fill={bg} />

      {/* Hub node */}
      <circle cx="20" cy="20" r="5" fill={primary} />

      {/* 3 satellite nodes */}
      <circle cx="20" cy="6"  r="3" fill={primary} />
      <circle cx="32" cy="27" r="3" fill={soft} />
      <circle cx="8"  cy="27" r="3" fill={soft} />

      {/* Spokes hub → satellites */}
      <line x1="20" y1="15" x2="20" y2="9"  stroke={primary} strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="23" x2="29" y2="25" stroke={primary} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="23" x2="11" y2="25" stroke={primary} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
