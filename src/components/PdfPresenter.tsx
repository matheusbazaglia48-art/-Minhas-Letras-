import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song, Category, AppSettings } from '../types';
import { getPdfBlob } from '../services/storage';
import { loadPdfDocument, renderPdfPageToCanvas } from '../services/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  Maximize,
  Minimize,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ListMusic,
  Moon,
  Sun,
  Pin,
  PinOff,
  Sliders,
  SkipBack,
  SkipForward,
  Info,
  Layers,
} from 'lucide-react';

interface PdfPresenterProps {
  song: Song;
  categorySongs: Song[];
  category?: Category;
  settings: AppSettings;
  onClose: () => void;
  onSelectSong: (song: Song) => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const PdfPresenter: React.FC<PdfPresenterProps> = ({
  song,
  categorySongs,
  category,
  settings,
  onClose,
  onSelectSong,
  onUpdateSettings,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(song.pageCount || 1);
  const [zoomScale, setZoomScale] = useState(1.4);
  const [fitMode, setFitMode] = useState<'screen' | 'width' | 'custom'>('screen');
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(settings.autoScrollSpeed || 30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsPinned, setControlsPinned] = useState(!settings.autoHideControls);
  const [invertColors, setInvertColors] = useState(settings.invertColorsForNightStage || false);
  const [showSetlist, setShowSetlist] = useState(false);
  const [showPageThumbnails, setShowPageThumbnails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const autoScrollAnimationRef = useRef<number | null>(null);

  // Find index of current song in category's custom order
  const currentSongIndex = categorySongs.findIndex((s) => s.id === song.id);
  const prevSong = currentSongIndex > 0 ? categorySongs[currentSongIndex - 1] : null;
  const nextSong =
    currentSongIndex !== -1 && currentSongIndex < categorySongs.length - 1
      ? categorySongs[currentSongIndex + 1]
      : null;

  // Load PDF when song changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage('');
    setCurrentPage(1);
    setIsAutoScrolling(false);

    async function loadPdf() {
      try {
        const buffer = await getPdfBlob(song.pdfStorageKey);
        if (!buffer) {
          throw new Error('Arquivo PDF da música não encontrado na memória local.');
        }

        const doc = await loadPdfDocument(buffer);
        if (isMounted) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading presentation PDF:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Erro ao abrir o PDF');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      if (pdfDoc && typeof (pdfDoc as any).destroy === 'function') {
        (pdfDoc as any).destroy();
      }
    };
  }, [song.id, song.pdfStorageKey]);

  // Adjust zoom for fit mode
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current || !pdfDoc) return 1.4;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Standard A4 aspect ratio approximation (595 / 842)
    if (fitMode === 'screen') {
      const scaleH = (containerHeight - 40) / 842;
      const scaleW = (containerWidth - 60) / 595;
      return Math.min(scaleH, scaleW, 2.5);
    } else if (fitMode === 'width') {
      return Math.min((containerWidth - 60) / 595, 2.8);
    }
    return zoomScale;
  }, [fitMode, pdfDoc, zoomScale]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || loading) return;

    let isCurrent = true;
    const effectiveScale = fitMode === 'custom' ? zoomScale : calculateFitScale();

    renderPdfPageToCanvas(pdfDoc, currentPage, canvasRef.current, effectiveScale, invertColors).then(
      () => {
        if (isCurrent && fitMode === 'screen' && containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
    );

    return () => {
      isCurrent = false;
    };
  }, [pdfDoc, currentPage, zoomScale, fitMode, invertColors, loading, calculateFitScale]);

  // Handle auto-scroll tick
  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollAnimationRef.current) {
        cancelAnimationFrame(autoScrollAnimationRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    // Speed conversion: 1 = ~10px/s, 100 = ~250px/s
    const pixelsPerSecond = 8 + (scrollSpeed / 100) * 220;

    const scrollLoop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (containerRef.current) {
        const el = containerRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;

        if (el.scrollTop < maxScroll - 1) {
          el.scrollTop += pixelsPerSecond * delta;
        } else {
          // Reached end of current page: advance to next page if available
          if (currentPage < totalPages) {
            setCurrentPage((p) => p + 1);
            el.scrollTop = 0;
          } else {
            setIsAutoScrolling(false);
          }
        }
      }

      autoScrollAnimationRef.current = requestAnimationFrame(scrollLoop);
    };

    autoScrollAnimationRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (autoScrollAnimationRef.current) {
        cancelAnimationFrame(autoScrollAnimationRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed, currentPage, totalPages]);

  // Navigation handlers
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    } else if (nextSong) {
      // Prompt or advance to next song
      onSelectSong(nextSong);
    }
  }, [currentPage, totalPages, nextSong, onSelectSong]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    } else if (prevSong) {
      onSelectSong(prevSong);
    }
  }, [currentPage, prevSong, onSelectSong]);

  const handleFirstPage = useCallback(() => {
    setCurrentPage(1);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, []);

  const handleLastPage = useCallback(() => {
    setCurrentPage(totalPages);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [totalPages]);

  const handleToggleAutoScroll = useCallback(() => {
    setIsAutoScrolling((prev) => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut trigger when typing inside inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          handleNextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          handlePrevPage();
          break;
        case 'Home':
          e.preventDefault();
          handleFirstPage();
          break;
        case 'End':
          e.preventDefault();
          handleLastPage();
          break;
        case ' ': // Space = toggle auto-scroll
          e.preventDefault();
          handleToggleAutoScroll();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) {
            handleToggleFullscreen();
          } else {
            onClose();
          }
          break;
        case 'F11':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case ']':
        case 'n':
        case 'N':
          if (nextSong) {
            e.preventDefault();
            onSelectSong(nextSong);
          }
          break;
        case '[':
        case 'p':
        case 'P':
          if (prevSong) {
            e.preventDefault();
            onSelectSong(prevSong);
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          setFitMode('custom');
          setZoomScale((z) => Math.min(z + 0.2, 3.0));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setFitMode('custom');
          setZoomScale((z) => Math.max(z - 0.2, 0.6));
          break;
        case '0':
          e.preventDefault();
          setFitMode('screen');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handleLastPage,
    handleToggleAutoScroll,
    handleToggleFullscreen,
    isFullscreen,
    onClose,
    nextSong,
    prevSong,
    onSelectSong,
  ]);

  // Idle mouse detection to auto-hide controls
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsPinned) return;

    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      if (!controlsPinned) {
        setControlsVisible(false);
      }
    }, (settings.autoHideDelaySeconds || 3) * 1000);
  };

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col bg-[#0A0B0D] text-[#E2E4E9] overflow-hidden select-none font-sans`}
    >
      {/* TOP FLOATING HUD CONTROLS */}
      <div
        className={`absolute top-0 inset-x-0 z-30 transition-all duration-300 transform ${
          controlsVisible || controlsPinned
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#0E0F12]/95 backdrop-blur-md border-b border-[#22242A] px-4 py-2.5 shadow-2xl flex items-center justify-between gap-4">
          {/* Left: Back + Song Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] text-[#E2E4E9] text-xs font-semibold transition-all shrink-0 border border-[#2D3038] shadow-xs"
              title="Voltar à Biblioteca (Esc)"
            >
              <ChevronLeft className="w-4 h-4 text-blue-400" />
              <span>Biblioteca</span>
            </button>

            <div className="min-w-0 pr-2 border-r border-[#22242A]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-blue-400 truncate max-w-xs md:max-w-md">
                  {song.order + 1}. {song.title}
                </span>
                {song.keySignature && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                    {song.keySignature}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#868C98] truncate">
                {category?.name || 'Biblioteca'} • {song.originalFileName}
              </p>
            </div>
          </div>

          {/* Center: Slide Page Navigation & Indicators */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFirstPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded text-[#868C98] hover:text-[#E2E4E9] hover:bg-[#15171C] disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Primeira página (Home)"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 && !prevSong}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] text-blue-400 border border-[#2D3038] text-xs font-bold font-mono transition-all disabled:opacity-20 disabled:pointer-events-none"
              title="Página anterior (←)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            {/* Page Count Pill */}
            <div className="px-3 py-1 rounded bg-[#0A0B0D] border border-[#2D3038] text-xs font-mono font-bold text-blue-400 shadow-inner flex items-center gap-1.5">
              <span className="text-[#868C98]">PÁG</span>
              <span className="text-white text-sm">{currentPage}</span>
              <span className="text-[#525866]">/</span>
              <span>{totalPages}</span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages && !nextSong}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono border border-blue-500 shadow-md shadow-blue-950/40 transition-all disabled:opacity-20 disabled:pointer-events-none"
              title="Próxima página (→)"
            >
              <span>Próxima</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleLastPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded text-[#868C98] hover:text-[#E2E4E9] hover:bg-[#15171C] disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Última página (End)"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Auto-Scroll, Zoom, Stage tools, Fullscreen */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-scroll toggle & speed */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#121316] rounded-lg border border-[#22242A]">
              <button
                onClick={handleToggleAutoScroll}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                  isAutoScrolling
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500'
                    : 'bg-[#15171C] text-[#868C98] hover:text-[#E2E4E9] hover:bg-[#1A1D24] border border-[#202227]'
                }`}
                title="Iniciar/Pausar Rolagem Automática (Espaço)"
              >
                {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoScrolling ? 'ROLANDO' : 'ROLAGEM'}</span>
              </button>

              <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#22242A]">
                <span className="text-[10px] font-mono text-blue-400">{scrollSpeed}x</span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={scrollSpeed}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setScrollSpeed(val);
                    onUpdateSettings({ autoScrollSpeed: val });
                  }}
                  className="w-16 h-1.5 bg-[#1E2028] rounded appearance-none cursor-pointer accent-blue-500"
                  title="Velocidade de rolagem (1 = Lenta ... 100 = Rápida)"
                />
              </div>
            </div>

            {/* Zoom / Fit Controls */}
            <div className="flex items-center gap-1 bg-[#121316] p-1 rounded-lg border border-[#22242A]">
              <button
                onClick={() => {
                  setFitMode('screen');
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  fitMode === 'screen'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-[#868C98] hover:text-[#E2E4E9]'
                }`}
                title="Ajustar à Tela (0)"
              >
                Tela
              </button>
              <button
                onClick={() => {
                  setFitMode('width');
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  fitMode === 'width'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-[#868C98] hover:text-[#E2E4E9]'
                }`}
                title="Ajustar à Largura"
              >
                Largura
              </button>
              <button
                onClick={() => {
                  setFitMode('custom');
                  setZoomScale((z) => Math.max(z - 0.2, 0.6));
                }}
                className="p-1 text-[#868C98] hover:text-[#E2E4E9] rounded hover:bg-[#15171C]"
                title="Diminuir Zoom (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setFitMode('custom');
                  setZoomScale((z) => Math.min(z + 0.2, 3.0));
                }}
                className="p-1 text-[#868C98] hover:text-[#E2E4E9] rounded hover:bg-[#15171C]"
                title="Aumentar Zoom (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Night Stage High Contrast Invert */}
            <button
              onClick={() => {
                const next = !invertColors;
                setInvertColors(next);
                onUpdateSettings({ invertColorsForNightStage: next });
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                invertColors
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-[#121316] text-[#868C98] hover:text-[#E2E4E9] border-[#22242A]'
              }`}
              title="Modo Palco Escuro / Inverter Cores"
            >
              {invertColors ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Pin HUD Controls */}
            <button
              onClick={() => setControlsPinned(!controlsPinned)}
              className={`p-1.5 rounded-lg border transition-colors ${
                controlsPinned
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : 'bg-[#121316] text-[#868C98] hover:text-[#E2E4E9] border-[#22242A]'
              }`}
              title={controlsPinned ? 'Desafixar barra de controles' : 'Fixar barra sempre visível'}
            >
              {controlsPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>

            {/* Setlist Drawer Toggle */}
            <button
              onClick={() => setShowSetlist(!showSetlist)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                showSetlist
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#121316] text-[#868C98] hover:text-[#E2E4E9] border-[#22242A]'
              }`}
              title="Setlist da Pasta"
            >
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">SETLIST</span>
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg bg-[#121316] text-[#868C98] hover:text-[#E2E4E9] border border-[#22242A] transition-colors"
              title="Alternar Tela Cheia (F11)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEWPORT (PDF CANVAS CONTAINER) */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-2 relative outline-hidden"
        style={{
          scrollBehavior: isAutoScrolling ? 'auto' : 'smooth',
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[#868C98]">CARREGANDO PARTITURA EM PDF...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-8 rounded-xl bg-[#121316] border border-rose-500/40 text-center max-w-md">
            <p className="text-rose-400 font-bold mb-2">Erro ao carregar partitura</p>
            <p className="text-xs text-[#868C98] mb-4">{errorMessage}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#15171C] text-[#E2E4E9] rounded-lg text-xs font-semibold hover:bg-[#1A1D24] border border-[#202227]"
            >
              Voltar à Biblioteca
            </button>
          </div>
        ) : (
          <div className="my-auto flex flex-col items-center justify-center">
            {/* The crisp PDF page canvas */}
            <canvas
              ref={canvasRef}
              className="pdf-slide-canvas rounded-lg transition-transform duration-100 max-w-none shadow-2xl"
            />
          </div>
        )}

        {/* CLICKABLE PREV / NEXT TAP ZONES ON LEFT AND RIGHT EDGES */}
        <div
          onClick={handlePrevPage}
          className="absolute left-0 top-16 bottom-16 w-1/8 opacity-0 hover:opacity-100 flex items-center justify-start pl-4 cursor-pointer transition-opacity group"
          title="Clique para página anterior (←)"
        >
          <div className="p-3 rounded-full bg-[#121316]/90 border border-[#2D3038] text-white group-hover:scale-110 transition-transform shadow-xl">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={handleNextPage}
          className="absolute right-0 top-16 bottom-16 w-1/8 opacity-0 hover:opacity-100 flex items-center justify-end pr-4 cursor-pointer transition-opacity group"
          title="Clique para próxima página (→)"
        >
          <div className="p-3 rounded-full bg-[#121316]/90 border border-[#2D3038] text-white group-hover:scale-110 transition-transform shadow-xl">
            <ChevronRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* BOTTOM FLOATING CONTROLS: PREV SONG / NEXT SONG IN CATEGORY ORDER */}
      <div
        className={`absolute bottom-3 inset-x-0 z-30 flex items-center justify-center gap-3 transition-all duration-300 transform pointer-events-none ${
          controlsVisible || controlsPinned
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="bg-[#0E0F12]/90 backdrop-blur-md border border-[#22242A] px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto">
          {/* Previous song in category order */}
          {prevSong ? (
            <button
              onClick={() => onSelectSong(prevSong)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] text-[#868C98] hover:text-[#E2E4E9] border border-[#202227] text-xs font-mono font-semibold transition-all group"
              title={`Música anterior: ${prevSong.title} (Atalho: [)`}
            >
              <SkipBack className="w-3.5 h-3.5 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="max-w-[140px] truncate">{prevSong.title}</span>
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#525866] px-2">Início da Pasta</span>
          )}

          <div className="w-px h-5 bg-[#22242A]" />

          {/* Quick Page Jump Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => {
                  setCurrentPage(pNum);
                  if (containerRef.current) containerRef.current.scrollTop = 0;
                }}
                className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all flex items-center justify-center ${
                  currentPage === pNum
                    ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                    : 'bg-[#15171C] text-[#868C98] hover:text-[#E2E4E9] hover:bg-[#1A1D24] border border-[#202227]'
                }`}
                title={`Ir para página ${pNum}`}
              >
                {pNum}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[#22242A]" />

          {/* Next song in category order */}
          {nextSong ? (
            <button
              onClick={() => onSelectSong(nextSong)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] text-[#868C98] hover:text-[#E2E4E9] border border-[#202227] text-xs font-mono font-semibold transition-all group"
              title={`Próxima música: ${nextSong.title} (Atalho: ])`}
            >
              <span className="max-w-[140px] truncate">{nextSong.title}</span>
              <SkipForward className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#525866] px-2">Fim da Pasta</span>
          )}
        </div>
      </div>

      {/* SETLIST SIDE DRAWER (Allows switching songs on the fly) */}
      {showSetlist && (
        <div className="absolute top-14 right-3 bottom-14 z-40 w-80 bg-[#121316]/95 backdrop-blur-lg border border-[#22242A] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#22242A] bg-[#0E0F12]">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold font-mono text-[#E2E4E9] uppercase tracking-wider">
                MÚSICAS DA PASTA ({categorySongs.length})
              </span>
            </div>
            <button
              onClick={() => setShowSetlist(false)}
              className="p-1 text-[#868C98] hover:text-[#E2E4E9] rounded hover:bg-[#15171C]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {categorySongs.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectSong(s);
                  setShowSetlist(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                  s.id === song.id
                    ? 'bg-blue-600 text-white font-bold shadow-md border border-blue-500'
                    : 'hover:bg-[#15171C] text-[#868C98] hover:text-[#E2E4E9] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`text-xs font-mono w-5 shrink-0 ${
                      s.id === song.id ? 'text-blue-200' : 'text-[#525866]'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs truncate font-medium">{s.title}</span>
                </div>
                <span className="text-[10px] font-mono opacity-75 shrink-0 ml-2">{s.pageCount} p.</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
