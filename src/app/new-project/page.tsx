import { Suspense } from "react";
import NewProjectContent from "./NewProjectContent";

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-text-muted">Memuat...</p>
      </div>
    }>
      <NewProjectContent />
    </Suspense>
  );
}
