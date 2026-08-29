import React from 'react';
import { Category, ActiveView } from '../types';
import {
  Search,
  Plus,
  Files,
  Play,
  Grid,
  List,
} from 'lucide-react';

interface CategoryHeaderProps {
  activeView: ActiveView;
  currentCategory?: Category;
  songsCount: number;
  totalPagesCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  onOpenAddSingle: () => void;
  onOpenAddBatch: () => void;
  onStartCategoryPresentation: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  activeView,
  currentCategory,
  songsCount,
  totalPagesCount,
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleViewMode,
  onOpenAddSingle,
  onOpenAddBatch,
  onStartCategoryPresentation,
}) => {
  const getHeaderTitle = () => {
    if (activeView.type === 'favorites') return 'Músicas Favoritas';
    if (activeView.type === 'recent') return 'Músicas Recentes';
    if (currentCategory) return currentCategory.name;
    return 'Todas as Músicas da Biblioteca';
  };

  const getHeaderSubtitle = () => {
    if (activeView.type === 'favorites')
      return 'Músicas marcadas com estrela para acesso rápido no palco';
    if (activeView.type === 'recent')
      return 'Histórico das últimas músicas visualizadas no palco';
    if (currentCategory)
      return `Pasta com ${songsCount} música(s) independente(s) e ${totalPagesCount} páginas no total`;
    return 'Biblioteca completa organizada por categorias e PDFs independentes';
  };

  return (
    <div className="p-5 border-b border-[#22242A] bg-[#0E0F12] space-y-4">
      {/* Top Row: Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-[#E2E4E9] tracking-tight font-sans">
              {getHeaderTitle()}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#15171C] text-blue-400 border border-[#2D3038]">
              {songsCount} {songsCount === 1 ? 'MÚSICA' : 'MÚSICAS'}
            </span>
            {totalPagesCount > 0 && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono text-[#868C98] bg-[#121316] border border-[#22242A]">
                {totalPagesCount} PÁGS
              </span>
            )}
          </div>
          <p className="text-xs text-[#868C98] mt-1">{getHeaderSubtitle()}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {songsCount > 0 && (
            <button
              onClick={onStartCategoryPresentation}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 border border-emerald-500 transition-all active:scale-95"
              title="Iniciar apresentação a partir da primeira música"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Apresentar Pasta</span>
            </button>
          )}

          <button
            onClick={onOpenAddSingle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] text-[#E2E4E9] border border-[#2D3038] text-xs font-semibold transition-colors"
            title="Adicionar uma música em PDF"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Adicionar Música</span>
          </button>

          <button
            onClick={onOpenAddBatch}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold border border-blue-500 shadow-md shadow-blue-950/40 transition-colors"
            title="Adicionar vários PDFs independentes de uma só vez"
          >
            <Files className="w-3.5 h-3.5" />
            <span>Adicionar Vários PDFs</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Search & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#868C98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar por título, arquivo ou tom (ex: G, Em)..."
            className="w-full pl-9 pr-14 py-2 bg-[#121316] border border-[#22242A] rounded-lg text-xs text-[#E2E4E9] placeholder-[#525866] focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#868C98] hover:text-[#E2E4E9]"
            >
              LIMPAR
            </button>
          ) : (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#525866] border border-[#22242A] px-1.5 py-0.5 rounded">
              /
            </span>
          )}
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1 bg-[#121316] p-1 rounded-lg border border-[#22242A] self-end sm:self-auto">
          <button
            onClick={() => onToggleViewMode('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#868C98] hover:text-[#E2E4E9]'
            }`}
            title="Visualização em Grade com Miniaturas"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">Grade</span>
          </button>
          <button
            onClick={() => onToggleViewMode('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#868C98] hover:text-[#E2E4E9]'
            }`}
            title="Visualização em Lista Compacta"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">Lista</span>
          </button>
        </div>
      </div>
    </div>
  );
};
