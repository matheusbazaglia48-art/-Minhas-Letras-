import React, { useState, useRef } from 'react';
import { Category } from '../types';
import { UploadCloud, FileText, CheckCircle2, X, Loader2, Plus } from 'lucide-react';

interface BatchImportModalProps {
  categories: Category[];
  activeCategoryId?: string;
  onClose: () => void;
  onImportFiles: (files: File[], targetCategoryId: string) => Promise<void>;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  categories,
  activeCategoryId,
  onClose,
  onImportFiles,
}) => {
  const [selectedCatId, setSelectedCatId] = useState(
    activeCategoryId || (categories[0]?.id ?? '')
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesList = Array.from(e.target.files) as File[];
      const validPdfs = filesList.filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      setSelectedFiles((prev) => [...prev, ...validPdfs]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const filesList = Array.from(e.dataTransfer.files) as File[];
      const validPdfs = filesList.filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      setSelectedFiles((prev) => [...prev, ...validPdfs]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartImport = async () => {
    if (selectedFiles.length === 0 || !selectedCatId) return;
    setIsProcessing(true);
    setProgressMsg(`Processando ${selectedFiles.length} arquivos PDF independentes...`);
    try {
      await onImportFiles(selectedFiles, selectedCatId);
      onClose();
    } catch (err) {
      console.error(err);
      setProgressMsg('Erro ao importar arquivos.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#121316] border border-[#22242A] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#22242A] bg-[#0E0F12] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#181A20] text-blue-400 border border-[#2D3038]">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-[#E2E4E9] uppercase tracking-wider">
                Importar Músicas em PDF
              </h3>
              <p className="text-xs text-[#868C98]">
                Cada PDF será indexado como uma música independente na pasta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 text-[#868C98] hover:text-white rounded hover:bg-[#1A1D24] transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Category Selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#868C98] uppercase tracking-wider mb-2">
              Pasta de Destino na Biblioteca:
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2.5 bg-[#0A0B0D] border border-[#2D3038] rounded-lg text-[#E2E4E9] text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  📁 {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-[#2D3038] hover:border-blue-500/60 bg-[#0A0B0D] hover:bg-[#15171C]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-lg bg-[#181A20] text-blue-400 flex items-center justify-center border border-[#2D3038] shadow-inner">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#E2E4E9]">
                Arraste seus arquivos PDF ou clique para buscar
              </p>
              <p className="text-[11px] font-mono text-[#868C98] mt-1">
                Suporta múltiplos arquivos simultaneamente sem limite
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#15171C] text-blue-300 border border-[#22242A] text-[10px] font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              1 PDF = 1 Música Independente
            </span>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#868C98] px-1">
                <span>{selectedFiles.length} MÚSICA(S) SELECIONADA(S):</span>
                <button
                  onClick={() => setSelectedFiles([])}
                  disabled={isProcessing}
                  className="text-rose-400 hover:text-rose-300 transition-colors"
                >
                  LIMPAR LISTA
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0A0B0D] border border-[#202227] text-xs text-[#E2E4E9]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] font-mono text-[#868C98] shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      disabled={isProcessing}
                      className="p-1 text-[#868C98] hover:text-rose-400 rounded transition-colors"
                      title="Remover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#22242A] bg-[#0E0F12] shrink-0">
          <div className="text-[11px] font-mono text-[#868C98]">
            {isProcessing ? (
              <span className="flex items-center gap-2 text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progressMsg}
              </span>
            ) : (
              <span>TOTAL: {selectedFiles.length} ARQUIVO(S)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#868C98] hover:text-white bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] rounded-lg transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={handleStartImport}
              disabled={selectedFiles.length === 0 || isProcessing}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg shadow-md shadow-blue-950/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Importar ({selectedFiles.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
