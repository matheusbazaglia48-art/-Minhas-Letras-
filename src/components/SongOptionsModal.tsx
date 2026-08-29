import React, { useState } from 'react';
import { Song, Category } from '../types';
import { Edit3, FolderInput, Star, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, Trash2, Download, X, Music } from 'lucide-react';

interface SongOptionsModalProps {
  song: Song;
  categories: Category[];
  totalInCat: number;
  onClose: () => void;
  onRename: (songId: string, newTitle: string) => void;
  onMoveCategory: (songId: string, targetCatId: string) => void;
  onMovePosition: (songId: string, action: 'up' | 'down' | 'top' | 'bottom') => void;
  onToggleFavorite: (songId: string) => void;
  onDelete: (songId: string) => void;
  onDownloadPdf: (song: Song) => void;
}

export const SongOptionsModal: React.FC<SongOptionsModalProps> = ({
  song,
  categories,
  totalInCat,
  onClose,
  onRename,
  onMoveCategory,
  onMovePosition,
  onToggleFavorite,
  onDelete,
  onDownloadPdf,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(song.title);
  const [isMovingCat, setIsMovingCat] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(song.categoryId);

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onRename(song.id, newTitle.trim());
      setIsRenaming(false);
    }
  };

  const handleSaveMoveCat = () => {
    if (selectedCatId !== song.categoryId) {
      onMoveCategory(song.id, selectedCatId);
    }
    setIsMovingCat(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#121316] border border-[#22242A] rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-[#E2E4E9]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#22242A] bg-[#0E0F12]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-[#181A20] text-blue-400 border border-[#2D3038] shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#E2E4E9] truncate">{song.title}</h3>
              <p className="text-[11px] font-mono text-[#868C98] truncate">Arquivo: {song.originalFileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#868C98] hover:text-white rounded hover:bg-[#1A1D24] transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Rename view */}
          {isRenaming ? (
            <form onSubmit={handleSaveRename} className="space-y-3">
              <label className="block text-[10px] font-mono font-bold text-[#868C98] uppercase tracking-wider">
                Editar Nome de Exibição
              </label>
              <p className="text-xs text-[#868C98]">
                O arquivo original ({song.originalFileName}) permanecerá intacto.
              </p>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-blue-500 rounded-lg text-white focus:outline-hidden text-sm font-medium"
                placeholder="Ex: Como Zaqueu"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#868C98] hover:text-white bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg transition-colors"
                >
                  Salvar Nome
                </button>
              </div>
            </form>
          ) : isMovingCat ? (
            <div className="space-y-3">
              <label className="block text-[10px] font-mono font-bold text-[#868C98] uppercase tracking-wider">
                Mover para outra Categoria
              </label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#2D3038] rounded-lg text-white focus:outline-hidden focus:border-blue-500 text-sm font-mono"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    📁 {c.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovingCat(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#868C98] hover:text-white bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMoveCat}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg transition-colors"
                >
                  Mover
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Actions List */}
              <button
                onClick={() => setIsRenaming(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] hover:border-[#2D3038] text-[#E2E4E9] text-xs font-semibold transition-colors text-left"
              >
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Renomear título de exibição</span>
              </button>

              <button
                onClick={() => {
                  onToggleFavorite(song.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] hover:border-[#2D3038] text-[#E2E4E9] text-xs font-semibold transition-colors text-left"
              >
                <Star className={`w-4 h-4 ${song.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-[#868C98]'}`} />
                <span>{song.isFavorite ? 'Remover dos Favoritos' : 'Marcar como Favorito (⭐)'}</span>
              </button>

              <button
                onClick={() => setIsMovingCat(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] hover:border-[#2D3038] text-[#E2E4E9] text-xs font-semibold transition-colors text-left"
              >
                <FolderInput className="w-4 h-4 text-amber-400" />
                <span>Mover para outra pasta / categoria...</span>
              </button>

              {/* Position controls */}
              <div className="pt-2 pb-1">
                <span className="text-[10px] font-mono font-bold text-[#868C98] uppercase tracking-wider block mb-2 px-1">
                  POSIÇÃO NESTA PASTA (POSIÇÃO: {song.order + 1} DE {totalInCat})
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    disabled={song.order === 0}
                    onClick={() => onMovePosition(song.id, 'top')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] text-[#E2E4E9] text-xs disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5 text-blue-400" />
                    <span>Início da Pasta</span>
                  </button>

                  <button
                    disabled={song.order === 0}
                    onClick={() => onMovePosition(song.id, 'up')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] text-[#E2E4E9] text-xs disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>Subir 1 Posição</span>
                  </button>

                  <button
                    disabled={song.order >= totalInCat - 1}
                    onClick={() => onMovePosition(song.id, 'down')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] text-[#E2E4E9] text-xs disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                    <span>Descer 1 Posição</span>
                  </button>

                  <button
                    disabled={song.order >= totalInCat - 1}
                    onClick={() => onMovePosition(song.id, 'bottom')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] text-[#E2E4E9] text-xs disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" />
                    <span>Final da Pasta</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#22242A] flex items-center justify-between gap-2">
                <button
                  onClick={() => onDownloadPdf(song)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#868C98] hover:text-white bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Deseja realmente excluir "${song.title}" da biblioteca?`)) {
                      onDelete(song.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
