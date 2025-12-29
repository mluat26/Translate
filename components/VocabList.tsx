import React from 'react';
import { Trash2, Volume2, FileText } from 'lucide-react';
import { VocabItem } from '../types';

interface VocabListProps {
  items: VocabItem[];
  onDelete: (id: string) => void;
}

const VocabList: React.FC<VocabListProps> = ({ items, onDelete }) => {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-lg">Chưa có từ vựng nào.</p>
        <p className="text-slate-400 text-sm">Hãy thêm từ mới để bắt đầu học tập!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{item.word}</h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                  {item.partOfSpeech}
                </span>
                <button 
                  onClick={() => speak(item.word)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-700 font-medium">{item.meaning}</p>
              <div className="pt-2 text-slate-600 text-sm border-l-2 border-indigo-200 pl-3 italic">
                {item.example}
              </div>
            </div>
            
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Xóa từ"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VocabList;