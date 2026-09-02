import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({ size = 56, className = "", priority = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="FinTrack"
      width={size}
      height={size}
      priority={priority}
      className={`rounded-2xl object-cover shadow-lg ${className}`}
    />
  );
}
