import Image from "next/image";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const imageSize = size === "sm" ? "h-10 sm:h-11" : "h-11 sm:h-14";

  return (
    <Image
      src="/astrared-logo.png"
      alt="AstraRed"
      width={469}
      height={133}
      loading="eager"
      className={`${imageSize} w-auto object-contain`}
    />
  );
}
