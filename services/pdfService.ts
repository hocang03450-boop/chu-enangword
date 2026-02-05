
import * as pdfjsLib from 'pdfjs-dist';

// Đồng bộ worker với bản esm.sh để tránh lỗi mismatch version
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.8.69/build/pdf.worker.mjs';

/**
 * Gets the total number of pages in a PDF file.
 */
export const getPdfPageCount = async (file: File): Promise<number> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  return pdf.numPages;
};

/**
 * Converts a File object (Image or PDF) to an HTMLImageElement or Canvas for processing.
 */
export const fileToCanvas = async (file: File, startPage: number = 1, endPage?: number): Promise<HTMLCanvasElement> => {
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  } else if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const actualEndPage = endPage && endPage <= pdf.numPages ? endPage : pdf.numPages;
    const actualStartPage = Math.max(1, Math.min(startPage, actualEndPage));
    const pageCountToRender = actualEndPage - actualStartPage + 1;

    let scale = 1.5;
    if (pageCountToRender > 10) scale = 1.0;

    const pagesInfo = [];
    let totalHeight = 0;
    let maxWidth = 0;

    for (let i = actualStartPage; i <= actualEndPage; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        pagesInfo.push({ page, viewport });
        totalHeight += viewport.height;
        if (viewport.width > maxWidth) maxWidth = viewport.width;
    }

    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = Math.min(totalHeight, 30000); 
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context missing");

    let currentY = 0;
    for (const info of pagesInfo) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = info.viewport.width;
        tempCanvas.height = info.viewport.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
            await info.page.render({
                canvasContext: tempCtx,
                viewport: info.viewport
            } as any).promise;
            ctx.drawImage(tempCanvas, 0, currentY);
        }
        info.page.cleanup(); 
        currentY += info.viewport.height;
    }

    return canvas;
  }
  throw new Error("Unsupported file type");
};

/**
 * Helper to get a Base64 string directly from a PDF file.
 */
export const pdfToImageBase64 = async (file: File): Promise<string> => {
  const canvas = await fileToCanvas(file); 
  const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
  return dataUrl.split(',')[1];
};
