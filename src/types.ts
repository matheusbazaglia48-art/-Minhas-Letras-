export interface Song {
  id: string;
  title: string;             // Custom display name (e.g. "Porque Ele Vive")
  originalFileName: string;  // Physical file name (e.g. "porque_ele_vive_v1.pdf")
  categoryId: string;        // ID of category it belongs to
  pageCount: number;         // Total pages in this PDF
  fileSize?: number;         // Size in bytes
  order: number;             // Custom order within category (1, 2, 3...)
  isFavorite: boolean;       // Marked as favorite
  lastOpenedAt?: number;     // Timestamp of last view
  thumbnailUrl?: string;     // Cached base64 or blob URL of 1st page
  keySignature?: string;     // Tone (e.g. "G", "C#m", "D")
  bpm?: number;              // Tempo
  notes?: string;            // Quick note or arrangement notes
  createdAt: number;
  pdfStorageKey: string;     // Key in IndexedDB for full binary PDF data
}

export interface Category {
  id: string;
  name: string;              // e.g. "Louvores", "Sertanejo", "Rock", "Hinos"
  icon?: string;             // Lucide icon key
  color?: string;            // Color accent
  order: number;             // Custom order of categories
  createdAt: number;
}

export interface AppSettings {
  theme: 'dark-obsidian' | 'oled-black' | 'slate-midnight' | 'stage-contrast';
  presentationMode: 'slides' | 'continuous';
  defaultZoomMode: 'fit-screen' | 'fit-width' | 'custom';
  defaultZoomLevel: number;
  autoHideControls: boolean;
  autoHideDelaySeconds: number;
  autoScrollSpeed: number;     // 1 to 100
  thumbnailSize: 'compact' | 'medium' | 'large';
  autoFullscreenOnOpen: boolean;
  enableKeyboardShortcuts: boolean;
  showPageNumbersOnSlide: boolean;
  invertColorsForNightStage: boolean;
}

export interface LibraryMetadataExport {
  version: string;
  exportDate: string;
  categories: Category[];
  songs: Omit<Song, 'pdfStorageKey'>[];
  settings: AppSettings;
}

export type ActiveView = 
  | { type: 'library'; categoryId?: string }
  | { type: 'favorites' }
  | { type: 'recent' }
  | { type: 'settings' }
  | { type: 'windows_exporter' };
