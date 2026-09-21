import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, CheckCircle2, Copy, ExternalLink, Sparkles, ShieldCheck } from './Icons';

interface InstallAppModalProps {
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const appUrl = 'https://ais-pre-vswn7jhnjtkb2szn6makls-323217793597.asia-east1.run.app';

  useEffect(() => {
    // Check if already running standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <img
            src="/icon.svg"
            alt="WeatherGPT App Icon"
            className="w-16 h-16 rounded-2xl mx-auto mb-2.5 shadow-lg shadow-blue-500/25 object-contain"
          />
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Android App / APK
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Published: Sept 14, 2026
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 mt-1">
            Install WeatherGPT on Android
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Apne phone par real Android app ki tarah use karein • Release v2.4
          </p>
        </div>

        {/* Option 1: Direct 1-Click Install (WebAPK) */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 mb-3.5">
          <div className="flex items-center space-x-2 text-blue-900 mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black uppercase tracking-wider">
              Option 1: Direct Android Install (Sabse Aasan)
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
            Android phone ke Chrome browser me khol kar bina kisi file download ke direct app install karein:
          </p>

          <ol className="text-[11px] text-slate-700 space-y-1.5 list-decimal pl-4 mb-3 font-medium">
            <li>Apne phone me Chrome me yeh link kholein.</li>
            <li>Chrome ke top right me <b>3 dots (⋮)</b> par tap karein.</li>
            <li><b>"Install App"</b> ya <b>"Add to Home screen"</b> par click karein.</li>
            <li>Phone par WeatherGPT ka icon ban jayega aur native app ki tarah chalega!</li>
          </ol>

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Click to Install App Now</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer mt-2"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Mobile App Link'}</span>
          </button>
        </div>

        {/* Option 2: Generate Signed APK via PWABuilder */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
          <div className="flex items-center space-x-2 text-slate-900 mb-1">
            <Download className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-black uppercase tracking-wider">
              Option 2: Direct .APK File Banayein
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
            Agar aapko actual <b>.apk file</b> download karke WhatsApp ya doston ko share karni hai, toh official PWABuilder (Google / Microsoft supported) se 1-click me generate karein:
          </p>

          <ol className="text-[11px] text-slate-700 space-y-1.5 list-decimal pl-4 mb-3 font-medium">
            <li>Neeche <b>"Open PWABuilder APK Generator"</b> par tap karein.</li>
            <li>WeatherGPT ka live link wahan dalein.</li>
            <li><b>"Build Android APK"</b> par click karein aur ready <b>.apk file</b> download kar lein!</li>
          </ol>

          <a
            href={`https://www.pwabuilder.com/?site=${encodeURIComponent(appUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Generate .APK on PWABuilder →</span>
          </a>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
