type Props = {
  size?: number;
  variant?: "default" | "on-brand";
};

export default function NexusLogo({ size = 24, variant = "default" }: Props) {
  const stroke = variant === "on-brand" ? "#ffffff" : "#0001FC";
  const dim = variant === "on-brand" ? "rgba(255,255,255,0.45)" : "rgba(0,1,252,0.4)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nexus-A2A"
    >
      {/* Central hub — orchestrator node */}
      <circle cx="16" cy="16" r="3" fill={stroke} />

      {/* Sub-agent nodes */}
      <circle cx="16" cy="4"  r="2" fill={dim} />
      <circle cx="27" cy="22" r="2" fill={dim} />
      <circle cx="5"  cy="22" r="2" fill={dim} />

      {/* Delegation spokes from hub → agents */}
      <line x1="16" y1="13" x2="16" y2="6"  stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="18" x2="25" y2="21" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="18" x2="7"  y2="21" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />

      {/* Cross-agent mesh — A2A links */}
      <line x1="16" y1="6"  x2="25" y2="20" stroke={dim} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
      <line x1="25" y1="20" x2="7"  y2="20" stroke={dim} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
      <line x1="7"  y1="20" x2="16" y2="6"  stroke={dim} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}
