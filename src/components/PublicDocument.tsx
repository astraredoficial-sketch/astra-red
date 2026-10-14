import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function PublicDocument({
  eyebrow,
  title,
  introduction,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <main className="starfield min-h-screen bg-[#07060c] px-5 pb-14 pt-6 text-ink sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="AstraRed, inicio">
            <BrandMark size="sm" />
          </Link>
          <Link
            href="/guias"
            className="text-sm text-muted underline-offset-4 hover:text-white hover:underline"
          >
            Explorar guías
          </Link>
        </header>

        <article className="relative mt-10 rounded-3xl border border-white/10 bg-[#0b0a11]/85 p-6 sm:mt-14 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-thread">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#d2c8dc]">
            {introduction}
          </p>
          <div className="public-prose mt-8 space-y-7">{children}</div>
        </article>
      </div>
    </main>
  );
}
