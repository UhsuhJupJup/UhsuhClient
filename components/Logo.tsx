type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 20, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M27 5 L14 18" />
      <path d="M14 18 L8 24" />
      <path d="M8 24 L6.5 28 L17 28 L14.5 21.5 Z" />
      <path d="M9.5 28 L9.5 24.5" />
      <path d="M12 28 L12 24" />
      <path d="M14.5 28 L14.5 23.5" />
    </svg>
  );
}
