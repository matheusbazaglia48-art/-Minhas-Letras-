import React, { useState } from 'react';
import { exportWindowsPythonPackage } from '../services/storage';
import {
  Terminal,
  Download,
  Copy,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

interface WindowsExporterModalProps {
  onClose: () => void;
}

export const WindowsExporterModal: React.FC<WindowsExporterModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'workflow'>('overview');
  const [copiedTab, setCopiedTab] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zipBlob = await exportWindowsPythonPackage();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MinhasLetrasV4_Windows7_Standalone_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading Windows package:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(true);
    setTimeout(() => setCopiedTab(false), 2000);
  };

  const workflowCode = `name: Build Minhas Letras V4 Standalone Windows EXE

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
          pip install PyQt5==5.15.9 PyMuPDF==1.22.5 pyinstaller==5.13.2

      - name: Build Standalone Executable with PyInstaller
        run: |
          pyinstaller --noconfirm --onedir --windowed --name "MinhasLetrasV4" minhas_letras.py

      - name: Upload Windows 7 Standalone Executable Artifact
        uses: actions/upload-artifact@v4
        with:
          name: MinhasLetrasV4-Windows7-Standalone
          path: dist/MinhasLetrasV4/
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#121316] border border-[#22242A] rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#22242A] bg-[#0E0F12] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#181A20] text-blue-400 border border-[#2D3038]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-[#E2E4E9] uppercase tracking-wider">
                  Gerador de Executável Windows 7 (.EXE Standalone)
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PyInstaller 5.13 + Python 3.8
                </span>
              </div>
              <p className="text-xs text-[#868C98]">
                Gera executável desktop nativo que roda direto no Windows 7 sem requisições de runtime
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-2 border-b border-[#22242A] bg-[#0A0B0D] text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-[#121316] rounded-t'
                : 'border-transparent text-[#868C98] hover:text-[#E2E4E9]'
            }`}
          >
            📋 VISÃO GERAL
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all ${
              activeTab === 'workflow'
                ? 'border-blue-500 text-blue-400 bg-[#121316] rounded-t'
                : 'border-transparent text-[#868C98] hover:text-[#E2E4E9]'
            }`}
          >
            ⚙️ WORKFLOW (.YML)
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 font-bold border-b-2 transition-all ${
              activeTab === 'script'
                ? 'border-blue-500 text-blue-400 bg-[#121316] rounded-t'
                : 'border-transparent text-[#868C98] hover:text-[#E2E4E9]'
            }`}
          >
            🐍 SCRIPT PYTHON (PyQt5)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[#E2E4E9] text-xs leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#0A0B0D] border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>COMPATIBILIDADE NATIVA GARANTIDA COM WINDOWS 7</span>
                </div>
                <p className="text-[#868C98] text-xs">
                  O projeto inclui todo o código Python nativo otimizado com <strong>PyQt5</strong> e <strong>PyMuPDF</strong> (renderização leve que consome menos de 40MB de RAM) e o arquivo de fluxo automatizado para compilar o executável no GitHub Actions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-[#202227] space-y-1.5">
                  <span className="font-bold text-[#E2E4E9] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">1</span>
                    Baixar o Pacote ZIP
                  </span>
                  <p className="text-[#868C98] text-[11px]">
                    Baixe o código fonte completo e o workflow pronto de compilação.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-[#202227] space-y-1.5">
                  <span className="font-bold text-[#E2E4E9] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">2</span>
                    Subir no GitHub
                  </span>
                  <p className="text-[#868C98] text-[11px]">
                    Envie os arquivos para um repositório no seu GitHub (gratuito).
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-[#202227] space-y-1.5">
                  <span className="font-bold text-[#E2E4E9] flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-mono">3</span>
                    Baixar o .EXE Pronto
                  </span>
                  <p className="text-[#868C98] text-[11px]">
                    O GitHub Actions compila e gera o arquivo .exe pronto nos Artifacts!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-[#202227] space-y-1.5">
                <span className="font-mono font-bold text-[#868C98] text-[11px] uppercase">Arquivos inclusos no pacote ZIP:</span>
                <ul className="list-disc list-inside space-y-1 text-[#868C98] font-mono text-[11px]">
                  <li><span className="text-blue-400">minhas_letras.py</span> (Aplicação Desktop Completa V4)</li>
                  <li><span className="text-blue-400">.github/workflows/build.yml</span> (Workflow de Build Automatizado)</li>
                  <li><span className="text-blue-400">requirements.txt</span> (PyQt5, PyMuPDF, PyInstaller)</li>
                  <li><span className="text-blue-400">minhas_letras_dados.json</span> (Configuração persistente)</li>
                  <li><span className="text-blue-400">README.md</span> (Guia passo a passo)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#868C98] font-mono text-[11px]">
                  Caminho do arquivo: <code>.github/workflows/build.yml</code>
                </span>
                <button
                  onClick={() => copyToClipboard(workflowCode)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#15171C] hover:bg-[#1A1D24] border border-[#2D3038] text-[#E2E4E9] text-xs font-mono"
                >
                  {copiedTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTab ? 'COPIADO' : 'COPIAR'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-[#0A0B0D] border border-[#202227] text-[11px] font-mono text-blue-300 overflow-x-auto max-h-72">
                {workflowCode}
              </pre>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-2">
              <span className="text-[#868C98] text-[11px]">
                Código completo com interface gráfica PyQt5, apresentação de slides independente por PDF, rolagem automática e ordenação permanente JSON:
              </span>
              <div className="p-4 rounded-lg bg-[#0A0B0D] border border-[#202227] text-[11px] font-mono text-[#868C98] space-y-1">
                <p className="text-blue-400 font-bold"># Minhas Letras V4 - PyQt5 Desktop Engine</p>
                <p>O script Python nativo completo está empacotado no ZIP para download.</p>
                <p className="text-[#525866]">Totalmente compatível com Python 3.8 no Windows 7 com compilação standalone via PyInstaller.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#22242A] bg-[#0E0F12] shrink-0">
          <span className="text-xs font-mono text-[#868C98]">
            PRONTO PARA COMPILAR E RODAR
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#868C98] hover:text-white bg-[#15171C] hover:bg-[#1A1D24] border border-[#202227] rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg shadow-md shadow-blue-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Gerando...' : 'Baixar Pacote (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
