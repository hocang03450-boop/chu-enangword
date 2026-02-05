
import React from 'react';
import { FileText, Wand2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Header: React.FC = () => {
  const { theme } = useTheme();

  return (
    <header className={`bg-${theme}-600 text-white shadow-lg sticky top-0 z-50 transition-colors duration-300 select-none`}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <h1 className="text-xl font-bold tracking-tight leading-tight">TealDoc Converter</h1>
                <span className="font-extrabold text-sm sm:text-base bg-gradient-to-r from-white via-gray-200 to-gray-100 bg-clip-text text-transparent drop-shadow-sm uppercase tracking-wide">
                    THẦY HỒ CANG - THPT CHU VĂN AN
                </span>
            </div>
            <p className={`text-${theme}-100 text-xs mt-0.5`}>PDF/Image to Text via Gemini 2.5 Flash</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 text-sm font-medium text-${theme}-100 bg-white/10 px-3 py-1 rounded-full`}>
                <Wand2 className="w-4 h-4" />
                <span>Gemini 2.5 AI</span>
            </div>
        </div>
      </div>
    </header>
  );
};
