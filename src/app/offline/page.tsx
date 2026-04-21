"use client";

// Offline fallback page shown when navigation fails with no cache
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-900/40 border border-amber-500/40 flex items-center justify-center">
        <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M8.464 15.536a5 5 0 000-7.072M12 12h.01" />
        </svg>
      </div>
      <div>
        <p className="text-white font-bold text-xl mb-2">No Connection</p>
        <p className="text-gray-400 text-sm max-w-xs">
          You are offline. Any deliveries you confirm will be saved and sent automatically when you have signal.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-2xl text-base">
        Try Again
      </button>
    </div>
  );
}
