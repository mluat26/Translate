import React, { useState, useEffect } from 'react';
import { Volume2, RotateCw, ArrowLeft, ArrowRight, Layers, Shuffle } from 'lucide-react';
import { VocabItem } from '../types';

interface FlashcardModeProps {
  items: VocabItem[];
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyList, setStudyList] = useState<VocabItem[]>(items);

  // Update study list if items change
  useEffect(() => {
    setStudyList(items);
  }, [items]);

  const currentItem = studyList[currentIndex];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % studyList.length);
    }, 200);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + studyList.length) % studyList.length);
    }, 200);
  };

  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    const shuffled = [...studyList].sort(() => Math.random() - 0.5);
    setStudyList(shuffled);
    setCurrentIndex(0);
  };

  const speak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/40 shadow-sm text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <Layers className="w-10 h-10 text-indigo-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">Chưa có từ vựng</h3>
        <p className="text-slate-500 mt-2">Hãy thêm từ mới để bắt đầu học Flashcard nhé!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      
      {/* Progress & Controls */}
      <div className="w-full flex items-center justify-between mb-6 px-4">
        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {studyList.length}
        </span>
        <button 
          onClick={handleShuffle}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Xáo trộn
        </button>
      </div>

      {/* Card Container - Perspective */}
      <div 
        className="group w-full max-w-md h-[400px] [perspective:1000px] cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Card Inner - Transform */}
        <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* Front Face */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 p-8 flex flex-col items-center justify-center [backface-visibility:hidden]">
             <div className="flex flex-col items-center gap-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    currentItem.level?.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                    currentItem.level?.startsWith('B') ? 'bg-amber-100 text-amber-700' :
                    currentItem.level?.startsWith('C') ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                }`}>
                    {currentItem.level || 'Unknown'}
                </span>
                
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 text-center tracking-tight mt-4">
                    {currentItem.word}
                </h2>
                
                <div className="flex items-center gap-3 mt-2">
                    <span className="font-serif text-xl text-slate-500">{currentItem.phonetic}</span>
                    <button 
                        onClick={(e) => speak(e, currentItem.word)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 hover:scale-110 transition-all"
                    >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="absolute bottom-8 text-slate-400 text-xs font-medium uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <RotateCw className="w-3 h-3" />
                    Chạm để lật
                </div>
             </div>
          </div>

          {/* Back Face */}
          <div className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
             <div className="text-center w-full">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-6 backdrop-blur-sm">
                    {currentItem.partOfSpeech}
                </span>

                <h3 className="text-2xl font-bold mb-4 leading-relaxed">
                    {currentItem.meaning}
                </h3>

                <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6"></div>

                <p className="text-lg italic text-indigo-100 font-serif leading-relaxed px-4">
                    "{currentItem.example}"
                </p>
             </div>
          </div>

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-6 mt-10">
        <button 
            onClick={handlePrev}
            className="p-4 bg-white text-slate-600 rounded-full shadow-lg shadow-slate-200/50 hover:bg-slate-50 hover:text-indigo-600 hover:-translate-y-1 transition-all active:scale-95"
        >
            <ArrowLeft className="w-6 h-6" />
        </button>
        
        <button 
            onClick={handleNext}
            className="p-4 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
        >
            <ArrowRight className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default FlashcardMode;