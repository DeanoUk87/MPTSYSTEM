"use client";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Portal error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-md">
        <h2 className="text-slate-700 font-semibold mb-2">Something went wrong</h2>
        <p className="text-xs text-rose-600 font-mono bg-rose-50 rounded-lg px-3 py-2 mb-4 text-left break-words">
          {error.message || "Unknown error"}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 mx-auto"
        >
          <Loader2 className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    </div>
  );
}
