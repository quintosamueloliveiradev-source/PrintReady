import React from 'react';
import { 
  Maximize2, 
  Layout, 
  Scissors, 
  Settings2, 
  Copy,
  FileType,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface EditorSidebarProps {
  bleedSize: number;
  setBleedSize: (v: number) => void;
  bleedType: 'color' | 'blur' | 'extend';
  setBleedType: (type: 'color' | 'blur' | 'extend') => void;
  layoutMode: 1 | 2 | 4;
  setLayoutMode: (mode: 1 | 2 | 4) => void;
  orientation: 'portrait' | 'landscape';
  setOrientation: (o: 'portrait' | 'landscape') => void;
  showCutMarks: boolean;
  setShowCutMarks: (v: boolean) => void;
}

export default function EditorSidebar({
  bleedSize, setBleedSize,
  bleedType, setBleedType,
  layoutMode, setLayoutMode,
  orientation, setOrientation,
  showCutMarks, setShowCutMarks
}: EditorSidebarProps) {
  return (
    <div className="w-full flex flex-col gap-8">
      {/* Bleed Settings */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Maximize2 className="w-3 h-3" />
            Sangria Automática
          </label>
          <span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-bold">IA ATIVA</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {[3, 5, 10].map(size => (
            <button
              key={size}
              onClick={() => setBleedSize(size)}
              className={cn(
                "py-2 px-3 rounded text-[10px] font-bold transition-all border",
                bleedSize === size 
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm" 
                  : "bg-white text-gray-500 border-gray-200 hover:border-brand-400"
              )}
            >
              {size}mm
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {[
            { id: 'color', label: 'Cor Sólida Inteligente' },
            { id: 'blur', label: 'Borda com Desfoque' },
            { id: 'extend', label: 'Extensão de Imagem' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setBleedType(type.id as any)}
              className={cn(
                "w-full px-3 py-2 rounded border text-left transition-all text-[11px] font-bold",
                bleedType === type.id 
                  ? "bg-brand-50 border-brand-600 text-brand-700 ring-1 ring-brand-600" 
                  : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Settings */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Layout className="w-3 h-3" />
          Distribuição (A4)
        </label>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { mode: 1, label: '1 Un.' },
            { mode: 2, label: '2 Un.' },
            { mode: 4, label: '4 (A6)' }
          ].map(item => (
            <button
              key={item.mode}
              onClick={() => setLayoutMode(item.mode as any)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded border transition-all h-16",
                layoutMode === item.mode 
                  ? "bg-brand-50 border-brand-500 text-brand-700 font-bold" 
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              <Copy className="w-4 h-4 mb-1" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sheet Config */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <Settings2 className="w-3 h-3" />
          Configurações da Folha
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-700">Marcas de Corte</span>
            </div>
            <button
              onClick={() => setShowCutMarks(!showCutMarks)}
              className={cn(
                "relative inline-flex h-4 w-8 items-center rounded-full transition-colors",
                showCutMarks ? "bg-brand-600" : "bg-gray-300"
              )}
            >
              <span className={cn(
                "inline-block h-2 w-2 transform rounded-full bg-white transition-transform",
                showCutMarks ? "translate-x-5" : "translate-x-1"
              )} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOrientation('portrait')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold rounded border",
                orientation === 'portrait' ? "bg-gray-800 text-white border-gray-800 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              )}
            >
              RETRATO (A4)
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold rounded border",
                orientation === 'landscape' ? "bg-gray-800 text-white border-gray-800 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              )}
            >
              PAISAGEM (A4)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
