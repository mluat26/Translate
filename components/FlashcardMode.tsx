import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, Shuffle, Check, HelpCircle, XCircle, Settings2, Filter, X } from 'lucide-react';
import { VocabItem } from '../types';

interface FlashcardModeProps {
  items: VocabItem[];
  onUpdateConfidence?: (id: string, level: number) => void;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ items, onUpdateConfidence }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Filtering Logic
  const [studyList, setStudyList] = useState<VocabItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Feedback animation state
  const [feedback, setFeedback] = useState<number | null>(null);
  
  // Filter States
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterConfidence, setFilterConfidence] = useState('ALL'); 

  useEffect(() => {
    applyFilters();
  }, [items, filterTopic, filterLevel, filterConfidence]);

  const applyFilters = () => {
      let filtered = [...items];

      if (filterTopic !== 'ALL') {
          filtered = filtered.filter(i => i.topic === filterTopic);
      }
      if (filterLevel !== 'ALL') {
          filtered = filtered.filter(i => i.level?.startsWith(filterLevel));
      }
      if (filterConfidence !== 'ALL') {
          const conf = parseInt(filterConfidence);
          filtered = filtered.filter(i => (i.confidence || 0) === conf);
      }

      setStudyList(filtered);
      setCurrentIndex(0);
      setIsFlipped(false);
  };

  const uniqueTopics = Array.from(new Set(items.map(i => i.topic).filter(Boolean)));
  const currentItem = studyList[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % studyList.length);
    }, 200);
  }, [studyList.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + studyList.length) % studyList.length);
    }, 200);
  }, [studyList.length]);

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...studyList].sort(() => Math.random() - 0.5);
    setStudyList(shuffled);
    setCurrentIndex(0);
  };

  const handleConfidence = useCallback((level: number) => {
      if (currentItem && onUpdateConfidence) {
          onUpdateConfidence(currentItem.id, level);
          
          // Show visual feedback briefly
          setFeedback(level);
          setTimeout(() => setFeedback(null), 800);

          handleNext();
      }
  }, [currentItem, onUpdateConfidence, handleNext]);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Ignore if user is typing in an input
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

          switch(e.key) {
              case ' ': // Space to flip
                  e.preventDefault();
                  setIsFlipped(prev => !prev);
                  break;
              case 'ArrowRight':
                  handleNext();
                  break;
              case 'ArrowLeft':
                  handlePrev();
                  break;
              case '1':
                  handleConfidence(1);
                  break;
              case '2':
                  handleConfidence(2);
                  break;
              case '3':
                  handleConfidence(3);
                  break;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfidence, handleNext, handlePrev]);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/40 shadow-sm text-center">
        <Filter className="w-12 h-12 text-blue-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Chưa có từ vựng</h3>
        <p className="text-slate-500 mt-2">Hãy thêm từ mới để bắt đầu học Flashcard nhé!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] relative">
      
      {/* Visual Feedback Overlay */}
      {feedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in fade-in duration-300 pointer-events-none">
              <div className={`p-6 rounded-full shadow-2xl flex items-center justify-center ${
                  feedback === 1 ? 'bg-rose-500 text-white' : 
                  feedback === 2 ? 'bg-amber-500 text-white' : 
                  'bg-emerald-500 text-white'
              }`}>
                  {feedback === 1 && <XCircle className="w-12 h-12" />}
                  {feedback === 2 && <HelpCircle className="w-12 h-12" />}
                  {feedback === 3 && <Check className="w-12 h-12" />}
              </div>
          </div>
      )}

      {/* Main Toolbar */}
      <div className="w-full flex justify-between items-center mb-6 px-4">
          <button 
             onClick={() => setShowFilters(true)}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                 filterTopic !== 'ALL' || filterLevel !== 'ALL' || filterConfidence !== 'ALL' 
                 ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                 : 'bg-white text-slate-600 border-slate-200'
             }`}
          >
              <Settings2 className="w-4 h-4" />
              Tùy chọn học
          </button>
          
          <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {studyList.length > 0 ? currentIndex + 1 : 0} / {studyList.length}
              </span>
              <button onClick={handleShuffle} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors" title="Xáo trộn">
                  <Shuffle className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* FILTER POPUP (Activity View Style) */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowFilters(false)}></div>
            
            <div className="relative bg-white w-full max-w-sm rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 md:zoom-in-95 pb-6 md:pb-0">
                
                {/* Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={() => setShowFilters(false)}>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                </div>

                <div className="p-6 pt-2 md:pt-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             <Filter className="w-5 h-5 text-blue-600" />
                             Bộ lọc thẻ
                        </h3>
                        {/* Clear Filter Button */}
                         <button 
                            onClick={() => {setFilterTopic('ALL'); setFilterLevel('ALL'); setFilterConfidence('ALL'); setShowFilters(false);}}
                            className="text-xs font-bold text-blue-500 hover:text-blue-700 hover:underline"
                         >
                            Đặt lại
                         </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Chủ đề</label>
                            <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="w-full text-sm p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700">
                                <option value="ALL">Tất cả chủ đề</option>
                                {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Level</label>
                            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full text-sm p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700">
                                <option value="ALL">Tất cả Level</option>
                                <option value="A">A1 - A2</option>
                                <option value="B">B1 - B2</option>
                                <option value="C">C1 - C2</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Trạng thái</label>
                            <select value={filterConfidence} onChange={(e) => setFilterConfidence(e.target.value)} className="w-full text-sm p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-700">
                                <option value="ALL">Tất cả</option>
                                <option value="0">Chưa học (New)</option>
                                <option value="1">Chưa thuộc</option>
                                <option value="2">Hơi nhớ</option>
                                <option value="3">Đã thuộc</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => setShowFilters(false)}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold mt-4 shadow-lg shadow-slate-300 active:scale-95 transition-all"
                        >
                            Áp dụng ({studyList.length} thẻ)
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {studyList.length === 0 ? (
          <div className="text-center py-10">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">Không tìm thấy từ nào phù hợp bộ lọc.</p>
              <button onClick={() => {setFilterTopic('ALL'); setFilterLevel('ALL'); setFilterConfidence('ALL')}} className="mt-4 text-blue-600 text-sm font-bold hover:underline">
                  Xóa bộ lọc
              </button>
          </div>
      ) : (
        <>
            {/* Card Container */}
            <div 
                className="group w-full max-w-md h-[420px] [perspective:1000px] cursor-pointer relative z-10"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Card Inner */}
                <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                
                {/* Front Face */}
                <div className="absolute w-full h-full bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-white/60 p-8 flex flex-col items-center justify-between [backface-visibility:hidden]">
                    <div className="w-full flex justify-between items-start">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            currentItem.level?.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                            currentItem.level?.startsWith('B') ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                            {currentItem.level || 'N/A'}
                        </span>
                        {currentItem.topic && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                {currentItem.topic}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 text-center tracking-tight">
                            {currentItem.word}
                        </h2>
                        
                        <div className="flex items-center gap-3">
                            <span className="font-serif text-xl text-slate-500">{currentItem.phonetic}</span>
                        </div>
                    </div>

                    <div className="text-slate-400 text-xs font-medium uppercase tracking-widest flex items-center gap-2 animate-pulse">
                        <RotateCw className="w-3 h-3" />
                        Lật thẻ (Space)
                    </div>
                </div>

                {/* Back Face */}
                <div className="absolute w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] relative">
                    <div className="text-center w-full flex-1 flex flex-col justify-center">
                        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-6 backdrop-blur-sm mx-auto">
                            {currentItem.partOfSpeech}
                        </span>

                        <h3 className="text-2xl font-bold mb-4 leading-relaxed">
                            {currentItem.meaning}
                        </h3>

                        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6"></div>

                        <p className="text-lg italic text-blue-50 font-serif leading-relaxed px-4">
                            "{currentItem.example}"
                        </p>
                        
                        {currentItem.wordFamily && currentItem.wordFamily.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <p className="text-xs uppercase text-blue-200 font-bold mb-2">Gia đình từ</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {currentItem.wordFamily.slice(0, 3).map((f, idx) => (
                                        <span key={idx} className="bg-black/20 px-2 py-1 rounded text-xs">{f.word}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                </div>
            </div>

            {/* Keyboard Guide */}
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-slate-600 font-bold font-mono text-xs">Space</kbd>
                    <span>Lật thẻ</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-slate-600 font-bold font-mono text-xs">1</kbd>
                        <span className="text-rose-500">Quên</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-slate-600 font-bold font-mono text-xs">2</kbd>
                        <span className="text-amber-500">Nhớ</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white border rounded shadow-sm text-slate-600 font-bold font-mono text-xs">3</kbd>
                        <span className="text-emerald-500">Thuộc</span>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default FlashcardMode;