
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { pdfToImageBase64 } from "./pdfService";

// Định nghĩa schema cho phản hồi JSON
const conversionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    html_content: {
      type: Type.STRING,
      description: "Nội dung tài liệu đã chuyển sang HTML.",
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
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error("LỖI CẤU HÌNH: API Key chưa được thiết lập trên Vercel. Vui lòng thêm API_KEY trong phần Environment Variables của Project Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash'; 

  try {
    const filePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          filePart,
          {
            text: `Bạn là chuyên gia OCR. Hãy trích xuất văn bản từ hình ảnh và trả về định dạng HTML sạch (chỉ dùng thẻ p, table, b, i, h1, h2). Giữ nguyên cấu trúc bảng nếu có.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: conversionSchema,
        temperature: 0.1 
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Không nhận được phản hồi từ AI");

    const parsed = JSON.parse(jsonText.trim());
    return {
      html: parsed.html_content
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("403")) {
        throw new Error("API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình trên Vercel.");
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi kết nối với Gemini AI.");
  }
};

export const generateImageFromText = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Thiếu API Key để tạo ảnh.");

  const ai = new GoogleGenAI({ apiKey });
  
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
