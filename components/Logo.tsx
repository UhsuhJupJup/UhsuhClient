import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 20, className = "" }: LogoProps) {
  return (
    <Image
      src="/emoticon.png"
      alt="어서줍줍"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
