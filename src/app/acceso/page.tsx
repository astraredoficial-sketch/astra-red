import { Suspense } from "react";
import { AccesoUi } from "./ui";

type AccesoPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function AccesoPageContent({ searchParams }: AccesoPageProps) {
  const params = await searchParams;
  const requestedMode = params.mode;
  const initialMode =
    requestedMode === "signup" || requestedMode === "reset"
      ? requestedMode
      : "login";

  return <AccesoUi initialMode={initialMode} />;
}

export default function AccesoPage(props: AccesoPageProps) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#07060c] px-5 text-sm text-muted">
          Preparando tu acceso...
        </main>
      }
    >
      <AccesoPageContent searchParams={props.searchParams} />
    </Suspense>
  );
}
