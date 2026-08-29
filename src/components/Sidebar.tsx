import React, { useState } from 'react';
import { Category, Song, ActiveView } from '../types';
import {
  Folder,
  Star,
  Clock,
  Plus,
  Settings,
  Download,
  Terminal,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Music,
  FolderPlus,
  Sparkles,
  Guitar,
  Flame,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  categories: Category[];
  songs: Song[];
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onCreateCategory: (name: string) => void;
  onRenameCategory: (catId: string, newName: string) => void;
  onDeleteCategory: (catId: string) => void;
  onReorderCategories: (reordered: Category[]) => void;
  onOpenSettings: () => void;
  onOpenWindowsExporter: () => void;
  onExportBackupZip: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  songs,
  activeView,
  onSelectView,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategories,
  onOpenSettings,
  onOpenWindowsExporter,
  onExportBackupZip,
}) => {
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);

  // Counters
  const favoriteCount = songs.filter((s) => s.isFavorite).length;
  const recentCount = songs.filter((s) => s.lastOpenedAt).length;

  const handleCreateCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      onCreateCategory(newCatName.trim());
      setNewCatName('');
      setIsCreatingCat(false);
    }
  };

  const handleSaveRenameCat = (catId: string) => {
    if (editingCatName.trim()) {
      onRenameCategory(catId, editingCatName.trim());
      setEditingCatId(null);
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorderCategories(reordered);
  };

  // Drag & drop for categories
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCatIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCatIndex === null || draggedCatIndex === targetIndex) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(draggedCatIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorderCategories(reordered);
    setDraggedCatIndex(null);
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat.icon) {
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
      case 'Guitar':
        return <Guitar className="w-3.5 h-3.5 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Folder className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <aside className="w-72 bg-[#121316] border-r border-[#22242A] flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#22242A] flex items-center justify-between bg-[#0E0F12]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#181A20] border border-[#2D3038] flex items-center justify-center text-blue-400 shadow-inner">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-[#E2E4E9] uppercase font-mono">
                MINHAS LETRAS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                V4
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-mono text-[#868C98]">PDF Engine Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation links */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => onSelectView({ type: 'library', categoryId: categories[0]?.id })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
            activeView.type === 'library' && !activeView.categoryId
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'text-[#868C98] hover:text-[#E2E4E9] bg-[#15171C]/50 hover:bg-[#1A1D24] border-[#202227]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Folder className={`w-3.5 h-3.5 ${activeView.type === 'library' && !activeView.categoryId ? 'text-white' : 'text-blue-400'}`} />
            <span>Todas as Músicas</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0A0B0D] text-[#868C98] border border-[#22242A]">
            {songs.length}
          </span>
        </button>

        <button
          onClick={() => onSelectView({ type: 'favorites' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
            activeView.type === 'favorites'
              ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-sm'
              : 'text-[#868C98] hover:text-[#E2E4E9] bg-[#15171C]/50 hover:bg-[#1A1D24] border-[#202227]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star
              className={`w-3.5 h-3.5 ${
                activeView.type === 'favorites' ? 'fill-black text-black' : 'text-amber-400'
              }`}
            />
            <span>Favoritos</span>
          </div>
          {favoriteCount > 0 && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                activeView.type === 'favorites'
                  ? 'bg-black text-amber-300'
                  : 'bg-[#0A0B0D] text-amber-400 border border-[#22242A]'
              }`}
            >
              {favoriteCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectView({ type: 'recent' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
            activeView.type === 'recent'
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'text-[#868C98] hover:text-[#E2E4E9] bg-[#15171C]/50 hover:bg-[#1A1D24] border-[#202227]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className={`w-3.5 h-3.5 ${activeView.type === 'recent' ? 'text-white' : 'text-cyan-400'}`} />
            <span>Recentes</span>
          </div>
          {recentCount > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0A0B0D] text-[#868C98] border border-[#22242A]">
              {recentCount}
            </span>
          )}
        </button>
      </div>

      {/* Categories Section Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between border-t border-[#22242A]">
        <span className="text-[10px] font-mono font-bold text-[#868C98] uppercase tracking-wider">
          PASTAS / CATEGORIAS
        </span>
        <button
          onClick={() => setIsCreatingCat(true)}
          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-[#1A1D24] rounded border border-transparent hover:border-[#2D3038] transition-colors"
          title="Criar nova pasta / categoria"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New Category Input Inline */}
      {isCreatingCat && (
        <form onSubmit={handleCreateCat} className="px-3 py-2 bg-[#0E0F12] border-y border-[#22242A]">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nome da categoria..."
            autoFocus
            className="w-full px-2.5 py-1.5 bg-[#0A0B0D] border border-blue-500 rounded text-xs text-[#E2E4E9] focus:outline-hidden font-medium"
          />
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => setIsCreatingCat(false)}
              className="px-2 py-1 text-[11px] text-[#868C98] hover:text-[#E2E4E9]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 rounded hover:bg-blue-500 transition-colors"
            >
              Criar
            </button>
          </div>
        </form>
      )}

      {/* Categories List (Draggable and Reorderable) */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {categories.map((cat, idx) => {
          const catSongsCount = songs.filter((s) => s.categoryId === cat.id).length;
          const isSelected = activeView.type === 'library' && activeView.categoryId === cat.id;

          return (
            <div
              key={cat.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-[#182235] text-white border-blue-500/80 shadow-xs'
                  : 'bg-[#15171C] hover:bg-[#1A1D24] text-[#868C98] hover:text-[#E2E4E9] border-[#202227] hover:border-[#2D3038]'
              }`}
              onClick={() => onSelectView({ type: 'library', categoryId: cat.id })}
            >
              {editingCatId === cat.id ? (
                <div
                  className="flex-1 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    autoFocus
                    onBlur={() => handleSaveRenameCat(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRenameCat(cat.id);
                      if (e.key === 'Escape') setEditingCatId(null);
                    }}
                    className="w-full px-2 py-1 bg-[#0A0B0D] border border-blue-500 rounded text-xs text-[#E2E4E9]"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0">{getCategoryIcon(cat)}</span>
                  <span className="truncate">{cat.name}</span>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-blue-900/60 text-blue-200 border border-blue-500/40' : 'bg-[#0A0B0D] text-[#868C98] border border-[#22242A]'
                  }`}
                >
                  {catSongsCount}
                </span>

                {/* Category Reorder / Options Menu */}
                <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <button
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCategory(idx, 'up');
                    }}
                    className="p-1 text-[#868C98] hover:text-[#E2E4E9] disabled:opacity-20"
                    title="Mover pasta para cima"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === categories.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCategory(idx, 'down');
                    }}
                    className="p-1 text-[#868C98] hover:text-[#E2E4E9] disabled:opacity-20"
                    title="Mover pasta para baixo"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCatId(cat.id);
                      setEditingCatName(cat.name);
                    }}
                    className="p-1 text-[#868C98] hover:text-[#E2E4E9]"
                    title="Renomear pasta"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Deseja excluir a categoria "${cat.name}" e desvincular suas músicas?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1 text-[#868C98] hover:text-rose-400"
                    title="Excluir pasta"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Actions: Configs, Windows Exporter, Backup */}
      <div className="p-3 border-t border-[#22242A] bg-[#0E0F12] space-y-1.5">
        <button
          onClick={onOpenWindowsExporter}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-blue-300 hover:text-white bg-[#161922] hover:bg-[#1D2230] border border-blue-500/30 hover:border-blue-500/60 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>Gerar .EXE Windows 7</span>
          </div>
          <span className="text-[10px] font-mono bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 border border-blue-500/30">
            PyInstaller
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSettings}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#868C98] hover:text-[#E2E4E9] bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] hover:border-[#2D3038] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>

          <button
            onClick={onExportBackupZip}
            className="flex items-center justify-center p-2 rounded-lg text-xs font-medium text-[#868C98] hover:text-[#E2E4E9] bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] hover:border-[#2D3038] transition-colors"
            title="Exportar Backup da Biblioteca (ZIP)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
