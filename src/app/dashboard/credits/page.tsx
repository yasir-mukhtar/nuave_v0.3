import { Suspense } from "react";
import CreditsContent from "./CreditsContent";

export default function CreditsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Memuat...</p>
      </div>
    }>
      <CreditsContent />
    </Suspense>
  );
}
