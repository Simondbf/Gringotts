import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Library, LogIn, UserPlus, Command, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'error'|'success'} | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setMessage({ text: 'Erreur de configuration base de données', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage(null);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ text: 'Consultez vos e-mails pour réinitialiser le mot de passe.', type: 'success' });
        setIsResetPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Compte créé ! Veuillez vérifier vos messages pour confirmer.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Une erreur est survenue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-emerald-600">
          <Library className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Gringotts
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isResetPassword ? 'Réinitialisation du mot de passe' : isSignUp ? 'Créez votre coffre-fort personnel' : 'Connectez-vous à votre coffre-fort'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <form className="space-y-6" onSubmit={handleAuth}>
            {message && (
              <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                {message.text}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            {!isResetPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {!isResetPassword && (
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <button type="button" onClick={() => setIsResetPassword(true)} className="font-medium text-emerald-600 hover:text-emerald-500">
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Chargement...' : isResetPassword ? 'Envoyer le lien' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
                {!loading && (isResetPassword ? <Command className="ml-2 w-4 h-4" /> : isSignUp ? <UserPlus className="ml-2 w-4 h-4" /> : <LogIn className="ml-2 w-4 h-4" />)}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            {isResetPassword ? (
              <button
                onClick={() => setIsResetPassword(false)}
                className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                Retour à la connexion
              </button>
            ) : (
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-emerald-600 hover:text-emerald-500 focus:outline-none font-medium"
              >
                {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
