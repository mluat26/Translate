export interface WordFamilyItem {
  word: string;
  partOfSpeech: string;
  meaning: string;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  level: string; // A1, A2, B1, B2, C1, C2
  wordFamily?: WordFamilyItem[]; // Optional list of related words
  topic?: string; // New: For "Folder" organization
  confidence?: number; // New: 0 (New), 1 (Forgot), 2 (Hazy), 3 (Known)
  lastReviewed?: string; // New: ISO Date string
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface RateLimitState {
  requestsToday: number;
  lastRequestTime: number; // timestamp
  requestTimestamps: number[]; // for minute-level throttling
  lastResetDate: string; // YYYY-MM-DD
}

export interface StorageStats {
  usedBytes: number;
  totalBytes: number; // approximate 5MB for localStorage
  usagePercent: number;
}