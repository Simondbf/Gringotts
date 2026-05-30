import { ThumbsUp, ThumbsDown, User, Book, Film, Gamepad2, MoreVertical, Trash2 } from 'lucide-react';
import { MediaItem } from '../types';
import { useState } from 'react';

interface MediaCardProps {
  item: MediaItem;
  onUpdate: (id: string, updates: Partial<MediaItem>) => void;
  onDelete: (id: string) => void;
}

export default function MediaCard({ item, onUpdate, onDelete }: MediaCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = item.type === 'book' ? Book : item.type === 'movie' ? Film : Gamepad2;
  
  const handleLoan = () => {
    if (item.loanedTo) {
      onUpdate(item.id, { loanedTo: null });
    } else {
      const name = window.prompt("À qui prêtez-vous cet élément ?");
      if (name && name.trim()) {
        onUpdate(item.id, { loanedTo: name.trim() });
      }
    }
  };

  return (
    <div className="flex bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-48">
      {/* Cover Image */}
      <div className="w-32 bg-gray-100 flex-shrink-0 relative flex items-center justify-center border-r border-gray-100">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-10 h-10 text-gray-400" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <div className="flex justify-between items-start">
          <div className="min-w-0 pr-2">
            <h3 className="text-lg font-bold text-gray-900 truncate" title={item.title}>
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 truncate">{item.creator}</p>
            {item.ownershipStatus === 'wishlist' && (
              <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Je le veux
              </span>
            )}
            {item.ownershipStatus === 'experienced_unowned' && (
              <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                {item.type === 'movie' ? 'Déjà vu' : item.type === 'book' ? 'Déjà lu' : 'Déjà joué'} (non possédé)
              </span>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                  <button
                    onClick={() => { setShowMenu(false); onDelete(item.id); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end mt-2">
           {item.loanedTo && (
             <div className="mb-3">
               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-orange-100">
                 <User className="w-3.5 h-3.5" />
                 Prêté à <span className="font-bold">{item.loanedTo}</span>
               </span>
             </div>
           )}

           <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
             {/* Rating system */}
             <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onUpdate(item.id, { liked: item.liked === true ? null : true })}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    item.liked === true 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${item.liked === true ? 'fill-current' : ''}`} />
                  J'aime
                </button>
                <button
                  onClick={() => onUpdate(item.id, { liked: item.liked === false ? null : false })}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    item.liked === false 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${item.liked === false ? 'fill-current' : ''}`} />
                  Je n'aime pas
                </button>
                {item.type === 'movie' && (
                  <a
                    href={`https://cineprive.app/search?q=${encodeURIComponent(item.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Voir sur CinéPrivé
                  </a>
                )}
             </div>

             <button
                onClick={handleLoan}
                className={`text-sm font-medium underline-offset-4 hover:underline ${
                  item.loanedTo ? 'text-gray-500' : 'text-blue-600'
                }`}
             >
                {item.loanedTo ? 'Récupérer' : 'Prêter à un ami'}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
