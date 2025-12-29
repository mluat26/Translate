import { GoogleGenAI } from "@google/genai";

// Dịch vụ tạo Prompt string
export const generatePromptForWord = (input: string): string => {
  return `Bạn là trợ lý từ vựng tiếng Anh. Hãy phân tích từ/cụm từ: "${input}".

Yêu cầu output LÀM CHÍNH XÁC định dạng JSON (không markdown, không giải thích thêm) với các trường sau:
{
  "word": "Từ tiếng Anh chuẩn",
  "phonetic": "Phiên âm IPA",
  "meaning": "Nghĩa tiếng Việt ngắn gọn",
  "partOfSpeech": "Loại từ (Noun, Verb, Adjective, Adverb...)",
  "example": "Câu ví dụ tiếng Anh + (Dịch tiếng Việt)",
  "level": "Trình độ CEFR (chỉ ghi A1, A2, B1, B2, C1, hoặc C2)",
  "wordFamily": [
    { "word": "từ liên quan 1", "partOfSpeech": "loại từ", "meaning": "nghĩa" },
    { "word": "từ liên quan 2", "partOfSpeech": "loại từ", "meaning": "nghĩa" }
  ]
}
(Nếu không có wordFamily, trả về mảng rỗng).
Nếu từ nhập vào là tiếng Việt, hãy dịch sang tiếng Anh trước rồi phân tích.`;
};

export const generatePromptForList = (inputs: string[]): string => {
  const listStr = inputs.join(', ');
  return `Bạn là trợ lý từ vựng tiếng Anh. Hãy phân tích danh sách các từ sau: "${listStr}".

Yêu cầu output là một MẢNG JSON (JSON Array) chứa các object. KHÔNG trả về markdown, KHÔNG trả về object bao ngoài, chỉ trả về mảng [] thuần túy.

Cấu trúc mỗi phần tử:
{
  "word": "Từ tiếng Anh chuẩn",
  "phonetic": "Phiên âm IPA",
  "meaning": "Nghĩa tiếng Việt ngắn gọn",
  "partOfSpeech": "Loại từ (Noun, Verb, Adjective...)",
  "example": "Câu ví dụ tiếng Anh + (Dịch tiếng Việt)",
  "level": "Trình độ CEFR (chỉ ghi A1, A2, B1, B2, C1, hoặc C2)",
  "wordFamily": [
     { "word": "từ liên quan", "partOfSpeech": "loại từ", "meaning": "nghĩa" }
  ]
}`;
};

export const generateSuggestionPrompt = (topic: string, level: string, quantity: number): string => {
  return `Bạn là giáo viên tiếng Anh chuyên nghiệp. Hãy GỢI Ý cho tôi ${quantity} từ vựng hay/thông dụng về chủ đề "${topic}" ở trình độ ${level}.

QUAN TRỌNG: Output phải là một MẢNG JSON (JSON Array) chứa đúng ${quantity} phần tử. KHÔNG markdown, KHÔNG giải thích.

Cấu trúc bắt buộc cho mỗi từ:
{
  "word": "Từ tiếng Anh",
  "phonetic": "IPA",
  "meaning": "Nghĩa tiếng Việt",
  "partOfSpeech": "Loại từ",
  "example": "Ví dụ (Anh + Việt)",
  "level": "Ghi đúng trình độ ${level}",
  "wordFamily": []
}`;
};

export const parseAIResult = (jsonString: string): any => {
  try {
    // Cố gắng làm sạch chuỗi nếu AI trả về markdown code block
    let cleanJson = jsonString.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
    }
    
    return JSON.parse(cleanJson);
  } catch (e) {
    throw new Error("Không thể đọc định dạng JSON. Hãy chắc chắn bạn copy đúng phần code JSON.");
  }
};

// Hàm gọi API trực tiếp
export const fetchVocabFromGemini = async (apiKey: string, prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    // API trả về JSON string, ta trả về text để hàm parseAIResult xử lý tiếp
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};