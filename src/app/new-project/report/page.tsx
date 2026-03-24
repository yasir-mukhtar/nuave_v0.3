import { Suspense } from "react";
import ReportContent from "./ReportContent";

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-text-muted">Memuat laporan...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
