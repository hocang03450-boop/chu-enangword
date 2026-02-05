
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { pdfToImageBase64 } from "./pdfService";

// Define the response schema for structured output
const conversionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    html_content: {
      type: Type.STRING,
      description: "The full document content converted to HTML. Use <table> for tables. Simple Math/Chem should be Unicode text. Complex reaction schemes must be LaTeX wrapped in $. Do not include image placeholders.",
    }
  },
  required: ["html_content"]
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  if (file.type === 'application/pdf') {
    const base64Data = await pdfToImageBase64(file);
    return {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export interface ConversionResult {
  html: string;
}

export const extractContentWithSmartCrop = async (file: File): Promise<ConversionResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-2.5-flash'; 

  try {
    const filePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          filePart,
          {
            text: `Bạn là chuyên gia OCR, Toán học và Hóa học. Nhiệm vụ: Chuyển đổi hình ảnh tài liệu thành văn bản định dạng HTML để xuất sang Word.
            
            QUY TẮC XỬ LÝ QUAN TRỌNG:
            
            1. VĂN BẢN (TEXT/UNICODE):
               - Trích xuất TOÀN BỘ văn bản chính xác tuyệt đối. Giữ nguyên xuống dòng và định dạng đoạn văn.
               - Toán/Hóa đơn giản: Dùng ký tự UNICODE (vd: H₂O, CO₂, x², π, →).
            
            2. CÔNG THỨC PHỨC TẠP (LATEX):
               - BẮT BUỘC dùng LaTeX kẹp giữa dấu $ cho công thức phức tạp (phân số, tích phân, căn thức lớn, sơ đồ phản ứng, ma trận).
               - Ví dụ: $\\frac{a}{b}$, $\\int x dx$, $A \\xrightarrow{t^o} B$.
            
            3. BẢNG BIỂU (TABLES):
               - Tái tạo bảng bằng HTML <table> với border="1". Giữ đúng cấu trúc hàng và cột.
            
            4. HÌNH ẢNH & BIỂU ĐỒ:
               - Nếu gặp hình ảnh/biểu đồ không thể chuyển thành text, hãy chèn dòng thông báo:
                 "<p style='color:red; font-style:italic; text-align:center;'>[Vị trí Hình ảnh/Biểu đồ - Hãy dùng nút 'Cắt & Chèn ảnh' để thêm vào đây]</p>"
            
            5. OUTPUT:
               - Chỉ trả về JSON chứa HTML sạch theo đúng schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: conversionSchema,
        temperature: 0.1 
      }
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Không nhận được phản hồi từ AI");

    const parsed = JSON.parse(jsonText.trim());
    return {
      html: parsed.html_content
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi xử lý tài liệu.");
  }
};

export const generateImageFromText = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
       for (const part of response.candidates[0].content.parts) {
         if (part.inlineData) {
           return `data:image/png;base64,${part.inlineData.data}`;
         }
       }
    }
    throw new Error("Không tìm thấy hình ảnh trong kết quả.");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw new Error(error.message || "Lỗi khi tạo hình ảnh.");
  }
};
