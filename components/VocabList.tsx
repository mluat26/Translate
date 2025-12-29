import React, { useState } from 'react';
import { Trash2, Volume2, Layers, Quote, Book, Type, ChevronDown, ChevronUp } from 'lucide-react';
import { VocabItem } from '../types';

interface VocabListProps {
  items: VocabItem[];
  onDelete: (id: string) => void;
}

const VocabCard: React.FC<{ item: VocabItem; onDelete: (id: string) => void }> = ({ item, onDelete }) => {
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getLevelColor = (level?: string) => {
    if (!level) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (level.startsWith('A')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (level.startsWith('B')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (level.startsWith('C')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getPosColor = (pos?: string) => {
    const p = pos?.toLowerCase() || '';
    if (p.includes('noun') || p.includes('danh')) return 'bg-sky-100 text-sky-700 border-sky-200';
    if (p.includes('verb') || p.includes('động')) return 'bg-lime-100 text-lime-700 border-lime-200';
    if (p.includes('adj') || p.includes('tính')) return 'bg-pink-100 text-pink-700 border-pink-200';
    if (p.includes('adv') || p.includes('trạng')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group flex flex-col h-full">
      
      {/* Header Section */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
             <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight truncate" title={item.word}>{item.word}</h3>
             {item.phonetic && (
                <span className="font-serif text-slate-500 text-sm bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate max-w-full">
                {item.phonetic}
                </span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
             <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getLevelColor(item.level)}`}>
               {item.level || 'N/A'}
             </span>
             <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getPosColor(item.partOfSpeech)}`}>
               {item.partOfSpeech || 'Other'}
             </span>
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
             <button 
                onClick={() => speak(item.word)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Xóa từ"
              >
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 w-full mb-4"></div>

      {/* Content Section */}
      <div className="space-y-4 flex-1">
        
        {/* Meaning */}
        <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-indigo-50 rounded text-indigo-500 flex-shrink-0">
                <Book className="w-4 h-4" />
            </div>
            <div>
                 <p className="text-base font-semibold text-slate-700 leading-snug line-clamp-3">{item.meaning}</p>
                 <span className="text-xs text-slate-400 font-medium">Định nghĩa</span>
            </div>
        </div>

        {/* Example */}
        {item.example && (
            <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-amber-50 rounded text-amber-500 flex-shrink-0">
                    <Quote className="w-4 h-4 fill-amber-100" />
                </div>
                <div>
                     <p className="text-slate-600 text-sm italic leading-relaxed line-clamp-4">"{item.example}"</p>
                     <span className="text-xs text-slate-400 font-medium">Ví dụ</span>
                </div>
            </div>
        )}
      </div>

       {/* Footer: Word Family Accordion */}
       {item.wordFamily && item.wordFamily.length > 0 && (
            <div className="pt-4 mt-auto">
                <button 
                    onClick={() => setIsFamilyOpen(!isFamilyOpen)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors w-full p-2 hover:bg-slate-50 rounded-lg group/btn border border-transparent hover:border-slate-100"
                >
                    <div className="p-1 bg-slate-100 rounded text-slate-500 group-hover/btn:bg-indigo-100 group-hover/btn:text-indigo-500 transition-colors">
                        <Type className="w-3.5 h-3.5" />
                    </div>
                    Gia đình từ ({item.wordFamily.length})
                    <div className="flex-1 h-px bg-slate-100 mx-2"></div>
                    {isFamilyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isFamilyOpen && (
                    <div className="mt-2 ml-2 pl-4 border-l-2 border-slate-100 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        {item.wordFamily.map((familyItem, idx) => (
                            <div key={idx} className="text-sm">
                                <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                                    <span className="font-bold text-slate-700">{familyItem.word}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${getPosColor(familyItem.partOfSpeech)}`}>
                                        {familyItem.partOfSpeech}
                                    </span>
                                </div>
                                <div className="text-slate-500 text-xs line-clamp-1" title={familyItem.meaning}>{familyItem.meaning}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

const VocabList: React.FC<VocabListProps> = ({ items, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Layers className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-slate-800 text-lg font-bold mb-1">Không tìm thấy từ vựng</h3>
        <p className="text-slate-500 text-sm">Thử thay đổi bộ lọc hoặc thêm từ mới.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
      {items.map((item) => (
        <VocabCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default VocabList;