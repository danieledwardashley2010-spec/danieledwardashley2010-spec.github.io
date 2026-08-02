import { useState, useEffect } from 'react';
import { Download, X, MapPin } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export default function InstallPrompt() {
  const { canInstall, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const iosDismissed = localStorage.getItem('pwa-ios-dismissed');

    if (isIOS && !isStandalone && !iosDismissed) {
      setShowIOSHint(true);
    }
  }, []);

  if (dismissed) return null;

  // Android / Chrome install prompt
  if (canInstall) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-sm rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <MapPin className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-stone-900">Install Scavenger Hunt</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                Add it to your home screen for quick access and offline play.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-stone-300 transition-colors hover:text-stone-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS instructions (Safari doesn't support beforeinstallprompt)
  if (showIOSHint) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-sm rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <MapPin className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-stone-900">Add to Home Screen</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                Tap the Share button, then "Add to Home Screen" to install the app for quick access and offline play.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    localStorage.setItem('pwa-ios-dismissed', '1');
                    setDismissed(true);
                  }}
                  className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-700"
                >
                  Got it
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('pwa-ios-dismissed', '1');
                setDismissed(true);
              }}
              className="text-stone-300 transition-colors hover:text-stone-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
