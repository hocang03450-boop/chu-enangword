import React, { useCallback, useEffect, useState } from 'react';
import { Upload, File as FileIcon, Image as ImageIcon, X } from 'lucide-react';
import { FileData } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface FileUploadProps {
  onFileSelect: (fileData: FileData | null) => void;
  selectedFile: FileData | null;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { theme } = useTheme();

  const processFile = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      alert("Vui lòng chỉ tải lên file ảnh (PNG, JPG) hoặc PDF.");
      return;
    }

    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    
    onFileSelect({
      file,
      previewUrl,
      type: isImage ? 'image' : 'pdf'
    });
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [disabled, processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (disabled) return;
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      e.preventDefault();
      processFile(e.clipboardData.files[0]);
    }
  }, [disabled, processFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  if (selectedFile) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl border-2 border-${theme}-200 bg-white shadow-sm transition-all hover:shadow-md`}>
        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={clearFile}
            className="p-1.5 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] gap-4">
          {selectedFile.type === 'image' && selectedFile.previewUrl ? (
            <img 
              src={selectedFile.previewUrl} 
              alt="Preview" 
              className="max-h-[400px] w-auto object-contain rounded-lg shadow-sm border border-gray-100" 
            />
          ) : (
            <div className={`flex flex-col items-center text-${theme}-600`}>
              <FileIcon className="w-24 h-24 mb-4 opacity-80" />
              <p className="font-semibold text-lg">{selectedFile.file.name}</p>
              <p className="text-sm text-gray-500">{(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative group cursor-pointer
        flex flex-col items-center justify-center 
        w-full min-h-[300px] 
        rounded-2xl border-2 border-dashed 
        transition-all duration-300 ease-in-out
        ${isDragging 
          ? `border-${theme}-500 bg-${theme}-50 scale-[1.01]` 
          : `border-gray-300 bg-white hover:border-${theme}-400 hover:bg-gray-50`
        }
      `}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
          }
        }}
        disabled={disabled}
        accept="image/*,application/pdf"
      />
      
      <div className="flex flex-col items-center text-center p-6 space-y-4 pointer-events-none">
        <div className={`
          p-4 rounded-full transition-colors duration-300
          ${isDragging ? `bg-${theme}-200` : `bg-${theme}-50 group-hover:bg-${theme}-100`}
        `}>
          <Upload className={`w-8 h-8 ${isDragging ? `text-${theme}-700` : `text-${theme}-600`}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            Kéo thả hoặc dán (Ctrl+V) file vào đây
          </h3>
          <p className="text-sm text-gray-500">
            Hỗ trợ PNG, JPG và PDF
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
           <div className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Image</div>
           <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
           <div className="flex items-center gap-1"><FileIcon className="w-3 h-3"/> PDF</div>
        </div>
      </div>
    </div>
  );
};