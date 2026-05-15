/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { 
  Printer, 
  Download, 
  Zap, 
  ShieldCheck, 
  FileText,
  MousePointer2,
  AlertCircle,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FileUpload from './components/FileUpload';
import EditorSidebar from './components/EditorSidebar';
import CanvasPreview from './components/CanvasPreview';
import { cn } from './lib/utils';

export default function App() {
  // Application State
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Editor Config
  const [bleedSize, setBleedSize] = useState(3);
  const [bleedType, setBleedType] = useState<'color' | 'blur' | 'extend'>('color');
  const [layoutMode, setLayoutMode] = useState<1 | 2 | 4>(1);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showCutMarks, setShowCutMarks] = useState(true);

  // Canvas Reference for export
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setImage(null);
  };

  const handleDownloadPDF = () => {
    if (!activeCanvasRef.current) return;
    
    setIsProcessing(true);
    const canvas = activeCanvasRef.current;
    
    // Create PDF with sheet orientation
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    
    pdf.save(`PrintReady_${file?.name.split('.')[0] || 'arte'}_A4.pdf`);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#2563eb', '#1d4ed8']
    });
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded flex items-center justify-center text-white font-bold shadow-brand-500/20 shadow-lg">
              <Zap className="w-5 h-5 md:w-6 md:h-6 fill-current" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-gray-900">
              PrintFlow <span className="text-brand-600">AI</span>
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>DPI Otimizado</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <button 
              onClick={handleDownloadPDF}
              disabled={!image}
              className={cn(
                "flex items-center gap-2 px-5 py-2 text-sm font-bold rounded shadow-sm transition-all",
                image 
                  ? "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/25 active:scale-95" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Download className="w-4 h-4" />
              Exportar PDF (300 DPI)
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {!image ? (
          <div className="max-w-3xl mx-auto px-4 pt-20 pb-12 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display tracking-tight">
                Prepare artes <span className="text-brand-600 font-extrabold uppercase text-3xl md:text-4xl align-middle mx-1">automáticas</span> para corte
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">
                Adicione sangria inteligente e gere layouts de impressão de alta qualidade.
              </p>
            </motion.div>
            
            <FileUpload 
              onImageSelect={handleImageSelect} 
              selectedFile={file} 
              onClear={handleClear} 
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: Zap, title: "Sangria IA", desc: "Bordas geradas por IA cromática." },
                { icon: Layout, title: "Layouts A4", desc: "Organização automática 1, 2 ou 4." },
                { icon: Printer, title: "300 DPI", desc: "Qualidade profissional garantida." }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:border-brand-200">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
            {/* Editor Aside */}
            <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto shrink-0 scrollbar-hide">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Painel de Controle</span>
                <button 
                  onClick={handleClear} 
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Limpar
                </button>
              </div>

              <EditorSidebar 
                bleedSize={bleedSize} setBleedSize={setBleedSize}
                bleedType={bleedType} setBleedType={setBleedType}
                layoutMode={layoutMode} setLayoutMode={setLayoutMode}
                orientation={orientation} setOrientation={setOrientation}
                showCutMarks={showCutMarks} setShowCutMarks={setShowCutMarks}
              />
              
              <div className="mt-12 pt-6 border-t border-slate-100">
                <p className="italic text-[10px] text-slate-400 leading-relaxed">
                  * Processamento local seguro. Nenhuma imagem é enviada para servidores externos.
                </p>
              </div>
            </aside>

            {/* Preview Section */}
            <section className="flex-1 bg-[#F3F4F6] p-4 md:p-10 flex flex-col gap-6 relative overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="absolute top-6 left-6 text-[10px] text-gray-400 font-mono tracking-tighter hidden md:block">
                    PREVIEW EM TEMPO REAL: 300DPI_A4_V1.PDF
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm uppercase tracking-wider md:mt-6">
                    <FileText className="w-3 h-3 text-brand-600" />
                    <span>A4 • {orientation === 'portrait' ? 'Retrato' : 'Paisagem'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:mt-6">
                   <div className="text-[10px] font-bold bg-green-50 text-green-700 px-3 py-1 rounded flex items-center gap-1.5 border border-green-100 shadow-sm uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Sangria {bleedSize}mm OK
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[500px]">
                <CanvasPreview 
                  image={image}
                  bleedSize={bleedSize}
                  bleedType={bleedType}
                  layoutMode={layoutMode}
                  orientation={orientation}
                  showCutMarks={showCutMarks}
                  onCanvasReady={(canvas) => activeCanvasRef.current = canvas}
                />
              </div>

              <div className="md:hidden">
                 <button 
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-brand-600 text-white font-bold shadow-lg shadow-brand-500/30"
                >
                  <Download className="w-5 h-5" />
                  Gerar PDF para Impressão
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center flex-col gap-6"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 font-display">Processando Documento</p>
              <p className="text-sm text-slate-500">Otimizando para impressão 300 DPI...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
