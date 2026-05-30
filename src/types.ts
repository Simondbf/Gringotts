export type MediaType = 'book' | 'movie' | 'boardgame';
export type OwnershipStatus = 'owned' | 'wishlist' | 'experienced_unowned';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  creator: string; // Author, Director, or Studio
  coverUrl?: string; // Optional cover image URL
  liked: boolean | null; // true: like, false: dislike, null: neutral
  loanedTo: string | null; // Name of the person, or null if not loaned
  dateAdded: number;
  user_id?: string;
  ownershipStatus?: OwnershipStatus; // Pour 'Je le veux', 'Déjà vu mais je ne l'ai pas', etc.
}
