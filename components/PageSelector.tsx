import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { Layers, ArrowRight, Check } from 'lucide-react';

interface PageSelectorProps {
  totalPages: number;
  onConfirm: (start: number, end: number) => void;
  onCancel: () => void;
}

export const PageSelector: React.FC<PageSelectorProps> = ({ totalPages, onConfirm, onCancel }) => {
  const { theme } = useTheme();
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(totalPages);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) setStartPage(val);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) setEndPage(val);
  };

  const handleConfirm = () => {
    // Validation
    let s = Math.max(1, startPage);
    let e = Math.min(totalPages, endPage);
    if (s > e) s = e;
    
    onConfirm(s, e);
  };

  const handleSelectAll = () => {
    onConfirm(1, totalPages);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className={`bg-${theme}-600 p-6 text-white flex items-center gap-3`}>
          <div className="bg-white/20 p-2 rounded-lg">
             <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Chọn trang tài liệu</h3>
            <p className={`text-${theme}-100 text-sm`}>File PDF có tổng cộng <strong>{totalPages}</strong> trang</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-sm">
            Để tối ưu tốc độ xử lý và độ chính xác, hãy chọn khoảng trang bạn muốn chuyển đổi.
          </p>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Từ trang</label>
              <input 
                type="number" 
                min="1" 
                max={totalPages}
                value={startPage}
                onChange={handleStartChange}
                className={`w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-900 focus:border-${theme}-500 focus:ring-0 outline-none transition-colors text-center shadow-sm`}
              />
            </div>
            
            <ArrowRight className="w-6 h-6 text-gray-300 mt-5" />

            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đến trang</label>
              <input 
                type="number" 
                min="1" 
                max={totalPages}
                value={endPage}
                onChange={handleEndChange}
                className={`w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-900 focus:border-${theme}-500 focus:ring-0 outline-none transition-colors text-center shadow-sm`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleConfirm} className="w-full py-3 text-lg shadow-lg shadow-gray-200">
               <Check className="w-5 h-5 mr-2" />
               Xác nhận & Tiếp tục
            </Button>
            
            <div className="flex gap-3">
               <button 
                 onClick={handleSelectAll}
                 className={`flex-1 py-2 text-sm font-medium text-${theme}-600 bg-${theme}-50 hover:bg-${theme}-100 rounded-lg transition-colors`}
               >
                 Chọn tất cả ({totalPages} trang)
               </button>
               <button 
                 onClick={onCancel}
                 className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 Hủy
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};