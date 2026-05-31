/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Plus, Book, Film, Gamepad2, Search, Library, X, LogOut } from 'lucide-react';
import { MediaItem, MediaType, OwnershipStatus } from './types';
import MediaCard from './components/MediaCard';
import Auth from './components/Auth';
import InstallPWA from './components/InstallPWA';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('gringotts-data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<MediaType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{text: string, type: 'error'|'success'} | null>(null);
  const [logoClicks, setLogoClicks] = useState(0);
  const [newItem, setNewItem] = useState({ 
    title: '', 
    creator: '', 
    type: 'book' as MediaType, 
    coverUrl: '',
    ownershipStatus: 'owned' as OwnershipStatus
  });

  useEffect(() => {
    const version = localStorage.getItem('gringotts-version');
    if (version !== '1.2.0' && session) {
      setShowWhatsNew(true);
    }
  }, [session]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage({ text: 'Mot de passe mis à jour avec succès.', type: 'success' });
      setTimeout(() => setShowUpdatePassword(false), 3000);
    } catch (error: any) {
      setPasswordMessage({ text: error.message || 'Erreur lors de la mise à jour', type: 'error' });
    }
  };

  const closeWhatsNew = () => {
    localStorage.setItem('gringotts-version', '1.2.0');
    setShowWhatsNew(false);
  };

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      document.body.classList.toggle('theme-80s');
      setLogoClicks(0);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
      if (!session) setItems([]); // Clear items on logout
    });

    return () => subscription.unsubscribe();
  }, []);

  // Synchro initiale Supabase au chargement
  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!supabase || !session?.user) return;
      try {
        const { data, error } = await supabase.from('media_items').select('*').order('dateAdded', { ascending: false });
        if (error) throw error;
        if (data) {
          setItems(data);
          localStorage.setItem('gringotts-data', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      }
    };
    
    loadFromSupabase();
  }, [session]);

  useEffect(() => {
    localStorage.setItem('gringotts-data', JSON.stringify(items));
  }, [items]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim() || !session?.user) return;
    
    const newMedia: MediaItem = {
      id: crypto.randomUUID(),
      title: newItem.title.trim(),
      creator: newItem.creator.trim() || 'Inconnu',
      coverUrl: newItem.coverUrl.trim() || undefined,
      type: newItem.type,
      liked: null,
      loanedTo: null,
      dateAdded: Date.now(),
      user_id: session.user.id,
      ownershipStatus: newItem.ownershipStatus
    };
    
    // Mise à jour optimiste locale
    setItems((prev) => [newMedia, ...prev]);
    setNewItem({ 
      title: '', 
      creator: '', 
      type: 'book' as MediaType, 
      coverUrl: '',
      ownershipStatus: 'owned' as OwnershipStatus
    });
    setShowAddModal(false);

    // Envoi en fond sur Supabase
    if (supabase) {
      try {
        const { error } = await supabase.from('media_items').insert([newMedia]);
        if (error) throw error;
      } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        // Rollback
        setItems((prev) => prev.filter(item => item.id !== newMedia.id));
        alert('Erreur: impossible d\'ajouter l\'élément.');
      }
    }
  };

  const updateItem = async (id: string, updates: Partial<MediaItem>) => {
    const previousItems = [...items];
    setItems((prev) => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    
    if (supabase) {
      try {
        const { error } = await supabase.from('media_items').update(updates).eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        // Rollback
        setItems(previousItems);
        alert('Erreur: impossible de mettre à jour l\'élément.');
      }
    }
  };

  const deleteItem = async (id: string) => {
    const previousItems = [...items];
    setItems((prev) => prev.filter(item => item.id !== id));
    
    if (supabase) {
      try {
        const { error } = await supabase.from('media_items').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // Rollback
        setItems(previousItems);
        alert('Erreur: impossible de supprimer l\'élément.');
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans text-gray-900">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 text-emerald-600 cursor-pointer select-none" 
            onClick={handleLogoClick}
          >
            <Library className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight hidden sm:block">Gringotts</h1>
          </div>
          
          <div className="hidden sm:flex flex-1 max-w-md mx-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Rechercher des livres, auteurs, films..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <InstallPWA />
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Scanner
            </button>
            <button
              onClick={() => supabase?.auth.signOut()}
              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-24 md:pb-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav (Desktop) */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <nav className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Ma Collection
            </h3>
            {([
              { id: 'all', label: 'Toute la collection', icon: Library },
              { id: 'book', label: 'Livres', icon: Book },
              { id: 'movie', label: 'Films', icon: Film },
              { id: 'boardgame', label: 'Jeux de société', icon: Gamepad2 }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MediaType | 'all')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className={`flex-shrink-0 mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-emerald-500' : 'text-gray-400'}`} />
                <span className="truncate">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="ml-auto bg-white text-emerald-600 py-0.5 px-2 rounded-full text-xs border border-emerald-100">
                    {activeTab === 'all' ? items.length : items.filter(i => i.type === tab.id).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">
              {activeTab === 'all' ? 'Toute la collection' : 
               activeTab === 'book' ? 'Livres' : 
               activeTab === 'movie' ? 'Films' : 'Jeux de société'}
            </h2>
            <p className="text-sm text-gray-500">{filteredItems.length} élément(s)</p>
          </div>

          <div className="sm:hidden mb-4 space-y-3">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
               </div>
               <input
                 type="text"
                 className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                 placeholder="Rechercher..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             
             {/* Filtres Horizontaux sur mobile */}
             <div className="flex overflow-x-auto pb-1 gap-2 hide-scrollbar">
                {([
                  { id: 'all', label: 'Tout' },
                  { id: 'book', label: 'Livres' },
                  { id: 'movie', label: 'Films' },
                  { id: 'boardgame', label: 'Jeux' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as MediaType | 'all')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      activeTab === tab.id 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-20 px-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
               <Library className="mx-auto h-12 w-12 text-gray-400" />
               <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun élément trouvé</h3>
               <p className="mt-1 text-sm text-gray-500">
                 Commencez par ajouter des éléments à votre collection Gringotts.
               </p>
               <button
                 onClick={() => setShowAddModal(true)}
                 className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
               >
                 <Plus className="w-4 h-4 mr-1.5" />
                 Scanner maintenant
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <MediaCard 
                  key={item.id} 
                  item={item} 
                  onUpdate={updateItem} 
                  onDelete={deleteItem} 
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto px-2">
          <div className="flex justify-around items-center h-16 text-xs">
            <button
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <Library className="h-6 w-6 mb-1" />
              <span className="font-medium">Collection</span>
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <Plus className="h-6 w-6 mb-1 text-emerald-600" />
              <span className="font-medium text-emerald-600">Scanner</span>
            </button>
            
            <button
              onClick={() => supabase?.auth.signOut()}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-6 w-6 mb-1" />
              <span className="font-medium">Quitter</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAddModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Ajouter à la bibliothèque
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de média</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['book', 'movie', 'boardgame'] as MediaType[]).map(type => (
                        <label 
                          key={type} 
                          className={`flex flex-col items-center p-3 border rounded-md cursor-pointer transition-colors ${
                            newItem.type === type ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="type" 
                            value={type} 
                            checked={newItem.type === type}
                            onChange={(e) => setNewItem({ ...newItem, type: e.target.value as MediaType })}
                            className="sr-only"
                          />
                          {type === 'book' && <Book className="w-6 h-6 mb-1" />}
                          {type === 'movie' && <Film className="w-6 h-6 mb-1" />}
                          {type === 'boardgame' && <Gamepad2 className="w-6 h-6 mb-1" />}
                          <span className="text-xs font-medium">
                            {type === 'book' ? 'Livre' : type === 'movie' ? 'Film' : 'Jeu'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Ex: Le Seigneur des Anneaux"
                    />
                  </div>

                  <div>
                    <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-1">
                      Auteur / Réalisateur
                    </label>
                    <input
                      id="creator"
                      type="text"
                      value={newItem.creator}
                      onChange={(e) => setNewItem({ ...newItem, creator: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Ex: J.R.R. Tolkien"
                    />
                  </div>

                  <div>
                    <label htmlFor="cover" className="block text-sm font-medium text-gray-700 mb-1">
                      URL de l'image de couverture (optionnel)
                    </label>
                    <input
                      id="cover"
                      type="url"
                      value={newItem.coverUrl}
                      onChange={(e) => setNewItem({ ...newItem, coverUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={newItem.ownershipStatus}
                      onChange={(e) => setNewItem({ ...newItem, ownershipStatus: e.target.value as OwnershipStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                    >
                      <option value="owned">Je l'ai dans ma collection</option>
                      <option value="wishlist">Je le veux (Liste de souhaits)</option>
                      <option value="experienced_unowned">{newItem.type === 'movie' ? 'Déjà vu' : newItem.type === 'book' ? 'Déjà lu' : 'Déjà joué'} (non possédé)</option>
                    </select>
                  </div>
                 
                 <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                   <button
                     type="submit"
                     className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none sm:col-start-2 sm:text-sm"
                   >
                     Enregistrer
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowAddModal(false)}
                     className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                   >
                     Annuler
                   </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveautés */}
      {showWhatsNew && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeWhatsNew}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Quoi de neuf (v1.2.0) 🎉
                </h3>
                <button onClick={closeWhatsNew} className="text-gray-400 hover:text-gray-500 rounded-full p-1 border">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Authentification</h4>
                  <p className="text-sm text-gray-600">
                    Vous pouvez maintenant vous connecter avec Google ou votre e-mail, avec une option pour se souvenir de vous sur l'appareil.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Nouveau Thème Émeraude</h4>
                  <p className="text-sm text-gray-600">
                    Nous avons abandonné le bleu pour un vert émeraude plus élégant. 
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Secret 🤫</h4>
                  <p className="text-sm text-gray-600">
                    Cliquez sur le logo 5 fois pour un petit voyage dans le temps...
                  </p>
                </div>
              </div>
                 
              <div className="sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={closeWhatsNew}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Compris !
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdatePassword && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowUpdatePassword(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Créer un nouveau mot de passe
                </h3>
                <button onClick={() => setShowUpdatePassword(false)} className="text-gray-400 hover:text-gray-500 rounded-full p-1 border">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>
                {passwordMessage && (
                  <div className={`p-3 rounded-md mb-4 ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                     <p className="text-sm font-medium">{passwordMessage.text}</p>
                  </div>
                )}
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:col-start-2 sm:text-sm"
                  >
                    Mettre à jour
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpdatePassword(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
