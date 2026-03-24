import { Suspense } from "react";
import RunningContent from "./RunningContent";

export default function RunningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-text-muted">Memuat...</p>
      </div>
    }>
      <RunningContent />
    </Suspense>
  );
}
