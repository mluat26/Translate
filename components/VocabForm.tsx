import React, { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { VocabItem, LoadingState } from '../types';
import { enrichVocabulary } from '../services/geminiService';

interface VocabFormProps {
  onAdd: (item: Omit<VocabItem, 'id'>) => void;
}

const VocabForm: React.FC<VocabFormProps> = ({ onAdd }) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [example, setExample] = useState('');
  const [aiState, setAiState] = useState<LoadingState>(LoadingState.IDLE);

  const handleAutoFill = async () => {
    if (!word.trim()) return;
    
    setAiState(LoadingState.LOADING);
    try {
      const data = await enrichVocabulary(word);
      setMeaning(data.meaning);
      setPartOfSpeech(data.partOfSpeech);
      setExample(data.example);
      setAiState(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setAiState(LoadingState.ERROR);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    onAdd({
      word,
      meaning,
      partOfSpeech,
      example
    });

    // Reset form
    setWord('');
    setMeaning('');
    setPartOfSpeech('');
    setExample('');
    setAiState(LoadingState.IDLE);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
        <Plus className="w-5 h-5 text-indigo-600" />
        Thêm từ mới
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Từ vựng</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ví dụ: Ephemeral"
                required
              />
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={!word.trim() || aiState === LoadingState.LOADING}
                className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Tự động điền với AI"
              >
                {aiState === LoadingState.LOADING ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </button>
            </div>
            {aiState === LoadingState.ERROR && (
              <p className="text-xs text-red-500 mt-1">Không thể lấy dữ liệu AI. Vui lòng thử lại.</p>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại từ</label>
            <input
              type="text"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Danh từ, Động từ..."
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nghĩa tiếng Việt</label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Nghĩa của từ..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ví dụ</label>
          <textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            placeholder="Câu ví dụ minh họa..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 font-medium transition-all"
          >
            Lưu từ vựng
          </button>
        </div>
      </form>
    </div>
  );
};

export default VocabForm;