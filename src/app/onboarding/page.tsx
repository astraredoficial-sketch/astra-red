import { Suspense } from "react";
import { OnboardingUi } from "./ui";

export const instant = false;

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="grid flex-1 place-items-center text-muted">Cargando…</div>}>
      <OnboardingUi />
    </Suspense>
  );
}

