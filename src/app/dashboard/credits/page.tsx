import { Suspense } from "react";
import CreditsContent from "./CreditsContent";

export default function CreditsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="type-body text-text-muted">Memuat...</p>
      </div>
    }>
      <CreditsContent />
    </Suspense>
  );
}
