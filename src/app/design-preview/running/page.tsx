"use client";

import { useState } from "react";
import AuditRunningLoader from "@/components/AuditRunningLoader";

export default function RunningPreview() {
  const [status, setStatus] = useState<"running" | "complete" | "failed">("running");

  return (
    <div className="relative">
      {/* Controls overlay */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setStatus("running")}
          className={`px-3 py-1.5 rounded-md text-[13px] font-medium border cursor-pointer ${status === "running" ? "bg-brand text-white border-brand" : "bg-white text-text-body border-border-default"}`}
        >
          Running
        </button>
        <button
          onClick={() => setStatus("complete")}
          className={`px-3 py-1.5 rounded-md text-[13px] font-medium border cursor-pointer ${status === "complete" ? "bg-brand text-white border-brand" : "bg-white text-text-body border-border-default"}`}
        >
          Complete
        </button>
        <button
          onClick={() => setStatus("failed")}
          className={`px-3 py-1.5 rounded-md text-[13px] font-medium border cursor-pointer ${status === "failed" ? "bg-brand text-white border-brand" : "bg-white text-text-body border-border-default"}`}
        >
          Failed
        </button>
      </div>

      <AuditRunningLoader
        completedPrompts={status === "complete" ? 10 : 0}
        totalPrompts={10}
        status={status}
      />
    </div>
  );
}
