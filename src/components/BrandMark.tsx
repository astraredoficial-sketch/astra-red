import Image from "next/image";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const imageSize = size === "sm" ? "h-10 sm:h-11" : "h-12 sm:h-14";

  return (
    <Image
      src="/astrared-logo-20261014.png"
      alt="AstraRed · Sinastría interpersonal y sincronía cósmica"
      width={1474}
      height={387}
      fetchPriority="high"
      className={`${imageSize} w-auto max-w-full object-contain`}
    />
  );
}
