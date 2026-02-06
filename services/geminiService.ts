
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
  // esbuild sẽ thay thế chuỗi này bằng giá trị thực tế lúc build
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error("LỖI CẤU HÌNH: Ứng dụng đã được build NHƯNG KHÔNG tìm thấy API_KEY. \n\nHướng dẫn: \n1. Đảm bảo bạn đã thêm API_KEY vào Settings của Vercel.\n2. BẠN PHẢI VÀO TAB 'DEPLOYMENTS' VÀ NHẤN 'REDEPLOY' thì Vercel mới nạp Key vào bản build mới được.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview'; 

  try {
    const filePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          filePart,
          {
            text: `Bạn là chuyên gia OCR. Hãy trích xuất văn bản từ hình ảnh và trả về định dạng HTML sạch (chỉ dùng thẻ p, table, b, i, h1, h2). Giữ nguyên cấu trúc bảng nếu có. Nếu có công thức toán học, hãy giữ nguyên văn bản.`
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
        throw new Error("API Key của bạn không hợp lệ (Sai hoặc chưa bật Billing). Kiểm tra lại tại ai.google.dev");
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi kết nối với Gemini AI.");
  }
};
