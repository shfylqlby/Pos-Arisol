import Image from "next/image";

export function Logo({
  size = 40,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Logo Arisol"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
