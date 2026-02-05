
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ResultSection } from './components/ResultSection';
import { Button } from './components/Button';
import { PageSelector } from './components/PageSelector';
import { ImageCropper } from './components/ImageCropper';
import { FileData, Status } from './types';
import { extractContentWithSmartCrop, generateImageFromText } from './services/geminiService';
import { fileToCanvas, getPdfPageCount } from './services/pdfService';
import { ArrowRight, AlertCircle, Crop, PlusCircle, Key } from 'lucide-react';
import { useTheme, Theme } from './contexts/ThemeContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'convert' | 'generate'>('convert');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [fullImageBase64, setFullImageBase64] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropIntent, setCropIntent] = useState<'process' | 'insert'>('process');
  const [totalPages, setTotalPages] = useState(0);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [genPrompt, setGenPrompt] = useState('');
  const [genStatus, setGenStatus] = useState<Status>(Status.IDLE);
  const [genImage, setGenImage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const apiKeyMissing = !process.env.API_KEY || process.env.API_KEY === "";

  const handleFileSelect = async (data: FileData | null) => {
    if (!data) {
      setFileData(null);
      setResult(null);
      return;
    }
    setFileData(null);
    setResult(null);
    setError(null);
    setFullImageBase64(undefined);
    setPendingPdfFile(null);

    try {
      if (data.type === 'pdf') {
        const pages = await getPdfPageCount(data.file);
        if (pages > 1) {
          setTotalPages(pages);
          setPendingPdfFile(data.file);
          setShowPageSelector(true);
          return;
        }
        await processFile(data.file, 'pdf', 1, 1);
      } else {
        await processFile(data.file, 'image');
      }
    } catch (err: any) {
      setError("Không thể đọc file. " + err.message);
    }
  };

  const handlePageConfirm = (start: number, end: number) => {
    setShowPageSelector(false);
    if (pendingPdfFile) processFile(pendingPdfFile, 'pdf', start, end);
  };

  const processFile = async (file: File, type: 'pdf' | 'image', startPage?: number, endPage?: number) => {
    setIsPreparingPreview(true);
    setProgressMsg(type === 'pdf' ? `Đang xử lý trang ${startPage || 1}...` : "Đang chuẩn bị ảnh...");
    try {
        let processedFile: File;
        let previewUrl: string;
        if (type === 'pdf') {
            const canvas = await fileToCanvas(file, startPage, endPage);
            await new Promise<void>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        processedFile = new File([blob], "processed.jpg", { type: 'image/jpeg' });
                        previewUrl = URL.createObjectURL(blob);
                        setFileData({ file: processedFile, previewUrl, type: 'image' });
                    }
                    resolve();
                }, 'image/jpeg', 0.90);
            });
        } else {
            processedFile = file;
            previewUrl = URL.createObjectURL(file);
            setFileData({ file: processedFile, previewUrl, type: 'image' });
        }
    } catch (err: any) {
        setError("Lỗi xử lý: " + err.message);
    } finally {
        setIsPreparingPreview(false);
    }
  };

  const handleCropConfirm = (croppedBlob: Blob) => {
      if (cropIntent === 'process') {
          const croppedFile = new File([croppedBlob], "cropped.jpg", { type: 'image/jpeg' });
          setFileData({ file: croppedFile, previewUrl: URL.createObjectURL(croppedBlob), type: 'image' });
      } else {
          const reader = new FileReader();
          reader.readAsDataURL(croppedBlob);
          reader.onloadend = () => {
              const imgTag = `<div style="text-align:center;margin:1.5em 0;"><img src="${reader.result}" style="max-width:100%;border-radius:8px;"/></div>`;
              setResult(prev => prev ? prev + imgTag : imgTag);
          };
      }
      setIsCropping(false);
  };

  const handleConvert = async () => {
    if (!fileData) return;
    setStatus(Status.PROCESSING);
    setError(null);
    try {
      setProgressMsg("Gemini 2.5 Flash đang phân tích...");
      const aiResponse = await extractContentWithSmartCrop(fileData.file);
      const reader = new FileReader();
      reader.readAsDataURL(fileData.file);
      reader.onloadend = () => setFullImageBase64(reader.result as string);
      setResult(aiResponse.html);
      setStatus(Status.SUCCESS);
    } catch (err: any) {
      setError(err.message);
      setStatus(Status.ERROR);
    }
  };

  const colors: { id: Theme; label: string; bg: string; }[] = [
    { id: 'red', label: 'Mặc định', bg: 'bg-red-500' },
    { id: 'teal', label: 'Xanh Teal', bg: 'bg-teal-500' },
    { id: 'blue', label: 'Xanh dương', bg: 'bg-blue-500' },
    { id: 'amber', label: 'Vàng đậm', bg: 'bg-amber-500' },
    { id: 'purple', label: 'Tím Huế', bg: 'bg-purple-500' },
    { id: 'lime', label: 'Vàng xanh', bg: 'bg-lime-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />
      {showPageSelector && <PageSelector totalPages={totalPages} onConfirm={handlePageConfirm} onCancel={() => setShowPageSelector(false)} />}
      {isCropping && fileData?.previewUrl && <ImageCropper imageSrc={fileData.previewUrl} onConfirm={handleCropConfirm} onCancel={() => setIsCropping(false)} />}

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {apiKeyMissing && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <div className="flex items-center gap-3 text-red-700">
              <Key className="w-5 h-5" />
              <p className="font-bold text-sm">Chưa cấu hình API Key. Vui lòng kiểm tra lại môi trường.</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-white/50 p-1 rounded-xl border border-gray-200 shadow-sm backdrop-blur-sm">
            <button onClick={() => setActiveTab('convert')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'convert' ? `bg-${theme}-600 text-white shadow-md` : 'text-gray-600'}`}>Chuyển đổi Tài liệu</button>
            <button onClick={() => setActiveTab('generate')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'generate' ? `bg-${theme}-600 text-white shadow-md` : 'text-gray-600'}`}>Tạo Hình ảnh (AI)</button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Màu sắc:</span>
            {colors.map((c) => (
              <button key={c.id} onClick={() => setTheme(c.id)} className={`w-6 h-6 rounded-full ${c.bg} ring-2 ${theme === c.id ? 'ring-offset-2 ring-gray-400' : 'ring-transparent'}`} title={c.label} />
            ))}
          </div>
        </div>

        {activeTab === 'convert' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><span className={`flex items-center justify-center w-8 h-8 rounded-full bg-${theme}-100 text-${theme}-700 text-sm font-bold`}>1</span>Tải lên</h2>
              {isPreparingPreview ? <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"><div className={`w-10 h-10 border-4 border-${theme}-200 border-t-${theme}-600 rounded-full animate-spin mb-3`}></div><p className="text-sm">{progressMsg}</p></div> : <FileUpload onFileSelect={handleFileSelect} selectedFile={fileData} disabled={status === Status.PROCESSING} />}
              {fileData && status !== Status.SUCCESS && !isPreparingPreview && <div className="flex gap-2"><Button onClick={handleConvert} isLoading={status === Status.PROCESSING} className="flex-grow text-lg shadow-lg">Bắt đầu xử lý (2.5 Flash)</Button><Button variant="secondary" onClick={() => { setCropIntent('process'); setIsCropping(true); }} disabled={status === Status.PROCESSING}><Crop className="w-5 h-5" /></Button></div>}
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm"><AlertCircle className="w-4 h-4 mt-0.5" />{error}</div>}
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><span className={`flex items-center justify-center w-8 h-8 rounded-full bg-${theme}-100 text-${theme}-700 text-sm font-bold`}>2</span>Kết quả</h2>
                {fileData && <Button variant="outline" className="text-xs" onClick={() => { setCropIntent('insert'); setIsCropping(true); }}><PlusCircle className="w-4 h-4 mr-1" />Cắt & Chèn ảnh</Button>}
              </div>
              {result ? <ResultSection content={result} fileData={fileData} originalImageBase64={fullImageBase64} /> : <div className="flex-grow min-h-[400px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-8 text-center">{status === Status.PROCESSING ? <div className="flex flex-col items-center gap-3 animate-pulse"><div className={`w-12 h-12 border-4 border-${theme}-200 border-t-${theme}-600 rounded-full animate-spin`}></div><p className={`text-${theme}-600 font-medium`}>{progressMsg}</p></div> : <><ArrowRight className="w-12 h-12 mb-4 opacity-20" /><p>Kết quả Word sẽ xuất hiện ở đây</p></>}</div>}
            </div>
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <textarea value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} placeholder="Mô tả hình ảnh muốn tạo..." className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none min-h-[100px]" />
              <div className="flex justify-end"><Button onClick={async () => { setGenStatus(Status.PROCESSING); try { const img = await generateImageFromText(genPrompt); setGenImage(img); setGenStatus(Status.SUCCESS); } catch (e: any) { setGenError(e.message); setGenStatus(Status.ERROR); } }} isLoading={genStatus === Status.PROCESSING} disabled={!genPrompt.trim()} className="px-6">Tạo ảnh với Gemini 2.5</Button></div>
            </div>
            {(genStatus === Status.PROCESSING || genImage || genError) && <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 min-h-[300px] flex flex-col items-center justify-center p-8">{genStatus === Status.PROCESSING ? <div className="animate-spin w-10 h-10 border-4 border-t-blue-600 rounded-full"></div> : genError ? <p className="text-red-500">{genError}</p> : genImage && <img src={genImage} className="max-w-full shadow-lg rounded-lg" />}</div>}
          </div>
        )}
      </main>
      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100 mt-auto">© 2025 Thầy Hồ Cang - THPT Chu Văn An | Powered by Gemini 2.5 Flash</footer>
    </div>
  );
};

export default App;
