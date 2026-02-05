import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { FileData } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ResultSectionProps {
  content: string; // This is now HTML with base64 images already injected
  fileData: FileData | null;
  originalImageBase64?: string; // Optional full original image
}

export const ResultSection: React.FC<ResultSectionProps> = ({ content, fileData, originalImageBase64 }) => {
  const [copied, setCopied] = useState(false);
  const [includeImage, setIncludeImage] = useState(true);
  const { theme } = useTheme();

  const generateFullHtml = () => {
    // Basic Word-compatible HTML wrapper with improved Table CSS
    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Converted Document</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
          
          /* Table Styles for Word */
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 1em; 
            border: 1px solid #000000; 
          }
          td, th { 
            border: 1px solid #000000; 
            padding: 6px 10px; 
            vertical-align: top; 
            word-wrap: break-word;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
            text-align: center; 
          }
          
          img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
          h1, h2, h3 { color: #2e3b4e; margin-top: 1.5em; }
          .image-note { font-style: italic; color: #666; font-size: 0.9em; text-align: center; }
        </style>
      </head>
      <body>
        ${content}
        ${(includeImage && originalImageBase64) ? '<br/><br/><hr/><p class="image-note">(Tài liệu tham khảo: Ảnh gốc đính kèm cuối file)</p><img src="' + originalImageBase64 + '" />' : ''}
      </body>
      </html>
    `;
  };

  const handleCopy = async () => {
    try {
      const fullHtml = generateFullHtml();
      const blobHtml = new Blob([fullHtml], { type: 'text/html' });
      // Plain text fallback removes tags
      const plainText = content.replace(/<[^>]*>?/gm, '');
      const blobText = new Blob([plainText], { type: 'text/plain' });
      
      const data = [new ClipboardItem({ 
        'text/html': blobHtml, 
        'text/plain': blobText 
      })];
      
      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
      alert("Lỗi khi copy. Vui lòng dùng nút Lưu Word.");
    }
  };

  const handleDownload = () => {
    const fullHtml = generateFullHtml();
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TealDoc_Converted_${new Date().getTime()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full animate-fade-in-up">
      <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between sticky top-0 backdrop-blur-sm z-10 flex-wrap gap-2">
        <div className={`flex items-center gap-2 text-${theme}-800 font-medium`}>
          <FileText className="w-5 h-5" />
          <span>Kết quả</span>
        </div>
        <div className="flex gap-2 items-center">
           {originalImageBase64 && (
             <label className="flex items-center gap-2 text-xs mr-2 cursor-pointer select-none text-gray-600 hover:text-gray-900">
               <input 
                 type="checkbox" 
                 checked={includeImage} 
                 onChange={(e) => setIncludeImage(e.target.checked)}
                 className={`rounded border-gray-300 text-${theme}-600 focus:ring-${theme}-500`}
               />
               Kèm ảnh gốc
             </label>
           )}

           <Button 
            variant="secondary" 
            onClick={handleDownload}
            className="!px-3 !py-1.5 text-sm !rounded-md"
            title="Tải xuống file Word (.doc)"
          >
            <Download className="w-4 h-4 mr-2" />
            Lưu Word
          </Button>
          <Button 
            variant={copied ? 'primary' : 'primary'} 
            onClick={handleCopy}
            className={`!px-3 !py-1.5 text-sm !rounded-md transition-all duration-300 ${copied ? '!bg-green-600 hover:!bg-green-700' : ''}`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Đã copy
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="p-8 overflow-auto max-h-[600px] bg-white">
        <style>{`
          .preview-content h1, .preview-content h2, .preview-content h3 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: bold; color: #111827; }
          .preview-content p { margin-bottom: 1em; line-height: 1.6; color: #374151; }
          .preview-content ul, .preview-content ol { margin-bottom: 1em; padding-left: 1.5em; }
          .preview-content li { margin-bottom: 0.25em; }
          
          /* Table Preview Styles */
          .preview-content table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 1.5em; 
            font-size: 0.95em; 
            border: 2px solid #374151; 
          }
          .preview-content th, .preview-content td { 
            border: 1px solid #4b5563; 
            padding: 8px 12px; 
            text-align: left; 
            vertical-align: top;
          }
          .preview-content th { 
            background-color: #f3f4f6; 
            font-weight: 700; 
            border-bottom: 2px solid #374151;
          }
          .preview-content tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          .preview-content img { border: 1px solid #e5e7eb; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 1em 0; }
        `}</style>
        
        <div 
          className="preview-content font-sans"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        
        {includeImage && fileData?.type === 'image' && originalImageBase64 && (
          <div className="mt-8 pt-8 border-t border-dashed border-gray-300 opacity-70">
             <p className="text-xs text-center italic mb-2 text-gray-500">Ảnh gốc đính kèm (sẽ có trong file Word):</p>
             <img src={originalImageBase64} alt="Original" className="max-w-full mx-auto border border-gray-200 shadow-sm" />
          </div>
        )}
      </div>
    </div>
  );
};