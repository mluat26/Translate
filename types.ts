export interface VocabItem {
  id: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AIGeneratedVocab {
  meaning: string;
  partOfSpeech: string;
  example: string;
}