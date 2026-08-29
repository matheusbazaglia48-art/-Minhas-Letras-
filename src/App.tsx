import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Song, Category, AppSettings, ActiveView } from './types';
import {
  saveMetadata,
  loadSettings,
  saveSettings,
  initializeDefaultLibrary,
  importPdfSong,
  exportCompleteBackupZip,
  deletePdfBlob,
  getPdfBlob,
} from './services/storage';
import { Sidebar } from './components/Sidebar';
import { CategoryHeader } from './components/CategoryHeader';
import { SongCard } from './components/SongCard';
import { SongOptionsModal } from './components/SongOptionsModal';
import { BatchImportModal } from './components/BatchImportModal';
import { PdfPresenter } from './components/PdfPresenter';
import { SettingsModal } from './components/SettingsModal';
import { WindowsExporterModal } from './components/WindowsExporterModal';
import {
  Music,
  Plus,
  UploadCloud,
} from 'lucide-react';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'library' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Presentation State
  const [presentingSong, setPresentingSong] = useState<Song | null>(null);

  // Modals
  const [selectedSongForOptions, setSelectedSongForOptions] = useState<Song | null>(null);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWindowsExporter, setShowWindowsExporter] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // Drag & Drop state for songs
  const [draggedSongIndex, setDraggedSongIndex] = useState<number | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Load initial library
  useEffect(() => {
    async function init() {
      setIsLoadingLibrary(true);
      const data = await initializeDefaultLibrary();
      setCategories(data.categories);
      setSongs(data.songs);
      // Select first category by default
      if (data.categories.length > 0) {
        setActiveView({ type: 'library', categoryId: data.categories[0].id });
      }
      setIsLoadingLibrary(false);
    }
    init();
  }, []);

  // Save metadata whenever categories or songs change
  const updateLibraryState = (newCategories: Category[], newSongs: Song[]) => {
    setCategories(newCategories);
    setSongs(newSongs);
    saveMetadata(newCategories, newSongs);
  };

  // Update Settings
  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveSettings(updated);
  };

  // Active Category resolution
  const activeCategoryId = activeView.type === 'library' ? activeView.categoryId : undefined;
  const currentCategory = categories.find((c) => c.id === activeCategoryId);

  // Filtered and Sorted Songs for the active view
  const currentDisplayedSongs = useMemo(() => {
    let filtered: Song[] = [];

    if (activeView.type === 'favorites') {
      filtered = songs.filter((s) => s.isFavorite);
    } else if (activeView.type === 'recent') {
      filtered = songs
        .filter((s) => s.lastOpenedAt)
        .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
    } else if (activeCategoryId) {
      filtered = songs
        .filter((s) => s.categoryId === activeCategoryId)
        .sort((a, b) => a.order - b.order);
    } else {
      filtered = [...songs].sort((a, b) => a.order - b.order);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.originalFileName.toLowerCase().includes(q) ||
          (s.keySignature && s.keySignature.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [songs, activeView, activeCategoryId, searchQuery]);

  // Total pages count in active view
  const totalPagesInActiveView = useMemo(() => {
    return currentDisplayedSongs.reduce((sum, s) => sum + (s.pageCount || 1), 0);
  }, [currentDisplayedSongs]);

  // Open Song in Presentation
  const handleOpenPresentation = (song: Song) => {
    // Record recent opened timestamp
    const updatedSongs = songs.map((s) =>
      s.id === song.id ? { ...s, lastOpenedAt: Date.now() } : s
    );
    updateLibraryState(categories, updatedSongs);
    setPresentingSong(song);
  };

  // Start presenting entire category from song 1
  const handleStartCategoryPresentation = () => {
    if (currentDisplayedSongs.length > 0) {
      handleOpenPresentation(currentDisplayedSongs[0]);
    }
  };

  // Category Actions
  const handleCreateCategory = (name: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      order: categories.length,
      createdAt: Date.now(),
    };
    const updated = [...categories, newCat];
    updateLibraryState(updated, songs);
    setActiveView({ type: 'library', categoryId: newCat.id });
  };

  const handleRenameCategory = (catId: string, newName: string) => {
    const updated = categories.map((c) => (c.id === catId ? { ...c, name: newName } : c));
    updateLibraryState(updated, songs);
  };

  const handleDeleteCategory = async (catId: string) => {
    const songsToDelete = songs.filter((s) => s.categoryId === catId);
    for (const s of songsToDelete) {
      await deletePdfBlob(s.pdfStorageKey);
    }
    const updatedCats = categories.filter((c) => c.id !== catId);
    const updatedSongs = songs.filter((s) => s.categoryId !== catId);
    updateLibraryState(updatedCats, updatedSongs);
    if (activeCategoryId === catId) {
      setActiveView({ type: 'library', categoryId: updatedCats[0]?.id });
    }
  };

  const handleReorderCategories = (reordered: Category[]) => {
    const updated = reordered.map((cat, idx) => ({ ...cat, order: idx }));
    updateLibraryState(updated, songs);
  };

  // Song Actions
  const handleToggleFavorite = (songId: string) => {
    const updated = songs.map((s) => (s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s));
    updateLibraryState(categories, updated);
  };

  const handleRenameSong = (songId: string, newTitle: string) => {
    const updated = songs.map((s) => (s.id === songId ? { ...s, title: newTitle } : s));
    updateLibraryState(categories, updated);
  };

  const handleMoveCategory = (songId: string, targetCatId: string) => {
    const targetCatSongs = songs.filter((s) => s.categoryId === targetCatId);
    const maxOrder = targetCatSongs.reduce((max, s) => Math.max(max, s.order), -1);

    const updated = songs.map((s) =>
      s.id === songId ? { ...s, categoryId: targetCatId, order: maxOrder + 1 } : s
    );
    updateLibraryState(categories, updated);
  };

  const handleMoveSongPosition = (
    songId: string,
    action: 'up' | 'down' | 'top' | 'bottom'
  ) => {
    const targetSong = songs.find((s) => s.id === songId);
    if (!targetSong) return;

    const catSongs = songs
      .filter((s) => s.categoryId === targetSong.categoryId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = catSongs.findIndex((s) => s.id === songId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;
    if (action === 'up') targetIndex = Math.max(0, currentIndex - 1);
    else if (action === 'down') targetIndex = Math.min(catSongs.length - 1, currentIndex + 1);
    else if (action === 'top') targetIndex = 0;
    else if (action === 'bottom') targetIndex = catSongs.length - 1;

    if (targetIndex === currentIndex) return;

    const reorderedCatSongs = [...catSongs];
    const [moved] = reorderedCatSongs.splice(currentIndex, 1);
    reorderedCatSongs.splice(targetIndex, 0, moved);

    // Re-assign order numbers
    const updatedCatSongs = reorderedCatSongs.map((s, idx) => ({ ...s, order: idx }));

    // Merge back into main list
    const otherSongs = songs.filter((s) => s.categoryId !== targetSong.categoryId);
    updateLibraryState(categories, [...otherSongs, ...updatedCatSongs]);
  };

  const handleDeleteSong = async (songId: string) => {
    const targetSong = songs.find((s) => s.id === songId);
    if (targetSong) {
      await deletePdfBlob(targetSong.pdfStorageKey);
    }
    const updatedSongs = songs.filter((s) => s.id !== songId);
    updateLibraryState(categories, updatedSongs);
  };

  const handleDownloadPdf = async (song: Song) => {
    const buffer = await getPdfBlob(song.pdfStorageKey);
    if (buffer) {
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = song.originalFileName || `${song.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Drag and Drop Song Reordering
  const handleDragStartSong = (e: React.DragEvent, index: number) => {
    setDraggedSongIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOverSong = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDropSong = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSongIndex === null || draggedSongIndex === targetIndex) return;

    const catSongs = [...currentDisplayedSongs];
    const [moved] = catSongs.splice(draggedSongIndex, 1);
    catSongs.splice(targetIndex, 0, moved);

    // Apply new sequential order
    const updatedCatSongs = catSongs.map((s, idx) => ({ ...s, order: idx }));

    if (activeCategoryId) {
      const otherSongs = songs.filter((s) => s.categoryId !== activeCategoryId);
      updateLibraryState(categories, [...otherSongs, ...updatedCatSongs]);
    }

    setDraggedSongIndex(null);
  };

  // Import Handler (Single & Batch)
  const handleImportFiles = async (files: File[], targetCatId: string) => {
    const currentCatSongs = songs.filter((s) => s.categoryId === targetCatId);
    const newSongs: Song[] = [];

    for (const file of files) {
      const newSong = await importPdfSong(file, targetCatId, [...currentCatSongs, ...newSongs]);
      newSongs.push(newSong);
    }

    updateLibraryState(categories, [...songs, ...newSongs]);
  };

  // Single file input change trigger
  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeCategoryId) {
      await handleImportFiles([e.target.files[0]], activeCategoryId);
      e.target.value = '';
    }
  };

  // Backup Export/Import Handlers
  const handleExportBackupZip = async () => {
    try {
      const zipBlob = await exportCompleteBackupZip(categories, songs, settings);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MinhasLetrasV4_Biblioteca_Backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup ZIP:', err);
    }
  };

  const handleExportJsonMetadata = () => {
    const metadata = {
      version: '4.0.0',
      categories,
      songs: songs.map(({ pdfStorageKey, ...rest }) => rest),
      settings,
    };
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minhas_letras_v4_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonMetadata = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.categories) {
          updateLibraryState(parsed.categories, parsed.songs || songs);
        }
        if (parsed.settings) {
          handleUpdateSettings(parsed.settings);
        }
        setShowSettings(false);
      } catch (err) {
        alert('Arquivo de metadados JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0A0B0D] text-[#E2E4E9] font-sans overflow-hidden">
      {/* Hidden single file input */}
      <input
        ref={singleFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleSingleFileChange}
        className="hidden"
      />

      {/* LEFT SIDEBAR */}
      <Sidebar
        categories={categories}
        songs={songs}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setSearchQuery('');
        }}
        onCreateCategory={handleCreateCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategories={handleReorderCategories}
        onOpenSettings={() => setShowSettings(true)}
        onOpenWindowsExporter={() => setShowWindowsExporter(true)}
        onExportBackupZip={handleExportBackupZip}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0B0D] overflow-hidden">
        {/* Category / Filter Header */}
        <CategoryHeader
          activeView={activeView}
          currentCategory={currentCategory}
          songsCount={currentDisplayedSongs.length}
          totalPagesCount={totalPagesInActiveView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          onOpenAddSingle={() => singleFileInputRef.current?.click()}
          onOpenAddBatch={() => setShowBatchImport(true)}
          onStartCategoryPresentation={handleStartCategoryPresentation}
        />

        {/* Songs List / Grid View */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoadingLibrary ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-[#868C98]">
                CARREGANDO BIBLIOTECA DIGITAL...
              </span>
            </div>
          ) : currentDisplayedSongs.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center p-8 rounded-xl border border-[#22242A] bg-[#121316] max-w-lg mx-auto my-8">
              <div className="w-14 h-14 rounded-xl bg-[#181A20] text-blue-400 border border-[#2D3038] flex items-center justify-center mb-4 shadow-inner">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold font-mono text-[#E2E4E9] uppercase tracking-wider">
                {searchQuery ? 'Nenhuma música encontrada' : 'Esta pasta está vazia'}
              </h3>
              <p className="text-xs text-[#868C98] mt-1 max-w-xs mb-6">
                {searchQuery
                  ? `Não encontramos resultados para "${searchQuery}".`
                  : 'Adicione partituras ou cifras em PDF para organizar sua biblioteca.'}
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => singleFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#2D3038] text-xs font-semibold text-[#E2E4E9] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Adicionar 1 Música</span>
                </button>
                <button
                  onClick={() => setShowBatchImport(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white border border-blue-500 shadow-md shadow-blue-950/40 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Adicionar Vários PDFs</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
              {currentDisplayedSongs.map((song, idx) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={idx}
                  totalInList={currentDisplayedSongs.length}
                  category={categories.find((c) => c.id === song.categoryId)}
                  viewMode="grid"
                  onOpenPresentation={handleOpenPresentation}
                  onOpenOptions={setSelectedSongForOptions}
                  onToggleFavorite={handleToggleFavorite}
                  onMovePosition={(id, dir) => handleMoveSongPosition(id, dir)}
                  onDragStart={handleDragStartSong}
                  onDragOver={handleDragOverSong}
                  onDrop={handleDropSong}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-1.5 max-w-4xl">
              {currentDisplayedSongs.map((song, idx) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={idx}
                  totalInList={currentDisplayedSongs.length}
                  category={categories.find((c) => c.id === song.categoryId)}
                  viewMode="list"
                  onOpenPresentation={handleOpenPresentation}
                  onOpenOptions={setSelectedSongForOptions}
                  onToggleFavorite={handleToggleFavorite}
                  onMovePosition={(id, dir) => handleMoveSongPosition(id, dir)}
                  onDragStart={handleDragStartSong}
                  onDragOver={handleDragOverSong}
                  onDrop={handleDropSong}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FULLSCREEN SLIDE PRESENTER ENGINE */}
      {presentingSong && (
        <PdfPresenter
          song={presentingSong}
          categorySongs={currentDisplayedSongs}
          category={categories.find((c) => c.id === presentingSong.categoryId)}
          settings={settings}
          onClose={() => setPresentingSong(null)}
          onSelectSong={handleOpenPresentation}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* MODALS */}
      {selectedSongForOptions && (
        <SongOptionsModal
          song={selectedSongForOptions}
          categories={categories}
          totalInCat={currentDisplayedSongs.length}
          onClose={() => setSelectedSongForOptions(null)}
          onRename={handleRenameSong}
          onMoveCategory={handleMoveCategory}
          onMovePosition={(id, action) => handleMoveSongPosition(id, action)}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteSong}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {showBatchImport && (
        <BatchImportModal
          categories={categories}
          activeCategoryId={activeCategoryId}
          onClose={() => setShowBatchImport(false)}
          onImportFiles={handleImportFiles}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
          onExportJsonMetadata={handleExportJsonMetadata}
          onImportJsonMetadata={handleImportJsonMetadata}
          onResetToDefaults={() => {
            handleUpdateSettings({
              autoScrollSpeed: 30,
              autoHideControls: true,
              invertColorsForNightStage: false,
            });
          }}
        />
      )}

      {showWindowsExporter && (
        <WindowsExporterModal onClose={() => setShowWindowsExporter(false)} />
      )}
    </div>
  );
}
