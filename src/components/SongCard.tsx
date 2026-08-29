import React from 'react';
import { Song, Category } from '../types';
import {
  Play,
  Star,
  MoreVertical,
  GripVertical,
  FileText,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface SongCardProps {
  song: Song;
  index: number;
  totalInList: number;
  category?: Category;
  viewMode: 'grid' | 'list';
  onOpenPresentation: (song: Song) => void;
  onOpenOptions: (song: Song) => void;
  onToggleFavorite: (songId: string) => void;
  onMovePosition: (songId: string, action: 'up' | 'down') => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  index,
  totalInList,
  category,
  viewMode,
  onOpenPresentation,
  onOpenOptions,
  onToggleFavorite,
  onMovePosition,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const formattedIndex = String(index + 1).padStart(2, '0');

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className="group relative flex items-center justify-between p-2.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#22242A] hover:border-blue-500/60 transition-all cursor-pointer shadow-xs"
        onClick={() => onOpenPresentation(song)}
      >
        {/* Left: Drag handle + Index + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="text-[#525866] group-hover:text-[#868C98] cursor-grab active:cursor-grabbing p-1"
            onClick={(e) => e.stopPropagation()}
            title="Arraste para reorganizar a ordem"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0A0B0D] text-blue-400 border border-[#22242A] shrink-0">
            {formattedIndex}
          </span>

          {song.thumbnailUrl ? (
            <div className="w-8 h-10 rounded overflow-hidden bg-white shrink-0 border border-[#2D3038] relative shadow-xs">
              <img
                src={song.thumbnailUrl}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-10 rounded bg-[#101216] border border-[#22242A] flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#E2E4E9] group-hover:text-blue-300 transition-colors truncate">
                {song.title}
              </h4>
              {song.keySignature && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                  {song.keySignature}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-[#868C98] truncate">
              {song.originalFileName} • {song.pageCount} {song.pageCount === 1 ? 'pág' : 'págs'}
            </p>
          </div>
        </div>

        {/* Right: Quick buttons (Present, Favorite, Reorder, Options) */}
        <div className="flex items-center gap-1 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMovePosition(song.id, 'up')}
            disabled={index === 0}
            className="p-1.5 text-[#525866] hover:text-[#E2E4E9] rounded hover:bg-[#202227] disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Mover para cima"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMovePosition(song.id, 'down')}
            disabled={index === totalInList - 1}
            className="p-1.5 text-[#525866] hover:text-[#E2E4E9] rounded hover:bg-[#202227] disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Mover para baixo"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onToggleFavorite(song.id)}
            className="p-1.5 rounded text-[#525866] hover:text-amber-400 hover:bg-[#202227] transition-colors"
            title={song.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Star
              className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
            />
          </button>

          <button
            onClick={() => onOpenPresentation(song)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 text-xs font-bold font-mono transition-all shadow-xs"
            title="Abrir Apresentador de Slides"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">APRESENTAR</span>
          </button>

          <button
            onClick={() => onOpenOptions(song)}
            className="p-1.5 text-[#525866] hover:text-[#E2E4E9] rounded hover:bg-[#202227] transition-colors"
            title="Mais opções (Renomear, Mover, Excluir)"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Grid Mode Card (Hardware Instrument Card)
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="group relative flex flex-col rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#22242A] hover:border-blue-500/70 transition-all overflow-hidden cursor-pointer shadow-md hover:shadow-blue-950/20 hover:-translate-y-0.5"
      onClick={() => onOpenPresentation(song)}
    >
      {/* Top Banner / Numbering */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0E0F12] border-b border-[#22242A]">
        <div className="flex items-center gap-1.5">
          <div
            className="text-[#525866] group-hover:text-[#868C98] cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            title="Arraste para mudar a ordem"
          >
            <GripVertical className="w-3 h-3" />
          </div>
          <span className="font-mono text-[11px] font-bold text-blue-400 bg-[#0A0B0D] px-1.5 py-0.5 rounded border border-[#22242A]">
            {formattedIndex}
          </span>
        </div>

        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleFavorite(song.id)}
            className="p-1 rounded text-[#525866] hover:text-amber-400 transition-colors"
            title={song.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Star
              className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
            />
          </button>
          <button
            onClick={() => onOpenOptions(song)}
            className="p-1 text-[#525866] hover:text-[#E2E4E9] rounded transition-colors"
            title="Opções da música"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnail Area with Hover Overlay */}
      <div className="relative aspect-3/4 bg-[#0A0B0D] flex items-center justify-center overflow-hidden border-b border-[#22242A] group/thumb">
        {song.thumbnailUrl ? (
          <img
            src={song.thumbnailUrl}
            alt={song.title}
            className="w-full h-full object-cover object-top filter group-hover/thumb:brightness-90 transition-all"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-[#525866]">
            <FileText className="w-10 h-10 mb-2 text-blue-500/30" />
            <span className="text-[11px] font-mono text-[#868C98]">PRÉVIA PDF</span>
          </div>
        )}

        {/* Page count badge */}
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-[#0A0B0D]/90 backdrop-blur-xs text-[10px] font-mono font-bold text-[#E2E4E9] border border-[#2D3038] shadow-sm flex items-center gap-1">
          <FileText className="w-2.5 h-2.5 text-blue-400" />
          <span>{song.pageCount} {song.pageCount === 1 ? 'PÁG' : 'PÁGS'}</span>
        </div>

        {/* Tone badge if available */}
        {song.keySignature && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-[#0A0B0D]/90 backdrop-blur-xs text-[10px] font-mono font-bold text-amber-300 border border-amber-500/40 shadow-sm">
            {song.keySignature}
          </div>
        )}

        {/* Hover Presentation Action Overlay */}
        <div className="absolute inset-0 bg-[#0A0B0D]/75 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/60 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white tracking-wider uppercase">
            Apresentar Slide
          </span>
        </div>
      </div>

      {/* Info Card Footer */}
      <div className="p-3 space-y-0.5 bg-[#15171C]">
        <h4 className="text-xs font-bold text-[#E2E4E9] group-hover:text-blue-300 transition-colors truncate">
          {song.title}
        </h4>
        <p className="text-[11px] font-mono text-[#868C98] truncate">
          {song.originalFileName}
        </p>
      </div>
    </div>
  );
};
