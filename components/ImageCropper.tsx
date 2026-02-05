import React, { useState, useRef } from 'react';
import { Check, X, Maximize, Crop } from 'lucide-react';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const { theme } = useTheme();
  const [crop, setCrop] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        rect
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPos(e);
    setIsDrawing(true);
    setStartPos({ x, y });
    setCrop({ x, y, width: 0, height: 0 });
    // Don't prevent default on touch to allow scrolling if needed, 
    // but here we likely want to prevent scroll to draw
    if (!('touches' in e)) {
        e.preventDefault(); 
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !containerRef.current) return;
    // Prevent scrolling while drawing on touch
    if ('touches' in e) e.preventDefault();
    
    const { x, y, rect } = getPos(e);
    
    const curX = Math.max(0, Math.min(x, rect.width));
    const curY = Math.max(0, Math.min(y, rect.height));

    const newX = Math.min(startPos.x, curX);
    const newY = Math.min(startPos.y, curY);
    const newW = Math.abs(curX - startPos.x);
    const newH = Math.abs(curY - startPos.y);

    setCrop({ x: newX, y: newY, width: newW, height: newH });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleConfirm = () => {
    const img = imageRef.current;
    if (!img) return;

    // If no crop selected (or very small), return full image
    if (!crop || crop.width < 10 || crop.height < 10) {
       fetch(imageSrc).then(res => res.blob()).then(onConfirm);
       return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate scaling factor between displayed size and natural size
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    if (ctx) {
        ctx.drawImage(
            img,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );
        
        canvas.toBlob((blob) => {
            if (blob) onConfirm(blob);
        }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
       <div className="bg-white/5 p-1 rounded-2xl shadow-2xl max-w-full max-h-[80vh] flex flex-col relative border border-white/10">
          <div 
            ref={containerRef}
            className="relative overflow-hidden cursor-crosshair touch-none select-none rounded-xl"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
             <img 
               ref={imageRef} 
               src={imageSrc} 
               className="max-w-full max-h-[70vh] object-contain block pointer-events-none select-none" 
               alt="Crop Source"
               draggable={false}
             />
             
             {/* Dark overlay for unselected areas */}
             <div className="absolute inset-0 bg-black/60 pointer-events-none transition-opacity duration-300" />
             
             {/* Selected Area - "Cut out" effect */}
             {crop && crop.width > 0 && (
                <div 
                    className="absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none z-10"
                    style={{
                        left: crop.x,
                        top: crop.y,
                        width: crop.width,
                        height: crop.height,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                    }}
                >
                    <div className="absolute inset-0 border-2 border-white/80"></div>
                    {/* Corner Markers */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-white"></div>
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-white"></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-white"></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-white"></div>
                </div>
             )}
          </div>
       </div>

       <div className="mt-8 flex flex-wrap gap-4 justify-center items-center w-full max-w-2xl px-4">
            <Button variant="secondary" onClick={onCancel} className="!bg-gray-800 !text-gray-300 !border-gray-700 hover:!bg-gray-700">
                <X className="w-4 h-4 mr-2"/> Hủy bỏ
            </Button>
            
            <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>

            <Button onClick={() => setCrop(null)} className="!bg-blue-600 hover:!bg-blue-700 text-white">
                <Maximize className="w-4 h-4 mr-2"/> Lấy toàn bộ
            </Button>
            
            <Button onClick={handleConfirm} className={`!bg-${theme}-600 hover:!bg-${theme}-700 shadow-lg shadow-${theme}-500/30 text-white min-w-[140px]`}>
                {crop && crop.width > 10 ? (
                    <>
                        <Crop className="w-4 h-4 mr-2"/> Cắt & Xử lý
                    </>
                ) : (
                    <>
                        <Check className="w-4 h-4 mr-2"/> Xử lý toàn bộ
                    </>
                )}
            </Button>
       </div>
       <p className="text-white/50 mt-4 text-sm font-medium flex items-center gap-2">
           <Crop className="w-4 h-4" />
           Kéo chuột trên hình để chọn vùng cần chuyển đổi
       </p>
    </div>
  );
};
