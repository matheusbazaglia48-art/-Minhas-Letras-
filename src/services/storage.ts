import { Song, Category, AppSettings, LibraryMetadataExport } from '../types';
import { generateSampleSongPdf, getPdfPageCount, renderPdfThumbnail } from './pdfEngine';
import JSZip from 'jszip';

const DB_NAME = 'MinhasLetrasV4_DB';
const STORE_NAME = 'pdf_storage';
const DB_VERSION = 1;
const METADATA_STORAGE_KEY = 'minhas_letras_v4_metadata';
const SETTINGS_STORAGE_KEY = 'minhas_letras_v4_settings';

// Default Settings
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark-obsidian',
  presentationMode: 'slides',
  defaultZoomMode: 'fit-screen',
  defaultZoomLevel: 100,
  autoHideControls: true,
  autoHideDelaySeconds: 3,
  autoScrollSpeed: 30, // 1 to 100
  thumbnailSize: 'medium',
  autoFullscreenOnOpen: false,
  enableKeyboardShortcuts: true,
  showPageNumbersOnSlide: true,
  invertColorsForNightStage: false,
};

// Initial Categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-louvores', name: 'Louvores & Adoração', icon: 'Sparkles', color: 'indigo', order: 0, createdAt: Date.now() - 50000 },
  { id: 'cat-sertanejo', name: 'Sertanejo & Raiz', icon: 'Guitar', color: 'amber', order: 1, createdAt: Date.now() - 40000 },
  { id: 'cat-rock', name: 'Rock & Pop Acústico', icon: 'Flame', color: 'rose', order: 2, createdAt: Date.now() - 30000 },
  { id: 'cat-mpb', name: 'MPB & Bossa Nova', icon: 'Music', color: 'emerald', order: 3, createdAt: Date.now() - 20000 },
  { id: 'cat-hinos', name: 'Hinos Tradicionais', icon: 'BookOpen', color: 'cyan', order: 4, createdAt: Date.now() - 10000 },
];

/**
 * Open IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save PDF binary data to IndexedDB
 */
export async function savePdfBlob(key: string, data: ArrayBuffer): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Load PDF binary data from IndexedDB
 */
export async function getPdfBlob(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get PDF from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete PDF binary from IndexedDB
 */
export async function deletePdfBlob(key: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete PDF blob:', err);
  }
}

/**
 * Load Metadata (Categories and Songs)
 */
export function loadMetadata(): { categories: Category[]; songs: Song[] } {
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    if (!raw) return { categories: [], songs: [] };
    const parsed = JSON.parse(raw);
    return {
      categories: parsed.categories || [],
      songs: parsed.songs || [],
    };
  } catch (err) {
    console.error('Error loading metadata from localStorage:', err);
    return { categories: [], songs: [] };
  }
}

/**
 * Save Metadata (Categories and Songs) to localStorage
 */
export function saveMetadata(categories: Category[], songs: Song[]): void {
  try {
    localStorage.setItem(
      METADATA_STORAGE_KEY,
      JSON.stringify({ categories, songs, updatedAt: Date.now() })
    );
  } catch (err) {
    console.error('Error saving metadata:', err);
  }
}

/**
 * Load User Settings
 */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save User Settings
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

/**
 * Initialize default demo library with sample song scores
 */
export async function initializeDefaultLibrary(): Promise<{ categories: Category[]; songs: Song[] }> {
  const existing = loadMetadata();
  if (existing.categories.length > 0 && existing.songs.length > 0) {
    return existing;
  }

  const categories = [...DEFAULT_CATEGORIES];
  const sampleSongsList: {
    title: string;
    artist: string;
    originalFileName: string;
    categoryId: string;
    tone: string;
    bpm: number;
    order: number;
    pages: { pageNum: number; content: string[] }[];
  }[] = [
    // Louvores
    {
      title: 'Porque Ele Vive (Deus Enviou)',
      artist: 'Harpa Cristã / Tradicional',
      originalFileName: 'porque_ele_vive_completo.pdf',
      categoryId: 'cat-louvores',
      tone: 'G (Sol Maior)',
      bpm: 72,
      order: 0,
      pages: [
        {
          pageNum: 1,
          content: [
            '[INTRODUÇÃO]',
            '§ G    C    G    D7    G',
            '',
            '[VERSO 1]',
            '§ G                 C',
            'Deus enviou seu Filho amado',
            '§ G                 D7',
            'Para salvar e perdoar',
            '§ G                 C',
            'Na cruz morreu por meu pecado',
            '§ G         D7             G',
            'Mas ressurgiu e vivo com o Pai está',
            '',
            '[REFRÃO]',
            '§ G                  C',
            'Porque Ele vive, eu posso crer no amanhã',
            '§ G                  D7',
            'Porque Ele vive, temor não há',
            '§ G            C',
            'Mas eu bem sei, eu sei que a minha vida',
            '§ G          D7             G',
            'Está nas mãos do meu Jesus, que vivo está',
          ],
        },
        {
          pageNum: 2,
          content: [
            '[VERSO 2]',
            '§ G                 C',
            'E quando, enfim, chegar a hora',
            '§ G                 D7',
            'Em que a morte enfrentarei',
            '§ G                 C',
            'Sem medo, então, terei vitória',
            '§ G          D7              G',
            'Verei na glória o meu Jesus que vivo está',
            '',
            '[REFRÃO FINAL]',
            '§ G                  C',
            'Porque Ele vive, eu posso crer no amanhã',
            '§ G                  D7',
            'Porque Ele vive, temor não há',
            '§ G            C',
            'Mas eu bem sei, eu sei que a minha vida',
            '§ G          D7             G',
            'Está nas mãos do meu Jesus, que vivo está',
            '',
            '[FINALIZAÇÃO]',
            '§ G    C    G    D7    G',
            '(Segurar última nota com fade out)',
          ],
        },
      ],
    },
    {
      title: 'A Casa É Sua (Vem Me Visitar)',
      artist: 'Casa Worship',
      originalFileName: 'casa_e_sua_oficial.pdf',
      categoryId: 'cat-louvores',
      tone: 'E (Mi Maior)',
      bpm: 68,
      order: 1,
      pages: [
        {
          pageNum: 1,
          content: [
            '[INTRO]',
            '§ E    A9    C#m7    B9',
            '',
            '[VERSO]',
            '§ E',
            'Você é bem-vindo aqui',
            '§ A9',
            'A casa é Sua, pode entrar',
            '§ C#m7                  B9',
            'Me esvazio de mim, me esvazio de mim',
            '',
            '[PRÉ-REFRÃO]',
            '§ A9                  B9',
            'Sopra Teu vento, acende o fogo',
            '§ C#m7                G#m7',
            'Derrama a chuva neste lugar',
          ],
        },
        {
          pageNum: 2,
          content: [
            '[REFRÃO]',
            '§ E                      B9',
            'Essa casa é Sua casa, nós deixamos ela pra Você, Jesus',
            '§ C#m7                   A9',
            'Essa casa é Sua casa, nós deixamos ela pra Você, Jesus',
            '',
            '[PONTE]',
            '§ A9                     B9',
            'Apareça, que o Teu nome cresça',
            '§ C#m7                   G#m7',
            'Enche este lugar, enche este lugar',
          ],
        },
      ],
    },
    // Sertanejo
    {
      title: 'Evidências (Chega de Mentiras)',
      artist: 'Chitãozinho & Xororó',
      originalFileName: 'evidencias_tom_original.pdf',
      categoryId: 'cat-sertanejo',
      tone: 'E (Mi Maior)',
      bpm: 92,
      order: 0,
      pages: [
        {
          pageNum: 1,
          content: [
            '[INTRO]',
            '§ E    G#m    A    B7',
            '',
            '[VERSO 1]',
            '§ E                          G#m',
            'Quando eu digo que deixei de te amar',
            '§ A                          B7',
            'É porque eu te amo',
            '§ E                          G#m',
            'Quando eu digo que não quero mais você',
            '§ A                          B7',
            'É porque eu te quero',
            '',
            '[PRÉ-REFRÃO]',
            '§ C#m                        G#m',
            'Eu tenho medo de te dar meu coração',
            '§ A                          E',
            'E confessar que eu estou em tuas mãos',
          ],
        },
        {
          pageNum: 2,
          content: [
            '[REFRÃO]',
            '§ E                          G#m',
            'E nessa loucura de dizer que não te quero',
            '§ A                          B7',
            'Vou negando as aparências, disfarçando as evidências',
            '§ E                          G#m',
            'Mas pra que viver fingindo, se eu não posso enganar meu coração?',
            '§ A                          B7',
            'Eu sei que te amo!',
            '§ A            B7            E',
            'Chega de mentiras, de negar o meu desejo!',
          ],
        },
      ],
    },
    {
      title: 'Romaria (É de Sonho e de Pó)',
      artist: 'Renato Teixeira',
      originalFileName: 'romaria_violao.pdf',
      categoryId: 'cat-sertanejo',
      tone: 'A (Lá Maior)',
      bpm: 80,
      order: 1,
      pages: [
        {
          pageNum: 1,
          content: [
            '[INTRODUÇÃO]',
            '§ A    D    E7    A',
            '',
            '[VERSO 1]',
            '§ A                      D',
            'É de sonho e de pó que a vida é feita',
            '§ A                      E7',
            'De amor, de esperança e de fé',
            '§ A                      D',
            'Como eu não sei rezar, só queria mostrar',
            '§ A             E7       A',
            'Meu olhar, meu olhar, meu olhar',
            '',
            '[REFRÃO]',
            '§ D          E7          A',
            'Sou caipira, Pirapora de Nossa Senhora de Aparecida',
            '§ D          E7          A',
            'Ilumina a mina escura e funda do meu coração',
          ],
        },
      ],
    },
    // Rock & Pop
    {
      title: 'Tempo Perdido',
      artist: 'Legião Urbana',
      originalFileName: 'tempo_perdido_cifrada.pdf',
      categoryId: 'cat-rock',
      tone: 'C (Dó Maior)',
      bpm: 118,
      order: 0,
      pages: [
        {
          pageNum: 1,
          content: [
            '[INTRO DEDILHADO]',
            '§ C    Am7    Bm    Em',
            '',
            '[VERSO 1]',
            '§ C                       Am7',
            'Todos os dias quando acordo',
            '§ Bm                      Em',
            'Não tenho mais o tempo que passou',
            '§ C                       Am7',
            'Mas tenho muito tempo',
            '§ Bm                      Em',
            'Temos todo o tempo do mundo',
            '',
            '[VERSO 2]',
            '§ C                       Am7',
            'Todos os dias antes de dormir',
            '§ Bm                      Em',
            'Lembro e esqueço como foi o dia',
            '§ C                       Am7',
            'Sempre em frente, não temos tempo a perder',
          ],
        },
        {
          pageNum: 2,
          content: [
            '[REFRÃO]',
            '§ C                       Am7',
            'Nosso suor sagrado é bem mais belo',
            '§ Bm                      Em',
            'Que esse sangue amargo',
            '§ C                       Am7',
            'E tão sério e selvagem...',
            '§ Bm                      Em',
            'Veja o sol dessa manhã tão cinza',
            '§ C            Am7        Bm         Em',
            'A tempestade que chega é da cor dos teus olhos...',
          ],
        },
      ],
    },
    // MPB
    {
      title: 'Garota de Ipanema',
      artist: 'Tom Jobim & Vinícius de Moraes',
      originalFileName: 'garota_de_ipanema_bossa.pdf',
      categoryId: 'cat-mpb',
      tone: 'F (Fá Maior)',
      bpm: 124,
      order: 0,
      pages: [
        {
          pageNum: 1,
          content: [
            '[INTRO BOSSA]',
            '§ F7M    G7    Gm7    Gb7(b5)',
            '',
            '[A]',
            '§ F7M',
            'Olha que coisa mais linda, mais cheia de graça',
            '§ G7',
            'É ela, menina, que vem e que passa',
            '§ Gm7               Gb7(b5)      F7M',
            'Num doce balanço a caminho do mar',
            '',
            '[B]',
            '§ F#7M             B7',
            'Ah, por que estou tão sozinho?',
            '§ F#m7             D7(9)',
            'Ah, por que tudo é tão triste?',
            '§ Gm7              Eb7(9)',
            'Ah, a beleza que existe, a beleza que não é só minha...',
          ],
        },
      ],
    },
  ];

  const songs: Song[] = [];

  for (const sample of sampleSongsList) {
    const storageKey = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const pdfBuffer = generateSampleSongPdf(sample.title, sample.artist, sample.categoryId, sample.tone, sample.pages);
    
    // Save to IndexedDB
    await savePdfBlob(storageKey, pdfBuffer);

    // Render thumbnail
    const thumb = await renderPdfThumbnail(pdfBuffer, storageKey);

    songs.push({
      id: `song-${Math.random().toString(36).substring(2, 9)}`,
      title: sample.title,
      originalFileName: sample.originalFileName,
      categoryId: sample.categoryId,
      pageCount: sample.pages.length,
      fileSize: pdfBuffer.byteLength,
      order: sample.order,
      isFavorite: sample.order === 0,
      lastOpenedAt: Date.now() - (sample.order * 3600000),
      thumbnailUrl: thumb,
      keySignature: sample.tone,
      bpm: sample.bpm,
      notes: `Artista: ${sample.artist}`,
      createdAt: Date.now() - (sample.order * 86400000),
      pdfStorageKey: storageKey,
    });
  }

  saveMetadata(categories, songs);
  return { categories, songs };
}

/**
 * Import a new single or batch PDF file into a specified category
 */
export async function importPdfSong(
  file: File,
  categoryId: string,
  currentSongsInCategory: Song[]
): Promise<Song> {
  const buffer = await file.arrayBuffer();
  const storageKey = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Save binary in IndexedDB
  await savePdfBlob(storageKey, buffer);

  // Compute page count & thumbnail
  const pageCount = await getPdfPageCount(buffer);
  const thumb = await renderPdfThumbnail(buffer, storageKey);

  // Extract clean display title from filename (strip .pdf and clean underscores/dashes)
  const baseName = file.name.replace(/\.pdf$/i, '');
  const cleanTitle = baseName
    .replace(/[_-]+/g, ' ')
    .replace(/^\d+\s*[-_.]?\s*/, '') // Strip leading numbers like "01 - "
    .trim();
  
  const displayTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // Calculate highest order
  const maxOrder = currentSongsInCategory.reduce((max, s) => Math.max(max, s.order), -1);

  const newSong: Song = {
    id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: displayTitle || baseName,
    originalFileName: file.name,
    categoryId,
    pageCount: pageCount || 1,
    fileSize: file.size,
    order: maxOrder + 1,
    isFavorite: false,
    thumbnailUrl: thumb,
    createdAt: Date.now(),
    pdfStorageKey: storageKey,
  };

  return newSong;
}

/**
 * Export entire library configuration and PDFs as a backup ZIP
 */
export async function exportCompleteBackupZip(categories: Category[], songs: Song[], settings: AppSettings): Promise<Blob> {
  const zip = new JSZip();

  // Create metadata JSON
  const metadata: LibraryMetadataExport = {
    version: '4.0.0',
    exportDate: new Date().toISOString(),
    categories,
    songs: songs.map(({ pdfStorageKey, ...rest }) => rest),
    settings,
  };

  zip.file('minhas_letras_metadata.json', JSON.stringify(metadata, null, 2));

  // Add individual PDFs inside category subfolders
  for (const cat of categories) {
    const safeCatName = cat.name.replace(/[\\/:*?"<>|]/g, '_');
    const catSongs = songs.filter(s => s.categoryId === cat.id).sort((a, b) => a.order - b.order);

    for (let i = 0; i < catSongs.length; i++) {
      const s = catSongs[i];
      const pdfBuffer = await getPdfBlob(s.pdfStorageKey);
      if (pdfBuffer) {
        // e.g. "Biblioteca/Louvores/01_Porque_Ele_Vive.pdf"
        const prefix = String(i + 1).padStart(2, '0');
        const safeTitle = s.title.replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `${prefix}_${safeTitle}.pdf`;
        zip.file(`Biblioteca/${safeCatName}/${fileName}`, pdfBuffer);
      }
    }
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Export the standalone Python source package (for Windows 7 standalone .exe building)
 */
export async function exportWindowsPythonPackage(): Promise<Blob> {
  const zip = new JSZip();

  const pythonScript = `"""
Minhas Letras V4 - Standalone Desktop Edition (Windows 7 / 8 / 10 / 11 Compatible)
Criado para músicos: Apresentador de slides de PDF de músicas com rolagem automática,
organização por categorias com ordem personalizada permanente (1 PDF = 1 Música independente).
"""

import sys
import os
import json
import fitz  # PyMuPDF
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QListWidget, QListWidgetItem, QPushButton, QLabel, QSplitter,
    QFileDialog, QMessageBox, QInputDialog, QSlider, QFrame,
    QShortcut, QStackedWidget, QScrollArea, QGraphicsOpacityEffect,
    QToolBar, QAction, QComboBox, QLineEdit
)
from PyQt5.QtGui import QIcon, QPixmap, QImage, QColor, QFont, QKeySequence, QPalette
from PyQt5.QtCore import Qt, QTimer, QSize, pyqtSignal, QPoint

CONFIG_FILE = "minhas_letras_dados.json"

class MinhasLetrasApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Minhas Letras V4 - Biblioteca de Músicas em PDF")
        self.resize(1100, 720)
        self.setStyleSheet("""
            QMainWindow { background-color: #0b0f19; color: #f1f5f9; }
            QWidget { background-color: #0b0f19; color: #f1f5f9; font-family: 'Segoe UI', Arial; }
            QListWidget { background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 6px; }
            QListWidget::item { padding: 10px; border-radius: 6px; margin-bottom: 2px; }
            QListWidget::item:hover { background-color: #1f2937; }
            QListWidget::item:selected { background-color: #4f46e5; color: white; font-weight: bold; }
            QPushButton { background-color: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 8px 14px; font-weight: bold; }
            QPushButton:hover { background-color: #374151; border-color: #4b5563; }
            QLineEdit { background-color: #111827; border: 1px solid #374151; border-radius: 6px; padding: 8px; color: white; }
            QSlider::groove:horizontal { height: 6px; background: #374151; border-radius: 3px; }
            QSlider::handle:horizontal { background: #6366f1; width: 16px; margin: -5px 0; border-radius: 8px; }
        """)

        self.categories = []
        self.songs = []
        self.current_cat_id = None
        self.current_song = None
        self.current_doc = None
        self.current_page = 0
        self.auto_scroll_timer = QTimer(self)
        self.auto_scroll_timer.timeout.connect(self.auto_scroll_step)
        self.auto_scroll_speed = 30
        self.is_auto_scrolling = False

        self.load_data()
        self.init_ui()

    def init_ui(self):
        self.stacked = QStackedWidget()
        self.setCentralWidget(self.stacked)

        # Main Library View
        self.library_view = QWidget()
        lib_layout = QHBoxLayout(self.library_view)

        # Left panel: Categories
        left_panel = QVBoxLayout()
        cat_title = QLabel("📁 CATEGORIAS")
        cat_title.setStyleSheet("font-size: 13px; font-weight: bold; color: #94a3b8; letter-spacing: 1px;")
        left_panel.addWidget(cat_title)

        self.cat_list = QListWidget()
        self.cat_list.itemClicked.connect(self.on_category_selected)
        left_panel.addWidget(self.cat_list)

        cat_btn_layout = QHBoxLayout()
        self.btn_new_cat = QPushButton("+ Nova Pasta")
        self.btn_new_cat.clicked.connect(self.create_category)
        self.btn_del_cat = QPushButton("Excluir")
        self.btn_del_cat.clicked.connect(self.delete_category)
        cat_btn_layout.addWidget(self.btn_new_cat)
        cat_btn_layout.addWidget(self.btn_del_cat)
        left_panel.addLayout(cat_btn_layout)

        # Right panel: Songs
        right_panel = QVBoxLayout()
        header_layout = QHBoxLayout()
        self.lbl_cat_name = QLabel("Selecione uma Categoria")
        self.lbl_cat_name.setStyleSheet("font-size: 18px; font-weight: bold; color: #e0e7ff;")
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("🔍 Pesquisar música...")
        self.search_input.textChanged.connect(self.filter_songs)

        header_layout.addWidget(self.lbl_cat_name)
        header_layout.addStretch()
        header_layout.addWidget(self.search_input)
        right_panel.addLayout(header_layout)

        # Songs List with Drag and Drop
        self.song_list = QListWidget()
        self.song_list.setDragDropMode(QListWidget.InternalMove)
        self.song_list.model().rowsMoved.connect(self.on_songs_reordered)
        self.song_list.itemDoubleClicked.connect(self.open_presentation)
        right_panel.addWidget(self.song_list)

        # Action bar
        actions_layout = QHBoxLayout()
        self.btn_add_song = QPushButton("➕ Adicionar Música (PDF)")
        self.btn_add_song.setStyleSheet("background-color: #4338ca; border-color: #6366f1;")
        self.btn_add_song.clicked.connect(self.import_single_pdf)

        self.btn_add_multiple = QPushButton("📂 Adicionar Vários PDFs")
        self.btn_add_multiple.clicked.connect(self.import_multiple_pdfs)

        self.btn_move_up = QPushButton("▲ Mover P/ Cima")
        self.btn_move_up.clicked.connect(lambda: self.move_song(-1))

        self.btn_move_down = QPushButton("▼ Mover P/ Baixo")
        self.btn_move_down.clicked.connect(lambda: self.move_song(1))

        self.btn_rename_song = QPushButton("✏️ Renomear")
        self.btn_rename_song.clicked.connect(self.rename_song)

        self.btn_open_present = QPushButton("▶ Apresentar")
        self.btn_open_present.setStyleSheet("background-color: #059669; border-color: #10b981; color: white;")
        self.btn_open_present.clicked.connect(self.open_presentation)

        actions_layout.addWidget(self.btn_add_song)
        actions_layout.addWidget(self.btn_add_multiple)
        actions_layout.addWidget(self.btn_move_up)
        actions_layout.addWidget(self.btn_move_down)
        actions_layout.addWidget(self.btn_rename_song)
        actions_layout.addStretch()
        actions_layout.addWidget(self.btn_open_present)

        right_panel.addLayout(actions_layout)

        splitter = QSplitter(Qt.Horizontal)
        w_left = QWidget(); w_left.setLayout(left_panel)
        w_right = QWidget(); w_right.setLayout(right_panel)
        splitter.addWidget(w_left)
        splitter.addWidget(w_right)
        splitter.setSizes([300, 800])
        lib_layout.addWidget(splitter)

        # Slide Presentation View
        self.present_view = QWidget()
        present_layout = QVBoxLayout(self.present_view)
        present_layout.setContentsMargins(0, 0, 0, 0)

        # Top Presentation Controls
        self.hud_top = QFrame()
        self.hud_top.setStyleSheet("background-color: rgba(17, 24, 39, 0.95); padding: 8px; border-bottom: 1px solid #374151;")
        hud_layout = QHBoxLayout(self.hud_top)

        self.btn_back_lib = QPushButton("⬅ Voltar à Biblioteca (Esc)")
        self.btn_back_lib.clicked.connect(self.close_presentation)

        self.lbl_present_title = QLabel("")
        self.lbl_present_title.setStyleSheet("font-size: 16px; font-weight: bold; color: #a5b4fc;")

        self.lbl_page_indicator = QLabel("Página 1 de 1")
        self.lbl_page_indicator.setStyleSheet("background-color: #312e81; padding: 4px 12px; border-radius: 12px; font-weight: bold;")

        self.btn_prev_page = QPushButton("◀ Anterior (←)")
        self.btn_prev_page.clicked.connect(self.prev_page)
        self.btn_next_page = QPushButton("Próxima (→) ▶")
        self.btn_next_page.clicked.connect(self.next_page)

        self.btn_prev_song = QPushButton("⏮ Música Anterior")
        self.btn_prev_song.clicked.connect(self.prev_song)
        self.btn_next_song = QPushButton("Próxima Música ⏭")
        self.btn_next_song.clicked.connect(self.next_song)

        self.btn_toggle_scroll = QPushButton("⏯ Rolagem (Espaço)")
        self.btn_toggle_scroll.clicked.connect(self.toggle_auto_scroll)

        self.slider_speed = QSlider(Qt.Horizontal)
        self.slider_speed.setRange(1, 100)
        self.slider_speed.setValue(30)
        self.slider_speed.setFixedWidth(100)
        self.slider_speed.valueChanged.connect(self.change_scroll_speed)

        hud_layout.addWidget(self.btn_back_lib)
        hud_layout.addWidget(self.lbl_present_title)
        hud_layout.addStretch()
        hud_layout.addWidget(self.btn_prev_song)
        hud_layout.addWidget(self.btn_prev_page)
        hud_layout.addWidget(self.lbl_page_indicator)
        hud_layout.addWidget(self.btn_next_page)
        hud_layout.addWidget(self.btn_next_song)
        hud_layout.addSpacing(16)
        hud_layout.addWidget(self.btn_toggle_scroll)
        hud_layout.addWidget(QLabel("Velocidade:"))
        hud_layout.addWidget(self.slider_speed)

        present_layout.addWidget(self.hud_top)

        # PDF Display Scroll Area
        self.pdf_scroll = QScrollArea()
        self.pdf_scroll.setAlignment(Qt.AlignCenter)
        self.pdf_scroll.setStyleSheet("border: none; background-color: #030712;")
        self.lbl_pdf_page = QLabel()
        self.lbl_pdf_page.setAlignment(Qt.AlignCenter)
        self.pdf_scroll.setWidget(self.lbl_pdf_page)
        self.pdf_scroll.setWidgetResizable(True)
        present_layout.addWidget(self.pdf_scroll)

        self.stacked.addWidget(self.library_view)
        self.stacked.addWidget(self.present_view)

        # Keyboard shortcuts
        QShortcut(QKeySequence(Qt.Key_Left), self, self.prev_page)
        QShortcut(QKeySequence(Qt.Key_Right), self, self.next_page)
        QShortcut(QKeySequence(Qt.Key_Space), self, self.toggle_auto_scroll)
        QShortcut(QKeySequence(Qt.Key_Escape), self, self.close_presentation)
        QShortcut(QKeySequence(Qt.Key_F11), self, self.toggle_fullscreen)
        QShortcut(QKeySequence(Qt.Key_Home), self, self.first_page)
        QShortcut(QKeySequence(Qt.Key_End), self, self.last_page)

        self.refresh_categories()

    def load_data(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.categories = data.get("categories", [])
                    self.songs = data.get("songs", [])
            except Exception as e:
                print("Error loading config:", e)
        else:
            self.categories = [
                {"id": "cat-louvores", "name": "Louvores & Adoração", "order": 0},
                {"id": "cat-sertanejo", "name": "Sertanejo & Raiz", "order": 1},
                {"id": "cat-rock", "name": "Rock & Pop Acústico", "order": 2},
                {"id": "cat-mpb", "name": "MPB & Bossa Nova", "order": 3}
            ]
            self.save_data()

    def save_data(self):
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump({"categories": self.categories, "songs": self.songs}, f, indent=2, ensure_ascii=False)

    def refresh_categories(self):
        self.cat_list.clear()
        self.categories.sort(key=lambda c: c.get("order", 0))
        for cat in self.categories:
            item = QListWidgetItem(f"📁  {cat['name']}")
            item.setData(Qt.UserRole, cat['id'])
            self.cat_list.addItem(item)
        if self.cat_list.count() > 0:
            self.cat_list.setCurrentRow(0)
            self.on_category_selected(self.cat_list.item(0))

    def on_category_selected(self, item):
        if not item: return
        self.current_cat_id = item.data(Qt.UserRole)
        cat = next((c for c in self.categories if c["id"] == self.current_cat_id), None)
        self.lbl_cat_name.setText(f"📁 {cat['name'] if cat else ''}")
        self.refresh_songs()

    def refresh_songs(self):
        self.song_list.clear()
        if not self.current_cat_id: return
        cat_songs = [s for s in self.songs if s["categoryId"] == self.current_cat_id]
        cat_songs.sort(key=lambda s: s.get("order", 0))
        for idx, s in enumerate(cat_songs):
            item = QListWidgetItem(f"{str(idx+1).zfill(2)} - 🎵 {s['title']} ({s.get('pageCount', 1)} pág.)")
            item.setData(Qt.UserRole, s["id"])
            self.song_list.addItem(item)

    def on_songs_reordered(self):
        if not self.current_cat_id: return
        for i in range(self.song_list.count()):
            item = self.song_list.item(i)
            s_id = item.data(Qt.UserRole)
            song = next((s for s in self.songs if s["id"] == s_id), None)
            if song: song["order"] = i
        self.save_data()
        self.refresh_songs()

    def import_single_pdf(self):
        if not self.current_cat_id: return
        path, _ = QFileDialog.getOpenFileName(self, "Selecionar Música em PDF", "", "PDF Files (*.pdf)")
        if path: self.process_imported_pdf(path)

    def import_multiple_pdfs(self):
        if not self.current_cat_id: return
        paths, _ = QFileDialog.getOpenFileNames(self, "Selecionar Vários PDFs", "", "PDF Files (*.pdf)")
        for p in paths: self.process_imported_pdf(p)

    def process_imported_pdf(self, path):
        try:
            doc = fitz.open(path)
            pages = len(doc)
            doc.close()
            base_name = os.path.basename(path).replace(".pdf", "").replace("_", " ").replace("-", " ").strip()
            cat_songs = [s for s in self.songs if s["categoryId"] == self.current_cat_id]
            new_order = len(cat_songs)
            song_data = {
                "id": f"song-{len(self.songs)+1}-{os.path.basename(path)}",
                "title": base_name.title(),
                "originalFileName": os.path.basename(path),
                "filePath": path,
                "categoryId": self.current_cat_id,
                "pageCount": pages,
                "order": new_order
            }
            self.songs.append(song_data)
            self.save_data()
            self.refresh_songs()
        except Exception as e:
            QMessageBox.critical(self, "Erro ao importar PDF", str(e))

    def move_song(self, delta):
        row = self.song_list.currentRow()
        if row < 0: return
        target_row = row + delta
        if 0 <= target_row < self.song_list.count():
            item = self.song_list.takeItem(row)
            self.song_list.insertItem(target_row, item)
            self.song_list.setCurrentRow(target_row)
            self.on_songs_reordered()

    def rename_song(self):
        row = self.song_list.currentRow()
        if row < 0: return
        s_id = self.song_list.item(row).data(Qt.UserRole)
        song = next((s for s in self.songs if s["id"] == s_id), None)
        if not song: return
        new_title, ok = QInputDialog.getText(self, "Renomear Música", "Nome exibido da música:", text=song["title"])
        if ok and new_title.strip():
            song["title"] = new_title.strip()
            self.save_data()
            self.refresh_songs()

    def create_category(self):
        name, ok = QInputDialog.getText(self, "Nova Categoria", "Nome da Categoria / Pasta:")
        if ok and name.strip():
            cat_id = f"cat-{len(self.categories)+1}"
            self.categories.append({"id": cat_id, "name": name.strip(), "order": len(self.categories)})
            self.save_data()
            self.refresh_categories()

    def delete_category(self):
        if not self.current_cat_id: return
        reply = QMessageBox.question(self, "Excluir Categoria", "Deseja excluir esta categoria e desvincular suas músicas?", QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            self.categories = [c for c in self.categories if c["id"] != self.current_cat_id]
            self.songs = [s for s in self.songs if s["categoryId"] != self.current_cat_id]
            self.save_data()
            self.refresh_categories()

    def filter_songs(self, text):
        for i in range(self.song_list.count()):
            item = self.song_list.item(i)
            item.setHidden(text.lower() not in item.text().lower())

    def open_presentation(self):
        row = self.song_list.currentRow()
        if row < 0: return
        s_id = self.song_list.item(row).data(Qt.UserRole)
        self.current_song = next((s for s in self.songs if s["id"] == s_id), None)
        if not self.current_song or not self.current_song.get("filePath"):
            QMessageBox.information(self, "Aviso", "Selecione uma música com caminho de arquivo PDF válido.")
            return

        try:
            self.current_doc = fitz.open(self.current_song["filePath"])
            self.current_page = 0
            self.lbl_present_title.setText(f"🎵 {self.current_song['title']}")
            self.stacked.setCurrentWidget(self.present_view)
            self.render_current_page()
        except Exception as e:
            QMessageBox.critical(self, "Erro ao abrir PDF", str(e))

    def render_current_page(self):
        if not self.current_doc: return
        page = self.current_doc.load_page(self.current_page)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img = QImage(pix.samples, pix.width, pix.height, pix.stride, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(img)
        self.lbl_pdf_page.setPixmap(pixmap)
        self.lbl_page_indicator.setText(f"Página {self.current_page + 1} de {len(self.current_doc)}")

    def next_page(self):
        if self.current_doc and self.current_page < len(self.current_doc) - 1:
            self.current_page += 1
            self.render_current_page()

    def prev_page(self):
        if self.current_doc and self.current_page > 0:
            self.current_page -= 1
            self.render_current_page()

    def first_page(self):
        if self.current_doc:
            self.current_page = 0
            self.render_current_page()

    def last_page(self):
        if self.current_doc:
            self.current_page = len(self.current_doc) - 1
            self.render_current_page()

    def next_song(self):
        cat_songs = [s for s in self.songs if s["categoryId"] == self.current_cat_id]
        cat_songs.sort(key=lambda s: s.get("order", 0))
        curr_idx = next((i for i, s in enumerate(cat_songs) if s["id"] == self.current_song["id"]), -1)
        if curr_idx != -1 and curr_idx < len(cat_songs) - 1:
            self.song_list.setCurrentRow(curr_idx + 1)
            self.open_presentation()

    def prev_song(self):
        cat_songs = [s for s in self.songs if s["categoryId"] == self.current_cat_id]
        cat_songs.sort(key=lambda s: s.get("order", 0))
        curr_idx = next((i for i, s in enumerate(cat_songs) if s["id"] == self.current_song["id"]), -1)
        if curr_idx > 0:
            self.song_list.setCurrentRow(curr_idx - 1)
            self.open_presentation()

    def toggle_auto_scroll(self):
        self.is_auto_scrolling = not self.is_auto_scrolling
        if self.is_auto_scrolling:
            interval = max(10, int(150 - (self.auto_scroll_speed * 1.3)))
            self.auto_scroll_timer.start(interval)
            self.btn_toggle_scroll.setText("⏸ Pausar")
        else:
            self.auto_scroll_timer.stop()
            self.btn_toggle_scroll.setText("▶ Iniciar Rolagem")

    def auto_scroll_step(self):
        vbar = self.pdf_scroll.verticalScrollBar()
        if vbar.value() < vbar.maximum():
            vbar.setValue(vbar.value() + 2)
        else:
            self.next_page()

    def change_scroll_speed(self, val):
        self.auto_scroll_speed = val
        if self.is_auto_scrolling:
            interval = max(10, int(150 - (val * 1.3)))
            self.auto_scroll_timer.setInterval(interval)

    def close_presentation(self):
        self.auto_scroll_timer.stop()
        self.is_auto_scrolling = False
        self.stacked.setCurrentWidget(self.library_view)
        if self.isFullScreen(): self.showNormal()

    def toggle_fullscreen(self):
        if self.isFullScreen(): self.showNormal()
        else: self.showFullScreen()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MinhasLetrasApp()
    window.show()
    sys.exit(app.exec_())
`;

  const workflowYml = `name: Build Minhas Letras V4 Standalone Windows EXE

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python 3.8 (High Windows 7 Compatibility)
        uses: actions/setup-python@v5
        with:
          python-version: '3.8'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install PyQt5 PyMuPDF pyinstaller

      - name: Build Standalone Executable with PyInstaller
        run: |
          pyinstaller --noconfirm --onedir --windowed --name "MinhasLetrasV4" --add-data "minhas_letras_dados.json;." minhas_letras.py

      - name: Upload Windows 7 Standalone Artifact
        uses: actions/upload-artifact@v4
        with:
          name: MinhasLetrasV4-Windows7-Standalone
          path: dist/MinhasLetrasV4/
`;

  const readmeMd = `# Minhas Letras V4 - Edição Standalone para Windows 7 / 8 / 10 / 11

Biblioteca digital profissional de PDFs de músicas com apresentação de slides independente.

## Características:
- **1 PDF = 1 Música Independente** (Nunca agrupa PDFs em um só arquivo).
- **Apresentador de Slides**: Navegação página por página, tela cheia, rolagem automática e atalhos de palco.
- **Ordem Personalizada Permanente**: Arraste e solte ou mova com botões para fixar a ordem da sua apresentação.
- **Compatibilidade**: Testado e compatível com Windows 7, 8, 10 e 11 através do Python 3.8 + PyInstaller.

## Como Gerar o Executável (.exe):

### Opção 1: GitHub Actions (Automático e Gratuito)
1. Crie um repositório no GitHub com estes arquivos.
2. O workflow \`.github/workflows/build.yml\` compilará automaticamente o \`.exe\` standalone.
3. Baixe o executável pronto na aba **Actions -> Artifacts**.

### Opção 2: Compilação Manual no Windows
\`\`\`bash
pip install -r requirements.txt
pyinstaller --noconfirm --onedir --windowed --name "MinhasLetrasV4" minhas_letras.py
\`\`\`
O executável estará pronto na pasta \`dist/MinhasLetrasV4/MinhasLetrasV4.exe\`.
`;

  const requirementsTxt = `PyQt5==5.15.9\nPyMuPDF==1.22.5\npyinstaller==5.13.2\n`;

  zip.file('minhas_letras.py', pythonScript);
  zip.file('.github/workflows/build.yml', workflowYml);
  zip.file('README.md', readmeMd);
  zip.file('requirements.txt', requirementsTxt);
  zip.file('minhas_letras_dados.json', JSON.stringify({ categories: DEFAULT_CATEGORIES, songs: [] }, null, 2));

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
