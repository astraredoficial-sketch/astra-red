import { Suspense } from "react";
import { ConversacionUi } from "./ui";

export default function ConversacionPage() {
  return (
    <Suspense
      fallback={
        <div className="grid flex-1 place-items-center text-muted">
          Abriendo conversación...
        </div>
      }
    >
      <ConversacionUi />
    </Suspense>
  );
}
