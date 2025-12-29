import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Zap, Activity, BrainCircuit, Flame, Bell, CheckCircle2, Settings } from 'lucide-react';
import VocabForm from './components/VocabForm';
import VocabList from './components/VocabList';
import VocabRepository from './components/VocabRepository';
import FlashcardMode from './components/FlashcardMode';
import ConfirmationModal from './components/ConfirmationModal';
import SettingsModal from './components/SettingsModal';
import { VocabItem } from './types';
import { generateDoc } from './services/docService';

interface UserStats {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
}

const App: React.FC = () => {
  // Tabs: 'learn' | 'flashcard' | 'repo'
  const [activeTab, setActiveTab] = useState<'learn' | 'flashcard' | 'repo'>('learn');

  // Load initial vocab list
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    const saved = localStorage.getItem('vocabList');
    return saved ? JSON.parse(saved) : [];
  });

  // Load Stats
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('userStats');
    return saved ? JSON.parse(saved) : { streak: 0, lastStudyDate: '' };
  });

  // API Key State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [hasStudiedToday, setHasStudiedToday] = useState(false);
  
  // Duplicate Handling State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<VocabItem[]>([]);
  const [duplicateWordsNames, setDuplicateWordsNames] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vocabList', JSON.stringify(vocabList));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(stats));
    
    // Check if studied today
    const today = new Date().toISOString().split('T')[0];
    setHasStudiedToday(stats.lastStudyDate === today);
  }, [stats]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('geminiApiKey', key);
    if(key) showNotification("Đã lưu API Key thành công!");
  };

  // Update Stats Logic
  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    
    setStats(prev => {
        if (prev.lastStudyDate === today) return prev; // Already studied today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = prev.streak;
        if (prev.lastStudyDate === yesterdayStr) {
            newStreak += 1; // Consecutive day
        } else {
            newStreak = 1; // Broken streak or first day
        }

        return {
            streak: newStreak,
            lastStudyDate: today
        };
    });
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Logic Adding Items
  const handleAddVocab = (newItems: Omit<VocabItem, 'id'>[]) => {
    const safeItems: VocabItem[] = [];
    const confirmItems: VocabItem[] = [];
    const confirmNames: Set<string> = new Set();
    let ignoredCount = 0;

    newItems.forEach(newItem => {
        // Normalize for comparison
        const newItemWord = newItem.word.trim().toLowerCase();
        const newItemMeaning = newItem.meaning.trim().toLowerCase();

        // Check if exists
        const existingWord = vocabList.find(v => v.word.toLowerCase() === newItemWord);

        if (existingWord) {
            // Check meaning similarity (simple check)
            const existingMeaning = existingWord.meaning.toLowerCase();
            
            // If identical word AND identical meaning -> Ignore (Exact Duplicate)
            if (existingMeaning === newItemMeaning) {
                ignoredCount++;
            } else {
                // Same word but different meaning -> Ask confirmation
                confirmItems.push({ ...newItem, id: crypto.randomUUID() });
                confirmNames.add(newItem.word);
            }
        } else {
            // New word -> Add straight away
            safeItems.push({ ...newItem, id: crypto.randomUUID() });
        }
    });

    // 1. Process safe items
    if (safeItems.length > 0) {
        setVocabList(prev => [...safeItems, ...prev]);
        updateStreak();
    }

    // 2. Handle ignored
    let msg = "";
    if (safeItems.length > 0) msg += `Đã thêm ${safeItems.length} từ mới. `;
    if (ignoredCount > 0) msg += `Bỏ qua ${ignoredCount} từ trùng lặp hoàn toàn.`;
    
    if (msg) showNotification(msg);

    // 3. Handle confirmations
    if (confirmItems.length > 0) {
        setPendingItems(confirmItems);
        setDuplicateWordsNames(Array.from(confirmNames));
        setIsModalOpen(true);
    }
  };

  const handleConfirmDuplicates = () => {
      setVocabList(prev => [...pendingItems, ...prev]);
      updateStreak();
      setIsModalOpen(false);
      setPendingItems([]);
      showNotification(`Đã thêm ${pendingItems.length} từ có nghĩa mới.`);
  };

  const handleDeleteVocab = (id: string) => {
    setVocabList(prev => prev.filter(item => item.id !== id));
  };

  const handleExport = async () => {
    if (vocabList.length === 0) {
      alert("Danh sách trống! Vui lòng thêm từ vựng trước khi xuất file.");
      return;
    }
    try {
      await generateDoc(vocabList);
    } catch (error) {
      console.error("Export failed", error);
      alert("Có lỗi xảy ra khi tạo file. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Notifications Toast */}
      {notification && (
          <div className="fixed top-20 right-4 z-[60] animate-in slide-in-from-right fade-in duration-300">
              <div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  {notification}
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDuplicates}
        title="Từ vựng đã tồn tại"
        message="Những từ dưới đây đã có trong danh sách của bạn nhưng khác nghĩa. Bạn có chắc chắn muốn thêm chúng dưới dạng định nghĩa mới không?"
        items={duplicateWordsNames}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSave={handleSaveApiKey}
      />

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 blur-[120px]"></div>
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/20 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-100/30 blur-[80px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/50">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="block">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">VocabNote AI</h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                  {apiKey ? 'Auto Mode' : 'Manual Mode'}
                </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Streak Badge */}
             <div className={`hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${hasStudiedToday ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200 grayscale'}`} title="Chuỗi ngày học liên tiếp">
                 <Flame className={`w-3.5 h-3.5 ${hasStudiedToday ? 'fill-orange-500 text-orange-600' : 'text-slate-400'}`} />
                 <span>{stats.streak}</span>
             </div>

             {/* Settings Button */}
             <button
               onClick={() => setIsSettingsOpen(true)}
               className={`p-2 rounded-full border transition-all ${apiKey ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse'}`}
               title="Cài đặt API Key"
             >
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Reminder Banner */}
      {!hasStudiedToday && (
          <div className="bg-indigo-600 text-white py-2 px-4 text-center text-sm font-medium relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4 animate-bounce" />
                  Hôm nay bạn chưa thêm từ mới nào. Hãy duy trì thói quen nhé!
              </div>
          </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Fixed Pill Segmentation Control */}
        <div className="flex justify-center mb-10 sticky top-20 z-40 px-2">
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full grid grid-cols-3 relative border border-slate-200/60 shadow-lg shadow-slate-200/40 w-full max-w-md">
            
            {/* Moving Indicator */}
            <div 
              className={`absolute top-1.5 bottom-1.5 rounded-full bg-indigo-600 shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]`}
              style={{
                width: 'calc((100% - 12px) / 3)', // Subtract total horizontal padding (1.5 * 4 = 12px approx spacing considerations, simplified) 
                // Better calc: Container padding is p-1.5 (6px). So width available is 100% - 12px.
                // Each item is (100% - 12px) / 3.
                left: '6px',
                transform: `translateX(${activeTab === 'learn' ? '0%' : activeTab === 'flashcard' ? '100%' : '200%'})`
              }}
            ></div>

            <button
              onClick={() => setActiveTab('learn')}
              className={`relative z-10 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'learn' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden xs:inline">Thêm từ</span>
              <span className="xs:hidden">Thêm</span>
            </button>
            <button
              onClick={() => setActiveTab('flashcard')}
              className={`relative z-10 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'flashcard' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span className="hidden xs:inline">Flashcard</span>
              <span className="xs:hidden">Học</span>
            </button>
            <button
              onClick={() => setActiveTab('repo')}
              className={`relative z-10 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'repo' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden xs:inline">Kho từ</span>
              <span className="xs:hidden">Kho</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
        {activeTab === 'learn' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                 {apiKey ? 'Chế độ tự động' : 'Quy trình thủ công'}
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                 {apiKey 
                    ? 'Nhập từ vựng và AI sẽ tự động điền thông tin chi tiết cho bạn.' 
                    : 'Nhập từ vựng → Copy Prompt → Dán vào AI → Nhập kết quả JSON để lưu trữ.'
                 }
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
                <VocabForm onAdd={handleAddVocab} apiKey={apiKey} />
            </div>
            
            {vocabList.length > 0 && (
              <div className="max-w-7xl mx-auto">
                 <div className="flex items-center gap-4 mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                       Vừa thêm gần đây
                    </span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                 </div>
                 <VocabList items={vocabList.slice(0, 3)} onDelete={handleDeleteVocab} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'flashcard' && (
          <div className="animate-in zoom-in-95 duration-500 max-w-5xl mx-auto">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Luyện tập từ vựng</h2>
                <p className="text-slate-500 text-sm">Chạm vào thẻ để xem nghĩa và ví dụ.</p>
             </div>
             <FlashcardMode items={vocabList} />
          </div>
        )}

        {activeTab === 'repo' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Kho từ vựng</h2>
                <p className="text-slate-500 text-sm">Quản lý toàn bộ {vocabList.length} từ vựng của bạn.</p>
             </div>
             <VocabRepository 
                items={vocabList} 
                onDelete={handleDeleteVocab} 
                onExport={handleExport}
             />
          </div>
        )}
        </div>

      </main>
    </div>
  );
};

export default App;