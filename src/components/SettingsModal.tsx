import React, { useRef } from 'react';
import { AppSettings } from '../types';
import {
  Settings,
  SlidersHorizontal,
  Download,
  Upload,
  RotateCcw,
  X,
  Keyboard,
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
  onExportJsonMetadata: () => void;
  onImportJsonMetadata: (file: File) => void;
  onResetToDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onExportJsonMetadata,
  onImportJsonMetadata,
  onResetToDefaults,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportJsonMetadata(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#121316] border border-[#22242A] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#22242A] bg-[#0E0F12] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#181A20] text-blue-400 border border-[#2D3038]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-[#E2E4E9] uppercase tracking-wider">
                Configurações do Minhas Letras V4
              </h3>
              <p className="text-xs text-[#868C98]">
                Painel de calibração do palco, rolagem e persistência
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#868C98] hover:text-white rounded hover:bg-[#1A1D24] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-[#E2E4E9]">
          {/* Apresentação & Rolagem Automática */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>APRESENTADOR DE SLIDES & ROLAGEM</span>
            </h4>

            {/* Velocidade padrão da rolagem */}
            <div className="p-4 rounded-lg bg-[#0A0B0D] border border-[#202227] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#E2E4E9]">
                    Velocidade Padrão da Rolagem Automática
                  </span>
                  <p className="text-[11px] font-mono text-[#868C98]">
                    Escala de 1 (lenta) até 100 (ultra rápida)
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#15171C] border border-[#2D3038] text-xs font-mono font-bold text-blue-400">
                  {settings.autoScrollSpeed}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={settings.autoScrollSpeed}
                onChange={(e) => onUpdateSettings({ autoScrollSpeed: Number(e.target.value) })}
                className="w-full h-1.5 bg-[#1E2028] rounded appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-[#525866] font-mono">
                <span>1 (Mínima)</span>
                <span>25 (Lenta)</span>
                <span>50 (Média)</span>
                <span>75 (Rápida)</span>
                <span>100 (Máxima)</span>
              </div>
            </div>

            {/* Ocultação automática de controles */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0A0B0D] border border-[#202227]">
              <div>
                <span className="text-xs font-bold text-[#E2E4E9]">
                  Ocultar Controles Automaticamente no Palco
                </span>
                <p className="text-[11px] font-mono text-[#868C98]">
                  Esconde o painel superior após alguns segundos sem movimento
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoHideControls}
                  onChange={(e) => onUpdateSettings({ autoHideControls: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#202227] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Palco Noturno (Inversão de Cores) */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0A0B0D] border border-[#202227]">
              <div>
                <span className="text-xs font-bold text-[#E2E4E9]">
                  Modo Palco Escuro (Inverter Cores do PDF)
                </span>
                <p className="text-[11px] font-mono text-[#868C98]">
                  Fundo preto com texto branco de alto contraste para não ofuscar o palco
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.invertColorsForNightStage}
                  onChange={(e) =>
                    onUpdateSettings({ invertColorsForNightStage: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#202227] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Atalhos de Teclado & Guia de Palco */}
          <div className="space-y-2.5 pt-2 border-t border-[#22242A]">
            <h4 className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5" />
              <span>MAPEAMENTO DE TECLAS DE PALCO</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-[#0A0B0D] border border-[#202227] flex justify-between items-center">
                <span className="text-[#868C98] font-mono text-[11px]">Próxima Página</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#15171C] border border-[#2D3038] font-mono text-blue-400 font-bold text-[10px]">
                  → / PgDn
                </kbd>
              </div>
              <div className="p-2 rounded bg-[#0A0B0D] border border-[#202227] flex justify-between items-center">
                <span className="text-[#868C98] font-mono text-[11px]">Página Anterior</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#15171C] border border-[#2D3038] font-mono text-blue-400 font-bold text-[10px]">
                  ← / PgUp
                </kbd>
              </div>
              <div className="p-2 rounded bg-[#0A0B0D] border border-[#202227] flex justify-between items-center">
                <span className="text-[#868C98] font-mono text-[11px]">Rolagem Auto</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#15171C] border border-[#2D3038] font-mono text-blue-400 font-bold text-[10px]">
                  Espaço
                </kbd>
              </div>
              <div className="p-2 rounded bg-[#0A0B0D] border border-[#202227] flex justify-between items-center">
                <span className="text-[#868C98] font-mono text-[11px]">Próxima Música</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#15171C] border border-[#2D3038] font-mono text-blue-400 font-bold text-[10px]">
                  ] ou N
                </kbd>
              </div>
              <div className="p-2 rounded bg-[#0A0B0D] border border-[#202227] flex justify-between items-center">
                <span className="text-[#868C98] font-mono text-[11px]">Música Anterior</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#15171C] border border-[#2D3038] font-mono text-blue-400 font-bold text-[10px]">
                  [ ou P
                </kbd>
              </div>
              <div className="p-2 rounded bg-[#0A0B0D] border border-[#202227] flex justify-between items-center">
                <span className="text-[#868C98] font-mono text-[11px]">Sair do Palco</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#15171C] border border-[#2D3038] font-mono text-blue-400 font-bold text-[10px]">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          {/* Backup e Restauração de Dados */}
          <div className="space-y-2.5 pt-2 border-t border-[#22242A]">
            <h4 className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>BACKUP & METADADOS (JSON)</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={onExportJsonMetadata}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#2D3038] text-xs font-semibold text-[#E2E4E9] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Exportar Config (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#15171C] hover:bg-[#1A1D24] border border-[#2D3038] text-xs font-semibold text-[#E2E4E9] transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Restaurar Config (JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#22242A] bg-[#0E0F12] shrink-0">
          <button
            onClick={() => {
              if (confirm('Deseja restaurar as configurações padrão?')) {
                onResetToDefaults();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-[#868C98] hover:text-[#E2E4E9] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar padrões</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg transition-all shadow-sm"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
