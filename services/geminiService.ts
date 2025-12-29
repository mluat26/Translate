import { GoogleGenAI, Type } from "@google/genai";
import { AIGeneratedVocab } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enrichVocabulary = async (word: string): Promise<AIGeneratedVocab> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy đóng vai một từ điển tiếng Anh - Tiếng Việt. Cung cấp thông tin chi tiết cho từ vựng: "${word}".
      
      Yêu cầu đầu ra:
      1. meaning: Nghĩa tiếng Việt ngắn gọn, súc tích.
      2. partOfSpeech: Loại từ (Danh từ, Động từ, Tính từ, v.v.).
      3. example: Một câu ví dụ tiếng Anh có chứa từ đó và phần dịch tiếng Việt trong ngoặc đơn.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            example: { type: Type.STRING },
          },
          required: ["meaning", "partOfSpeech", "example"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as AIGeneratedVocab;
  } catch (error) {
    console.error("Error enriching vocabulary:", error);
    throw error;
  }
};