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
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AIGeneratedVocab {
  word: string;
  phonetic: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  level: string;
  wordFamily?: WordFamilyItem[];
}