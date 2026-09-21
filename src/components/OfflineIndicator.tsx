import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, Database } from './Icons';

interface OfflineIndicatorProps {
  isOnline: boolean;
  wasOffline: boolean;
  onResetWasOffline: () => void;
  cachedAt?: string;
  onRetryConnection?: () => void;
  isRetrying?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  wasOffline,
  onResetWasOffline,
  cachedAt,
  onRetryConnection,
  isRetrying = false
}) => {
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  // When returning online, display a temporary "Back Online" notification
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        onResetWasOffline();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline, onResetWasOffline]);

  // Back Online notification
  if (showReconnected) {
    return (
      <aside
        aria-live="polite"
        className="mx-5 mb-2.5 px-3.5 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between shadow-md transition animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
          <Wifi className="w-3.5 h-3.5 shrink-0 text-white" />
          <span>Connection Restored • Live radar synced</span>
        </div>
        <button
          onClick={() => setShowReconnected(false)}
          className="text-emerald-100 hover:text-white text-[11px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
        >
          Dismiss
        </button>
      </aside>
    );
  }

  // If online and not just reconnected, do not display
  if (isOnline) {
    return null;
  }

  return (
    <aside
      aria-live="assertive"
      className="mx-5 mb-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs shadow-lg border border-slate-700/80 transition animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-start space-x-2.5 min-w-0">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
            <WifiOff className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-100">Offline Mode</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1">
                <Database className="w-2.5 h-2.5" />
                SW Cache
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5 truncate">
              Viewing last fetched weather data
              {cachedAt ? ` (cached ${cachedAt})` : ''}
            </p>
          </div>
        </div>

        {onRetryConnection && (
          <button
            onClick={onRetryConnection}
            disabled={isRetrying}
            className="shrink-0 flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-semibold transition border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying' : 'Retry'}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
