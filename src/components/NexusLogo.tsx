type Props = {
  size?: number;
  variant?: "default" | "on-brand";
};

export default function NexusLogo({ size = 30, variant = "default" }: Props) {
  const bg   = variant === "on-brand" ? "rgba(255,255,255,0.15)" : "#0001FC";
  const text = "#ffffff";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nexus-A2A"
    >
      <rect x="0" y="0" width="40" height="40" rx="10" fill={bg} />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="800"
        fill={text}
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-1"
      >
        N
      </text>
    </svg>
  );
}
