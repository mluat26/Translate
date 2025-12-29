import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCw, Settings2, Filter, X, Check, HelpCircle, XCircle, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { VocabItem } from '../types';

interface FlashcardModeProps {
  items: VocabItem[];
  onUpdateConfidence?: (id: string, level: number) => void;
}

const SWIPE_THRESHOLD = 100;

const FlashcardMode: React.FC<FlashcardModeProps> = ({ items, onUpdateConfidence }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Swipe State
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Filtering Logic
  const [studyList, setStudyList] = useState<VocabItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterConfidence, setFilterConfidence] = useState('ALL'); 

  useEffect(() => {
    applyFilters();
  }, [items, filterTopic, filterLevel, filterConfidence]);

  const applyFilters = () => {
      let filtered = [...items];
      // Basic Shuffle on load
      filtered = filtered.sort(() => Math.random() - 0.5);

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
      resetDrag();
  };

  const uniqueTopics = Array.from(new Set(items.map(i => i.topic).filter(Boolean)));
  const currentItem = studyList[currentIndex];

  const resetDrag = () => {
      setDragOffset({ x: 0, y: 0 });
      setDragStart(null);
      setIsDragging(false);
  };

  const handleNextCard = () => {
      setIsFlipped(false);
      resetDrag();
      setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % studyList.length);
      }, 300); // Wait for animation out
  };

  const handleAction = (level: number) => {
      if (currentItem && onUpdateConfidence) {
          onUpdateConfidence(currentItem.id, level);
          handleNextCard();
      }
  };

  // --- Touch/Mouse Handlers ---

  const handleStart = (clientX: number, clientY: number) => {
      setDragStart({ x: clientX, y: clientY });
      setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
      if (!dragStart) return;
      const offsetX = clientX - dragStart.x;
      const offsetY = clientY - dragStart.y;
      setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleEnd = () => {
      if (!dragStart) return;
      
      const { x, y } = dragOffset;
      const absX = Math.abs(x);
      const absY = Math.abs(y);

      // Determine direction
      if (absX > SWIPE_THRESHOLD || (y < -SWIPE_THRESHOLD && absX < absY)) {
          // Trigger Action
          if (y < -SWIPE_THRESHOLD && absX < absY) {
               // Swipe UP -> Hazy (2)
               handleAction(2);
          } else if (x > 0) {
              // Swipe RIGHT -> Known (3)
              handleAction(3);
          } else {
              // Swipe LEFT -> Forgot (1)
              handleAction(1);
          }
      } else {
          // Snap back
          resetDrag();
      }
  };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => {
      if (isDragging) handleMove(e.clientX, e.clientY);
  };
  const onMouseUp = () => {
      if (isDragging) handleEnd();
  };
  const onMouseLeave = () => {
    if (isDragging) resetDrag();
  }

  // Calculate transforms and opacities
  const rotateVal = dragOffset.x * 0.05;
  const opacityLeft = Math.min(1, Math.max(0, -dragOffset.x / 100)); // Red overlay
  const opacityRight = Math.min(1, Math.max(0, dragOffset.x / 100)); // Green overlay
  const opacityUp = Math.min(1, Math.max(0, -dragOffset.y / 100)); // Yellow overlay (only if dragging up mostly)
  
  // Prioritize UP opacity if movement is mostly vertical
  const isVerticalSwipe = Math.abs(dragOffset.y) > Math.abs(dragOffset.x);
  const finalOpacityLeft = isVerticalSwipe ? 0 : opacityLeft;
  const finalOpacityRight = isVerticalSwipe ? 0 : opacityRight;
  const finalOpacityUp = isVerticalSwipe && dragOffset.y < 0 ? opacityUp : 0;

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Filter className="w-12 h-12 text-blue-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Chưa có từ vựng</h3>
        <p className="text-slate-500 mt-2">Hãy thêm từ mới để bắt đầu học nhé!</p>
      </div>
    );
  }

  if (studyList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Filter className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">Không có thẻ nào phù hợp bộ lọc.</p>
            <button onClick={() => {setFilterTopic('ALL'); setFilterLevel('ALL'); setFilterConfidence('ALL')}} className="mt-4 text-blue-600 text-sm font-bold hover:underline">
                Xóa bộ lọc
            </button>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-slate-50">
      
      {/* Top Bar: Progress & Filters */}
      <div className="flex-shrink-0 px-4 py-3 flex justify-between items-center z-20">
          <div className="flex items-center gap-2">
            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-full px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
                {currentIndex + 1} / {studyList.length}
            </div>
          </div>

          <button 
             onClick={() => setShowFilters(true)}
             className={`p-2 rounded-full border transition-all ${
                 filterTopic !== 'ALL' || filterLevel !== 'ALL' || filterConfidence !== 'ALL' 
                 ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                 : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
             }`}
          >
              <Settings2 className="w-5 h-5" />
          </button>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center relative w-full perspective-1000">
        
        {/* Background Stack Effect (Decoration) */}
        {currentIndex + 1 < studyList.length && (
             <div className="absolute w-[85%] h-[60%] md:w-[380px] md:h-[500px] bg-white rounded-3xl border border-slate-200 shadow-sm transform scale-90 translate-y-4 -z-10 transition-transform duration-500 ease-out"></div>
        )}
        {currentIndex + 2 < studyList.length && (
             <div className="absolute w-[85%] h-[60%] md:w-[380px] md:h-[500px] bg-white rounded-3xl border border-slate-200 shadow-sm transform scale-90 translate-y-8 -z-20 transition-transform duration-500 ease-out"></div>
        )}

        {/* ACTIVE CARD */}
        <div 
            ref={cardRef}
            className="relative w-[90%] h-[70%] md:w-[400px] md:h-[550px] cursor-grab active:cursor-grabbing z-10 touch-none"
            style={{ 
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotateVal}deg)`,
                // Smoother spring-like release
                transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >   
            {/* SWIPE OVERLAYS */}
            <div className="absolute inset-0 z-50 rounded-3xl pointer-events-none transition-opacity" style={{ opacity: finalOpacityRight }}>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-3xl bg-emerald-50/20"></div>
                <div className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-bold text-3xl px-4 py-2 rounded-xl transform -rotate-12 bg-white/50 backdrop-blur-sm">
                    THUỘC
                </div>
            </div>
            <div className="absolute inset-0 z-50 rounded-3xl pointer-events-none transition-opacity" style={{ opacity: finalOpacityLeft }}>
                <div className="absolute inset-0 border-4 border-rose-500 rounded-3xl bg-rose-50/20"></div>
                <div className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-bold text-3xl px-4 py-2 rounded-xl transform rotate-12 bg-white/50 backdrop-blur-sm">
                    QUÊN
                </div>
            </div>
            <div className="absolute inset-0 z-50 rounded-3xl pointer-events-none transition-opacity" style={{ opacity: finalOpacityUp }}>
                 <div className="absolute inset-0 border-4 border-amber-500 rounded-3xl bg-amber-50/20"></div>
                 <div className="absolute bottom-16 left-1/2 -translate-x-1/2 border-4 border-amber-500 text-amber-500 font-bold text-3xl px-4 py-2 rounded-xl bg-white/50 backdrop-blur-sm">
                    NHỚ SƠ
                </div>
            </div>


            {/* CARD INNER */}
            <div 
                className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                onClick={(e) => {
                    // Only flip if not dragging
                    if (Math.abs(dragOffset.x) < 5 && Math.abs(dragOffset.y) < 5) {
                        setIsFlipped(!isFlipped);
                    }
                }}
            >
                {/* Front Face */}
                <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 flex flex-col items-center justify-between [backface-visibility:hidden] select-none">
                    <div className="w-full flex justify-between items-start">
                         <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                            currentItem.level?.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                            currentItem.level?.startsWith('B') ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                            {currentItem.level || 'N/A'}
                        </span>
                        {currentItem.topic && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded">
                                {currentItem.topic}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-6 w-full">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 text-center tracking-tight leading-tight break-words max-w-full">
                            {currentItem.word}
                        </h2>
                        
                        <div className="flex items-center gap-3">
                            <span className="font-serif text-xl text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">{currentItem.phonetic}</span>
                        </div>
                    </div>

                    <div className="text-slate-400 text-xs font-medium uppercase tracking-widest flex items-center gap-2 animate-pulse mb-4">
                        <RotateCw className="w-3 h-3" />
                        Chạm để lật
                    </div>
                </div>

                {/* Back Face */}
                <div className="absolute w-full h-full bg-slate-900 text-white rounded-3xl shadow-xl p-6 md:p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] select-none">
                    <div className="text-center w-full flex-1 flex flex-col justify-center overflow-y-auto scrollbar-hide">
                        <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold mb-4 backdrop-blur-sm mx-auto border border-white/10">
                            {currentItem.partOfSpeech}
                        </span>

                        <h3 className="text-xl md:text-2xl font-bold mb-4 leading-relaxed text-blue-100">
                            {currentItem.meaning}
                        </h3>

                        <div className="w-12 h-0.5 bg-white/20 rounded-full mx-auto mb-4"></div>

                        <p className="text-base md:text-lg italic text-slate-300 font-serif leading-relaxed px-2">
                            "{currentItem.example}"
                        </p>
                        
                        {currentItem.wordFamily && currentItem.wordFamily.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-white/10 w-full">
                                <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">Gia đình từ</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {currentItem.wordFamily.slice(0, 3).map((f, idx) => (
                                        <span key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px]">{f.word}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Guide Bar */}
      <div className="flex-shrink-0 pb-6 pt-4 px-8 flex justify-between items-center text-xs font-bold text-slate-400 select-none pointer-events-none">
          <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full border-2 border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500 mb-1">
                  <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="text-rose-400">Quên</span>
          </div>

           <div className="flex flex-col items-center gap-1 -mt-8">
              <div className="w-10 h-10 rounded-full border-2 border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500 mb-1">
                  <ArrowUp className="w-5 h-5" />
              </div>
              <span className="text-amber-400">Nhớ</span>
          </div>

           <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1">
                  <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-emerald-400">Thuộc</span>
          </div>
      </div>

      {/* FILTER POPUP (Activity View Style) */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500" onClick={() => setShowFilters(false)}></div>
            
            <div className="relative bg-white w-full max-w-sm rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:zoom-in-95 pb-6 md:pb-0">
                
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
    </div>
  );
};

export default FlashcardMode;