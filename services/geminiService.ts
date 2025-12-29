import { GoogleGenAI } from "@google/genai";
import { RateLimitState } from "../types";

// --- Rate Limiting Logic ---
const MAX_REQUESTS_PER_DAY = 20;
const MAX_REQUESTS_PER_MINUTE = 5;

const getRateLimitState = (): RateLimitState => {
  const saved = localStorage.getItem('geminiRateLimit');
  if (saved) return JSON.parse(saved);
  return {
    requestsToday: 0,
    lastRequestTime: 0,
    requestTimestamps: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  };
};

const saveRateLimitState = (state: RateLimitState) => {
  localStorage.setItem('geminiRateLimit', JSON.stringify(state));
};

export const checkRateLimit = (): { allowed: boolean; message?: string } => {
  const state = getRateLimitState();
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();

  // Reset daily count if new day
  if (state.lastResetDate !== today) {
    state.requestsToday = 0;
    state.lastResetDate = today;
    state.requestTimestamps = [];
    saveRateLimitState(state);
  }

  // Check Daily Limit
  if (state.requestsToday >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, message: `Bạn đã dùng hết ${MAX_REQUESTS_PER_DAY} lượt yêu cầu hôm nay. Hãy quay lại vào ngày mai hoặc nhập tay.` };
  }

  // Check Minute Limit (Sliding window)
  const oneMinuteAgo = now - 60000;
  const recentRequests = state.requestTimestamps.filter(t => t > oneMinuteAgo);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
     return { allowed: false, message: "Hệ thống đang bận (quá 5 yêu cầu/phút). Vui lòng đợi 1 chút." };
  }

  return { allowed: true };
};

export const incrementRequestCount = () => {
    const state = getRateLimitState();
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    if (state.lastResetDate !== today) {
        state.requestsToday = 0;
        state.lastResetDate = today;
        state.requestTimestamps = [];
    }

    state.requestsToday += 1;
    state.lastRequestTime = now;
    state.requestTimestamps.push(now);
    // Cleanup old timestamps
    state.requestTimestamps = state.requestTimestamps.filter(t => t > now - 60000);

    saveRateLimitState(state);
};

export const getQuotaStats = () => {
    const state = getRateLimitState();
    const today = new Date().toISOString().split('T')[0];
    // Reset visual logic for display if date changed but no request made yet
    if (state.lastResetDate !== today) {
        return { used: 0, total: MAX_REQUESTS_PER_DAY };
    }
    return { used: state.requestsToday, total: MAX_REQUESTS_PER_DAY };
}

// --- Prompts ---

export const generatePromptForWord = (input: string): string => {
  return `Bạn là trợ lý từ vựng tiếng Anh. Hãy phân tích từ/cụm từ: "${input}".

Yêu cầu output LÀM CHÍNH XÁC định dạng JSON (không markdown):
{
  "word": "Từ tiếng Anh chuẩn",
  "phonetic": "Phiên âm IPA",
  "meaning": "Nghĩa tiếng Việt ngắn gọn",
  "partOfSpeech": "Loại từ (Noun, Verb...)",
  "example": "Câu ví dụ tiếng Anh + (Dịch tiếng Việt)",
  "level": "CEFR (A1-C2)",
  "wordFamily": [
    { "word": "related word 1", "partOfSpeech": "type", "meaning": "meaning" }
  ]
}
BẮT BUỘC phải có trường "wordFamily" (ít nhất 1-2 từ liên quan nếu có, nếu không thì mảng rỗng).`;
};

export const generatePromptForList = (inputs: string[]): string => {
  const listStr = inputs.join(', ');
  return `Phân tích danh sách từ: "${listStr}".

Output: MẢNG JSON []. KHÔNG markdown.
Mỗi phần tử:
{
  "word": "English Word",
  "phonetic": "IPA",
  "meaning": "Vietnamese meaning",
  "partOfSpeech": "Type",
  "example": "Example (EN+VN)",
  "level": "CEFR",
  "wordFamily": [
     { "word": "related", "partOfSpeech": "type", "meaning": "meaning" }
  ]
}
QUAN TRỌNG: Cố gắng tìm ít nhất 1 từ cho "wordFamily" với mỗi từ vựng.`;
};

export const generateSuggestionPrompt = (topic: string, level: string, quantity: number): string => {
  return `Gợi ý ${quantity} từ vựng về chủ đề "${topic}" trình độ ${level}.

Output: MẢNG JSON []. KHÔNG markdown.
Mỗi từ phải có đầy đủ:
{
  "word": "...",
  "phonetic": "...",
  "meaning": "...",
  "partOfSpeech": "...",
  "example": "...",
  "level": "${level}",
  "wordFamily": [
     { "word": "...", "partOfSpeech": "...", "meaning": "..." }
  ]
}
LƯU Ý: Trường "wordFamily" là BẮT BUỘC (tìm các từ cùng gốc).`;
};

export const parseAIResult = (jsonString: string): any => {
  try {
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

export const fetchVocabFromGemini = async (apiKey: string, prompt: string) => {
  try {
    // Client-side rate limit check before calling
    const limitCheck = checkRateLimit();
    if (!limitCheck.allowed) {
        throw new Error(limitCheck.message);
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    incrementRequestCount();
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};