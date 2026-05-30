import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstruction, setShowIOSInstruction] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Détecter si l'app est DÉJÀ installée (Standalone PWA)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const isAppMode = mediaQuery.matches || (window.navigator as any).standalone;
    setIsStandalone(isAppMode);

    // Mettre à jour si ça change pendant la navigation
    const handleChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // 2. Détecter si l'utilisateur est sur iOS (qui nécessite une action manuelle)
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // 3. Intercepter le prompt natif Chrome/Android
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Empêche l'affichage automatique
      setDeferredPrompt(e); // On le garde pour le lier à notre bouton perso
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Ne rien afficher si l'app est déjà installée
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstruction(true); // Ouvre le mini-tuto pour Apple
    } else if (deferredPrompt) {
      // Lance le prompt natif d'installation sur Android / PC
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Si le navigateur ne gère pas le prompt ET qu'on n'est pas sur iOS (= navigateur incompatible)
  // Ou si le prompt n'a pas encore "pop" techniquement en fond.
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors"
      >
        <Download className="w-4 h-4" />
        Installer l'app
      </button>
      
      <button
        onClick={handleInstallClick}
        className="sm:hidden p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors relative"
        title="Installer l'app"
      >
        <Download className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
      </button>

      {/* Modal / Tuto pour iOS (Apple) */}
      {showIOSInstruction && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-gray-900 bg-opacity-50 transition-opacity">
          <div className="bg-white translate-y-0 rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-sm p-6 relative animate-in slide-in-from-bottom-5">
            <button 
              onClick={() => setShowIOSInstruction(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Installer sur iPhone/iPad</h3>
            <p className="text-sm text-gray-600 mb-4">
              Apple ne permet pas l'installation automatique. Installez facilement Gringotts avec Safari :
            </p>
            <ol className="text-sm font-medium text-gray-800 space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">1</div>
                <div>Appuyez sur <Share className="inline w-4 h-4 text-blue-500 mx-1" /> dans Safari.</div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">2</div>
                <div>Choisissez <PlusSquare className="inline w-4 h-4 mx-1" /> <strong>Sur l'écran d'accueil</strong>.</div>
              </li>
            </ol>
            <button 
              onClick={() => setShowIOSInstruction(false)}
              className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
            >
              C'est compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
