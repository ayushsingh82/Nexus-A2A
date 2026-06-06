type Props = {
  size?: number;
  variant?: "default" | "on-brand";
};

export default function ArgoLogo({ size = 22, variant = "default" }: Props) {
  const stroke = variant === "on-brand" ? "#ecfdf5" : "#ffffff";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Argo"
    >
      {/* Triangle = a closed arbitrage cycle. Three nodes, three edges. */}
      <circle cx="16" cy="6" r="2.2" fill={stroke} />
      <circle cx="6" cy="24" r="2.2" fill={stroke} />
      <circle cx="26" cy="24" r="2.2" fill={stroke} />
      <path
        d="M16 6 L26 24"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M26 24 L6 24"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 24 L16 6"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
