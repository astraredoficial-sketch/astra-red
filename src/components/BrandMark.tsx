import Image from "next/image";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const imageSize = size === "sm" ? "h-10 sm:h-11" : "h-11 sm:h-14";

  return (
    <Image
      src="/astrared-logo-v2.png"
      alt="AstraRed"
      width={938}
      height={266}
      loading="eager"
      className={`${imageSize} w-auto object-contain`}
    />
  );
}
