import React, { useState, useEffect } from 'react';
import { BookOpen, Zap, Flame, Settings, Plus, GalleryHorizontalEnd, LayoutGrid } from 'lucide-react';
import VocabForm from './components/VocabForm';
import VocabList from './components/VocabList';
import VocabRepository from './components/VocabRepository';
import FlashcardMode from './components/FlashcardMode';
import ConfirmationModal from './components/ConfirmationModal';
import SettingsModal from './components/SettingsModal';
import StatsBar from './components/StatsBar';
import StorageManagerModal from './components/StorageManagerModal';
import { VocabItem } from './types';
import { generateDoc } from './services/docService';
import { getAllVocab, addVocabItem, bulkAddVocabItems, deleteVocabItem, updateVocabItem, bulkDeleteVocabItems } from './services/db';

interface UserStats {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
}

const App: React.FC = () => {
  // Tabs: 'learn' | 'flashcard' | 'repo'
  const [activeTab, setActiveTab] = useState<'learn' | 'flashcard' | 'repo'>('learn');

  // Vocab list state
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Storage Modal
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Trigger for StatsBar
  const [dataVersion, setDataVersion] = useState(0);

  // Initial DB Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const items = await getAllVocab();
        setVocabList(items.reverse()); 
        setDataVersion(v => v + 1); // Init stats
      } catch (error) {
        console.error("Failed to load from DB", error);
        showNotification("Lỗi tải dữ liệu từ bộ nhớ.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(stats));
    const today = new Date().toISOString().split('T')[0];
    setHasStudiedToday(stats.lastStudyDate === today);
  }, [stats]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('geminiApiKey', key);
    if(key) showNotification("Đã lưu API Key thành công!");
  };

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => {
        if (prev.lastStudyDate === today) return prev; 
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = prev.streak;
        if (prev.lastStudyDate === yesterdayStr) {
            newStreak += 1;
        } else {
            newStreak = 1;
        }
        return { streak: newStreak, lastStudyDate: today };
    });
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddVocab = async (newItems: Omit<VocabItem, 'id'>[]) => {
    const safeItems: VocabItem[] = [];
    const confirmItems: VocabItem[] = [];
    const confirmNames: Set<string> = new Set();
    let ignoredCount = 0;

    newItems.forEach(newItem => {
        const newItemWord = newItem.word.trim().toLowerCase();
        const newItemMeaning = newItem.meaning.trim().toLowerCase();
        const existingWord = vocabList.find(v => v.word.toLowerCase() === newItemWord);

        if (existingWord) {
            const existingMeaning = existingWord.meaning.toLowerCase();
            if (existingMeaning === newItemMeaning) {
                ignoredCount++;
            } else {
                confirmItems.push({ ...newItem, id: crypto.randomUUID() });
                confirmNames.add(newItem.word);
            }
        } else {
            safeItems.push({ ...newItem, id: crypto.randomUUID() });
        }
    });

    if (safeItems.length > 0) {
        // Optimistic update
        setVocabList(prev => [...safeItems, ...prev]);
        updateStreak();
        // DB update
        await bulkAddVocabItems(safeItems);
        setDataVersion(v => v + 1); // Refresh stats
    }

    let msg = "";
    if (safeItems.length > 0) msg += `Đã thêm ${safeItems.length} từ mới. `;
    if (ignoredCount > 0) msg += `Bỏ qua ${ignoredCount} từ trùng lặp hoàn toàn.`;
    if (msg) showNotification(msg);

    if (confirmItems.length > 0) {
        setPendingItems(confirmItems);
        setDuplicateWordsNames(Array.from(confirmNames));
        setIsModalOpen(true);
    }
    
    setDataVersion(v => v + 1);
  };

  const handleConfirmDuplicates = async () => {
      setVocabList(prev => [...pendingItems, ...prev]);
      updateStreak();
      await bulkAddVocabItems(pendingItems);
      setDataVersion(v => v + 1);

      setIsModalOpen(false);
      setPendingItems([]);
      showNotification(`Đã thêm ${pendingItems.length} từ có nghĩa mới.`);
  };

  const handleDeleteVocab = async (id: string) => {
    setVocabList(prev => prev.filter(item => item.id !== id));
    await deleteVocabItem(id);
    setDataVersion(v => v + 1);
  };

  const handleBulkDelete = async (ids: string[]) => {
      setVocabList(prev => prev.filter(item => !ids.includes(item.id)));
      await bulkDeleteVocabItems(ids);
      setDataVersion(v => v + 1);
      showNotification(`Đã xóa ${ids.length} từ vựng.`);
      setIsStorageModalOpen(false);
  };

  const handleUpdateConfidence = async (id: string, level: number) => {
      const updatedItem = vocabList.find(i => i.id === id);
      if (updatedItem) {
          const newItem = { ...updatedItem, confidence: level, lastReviewed: new Date().toISOString() };
          setVocabList(prev => prev.map(item => item.id === id ? newItem : item));
          await updateVocabItem(newItem);
          setDataVersion(v => v + 1);
      }
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

  // Layout classes
  // Note: We use 'fixed' positioning for Flashcard to prevent body scroll, but allow footer to overlap or sit on bottom.
  const mainContainerClasses = activeTab === 'flashcard' 
    ? "fixed inset-0 overflow-hidden flex flex-col bg-slate-50" 
    : "min-h-screen bg-slate-50 text-slate-900 pb-32 md:pb-0 font-sans";

  return (
    <div className={mainContainerClasses}>
      
      {/* Notifications Toast */}
      {notification && (
          <div className="fixed top-24 right-4 z-[60] animate-in slide-in-from-right fade-in duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="bg-slate-800 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  {notification}
              </div>
          </div>
      )}

      {/* Modals */}
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDuplicates}
        title="Từ vựng đã tồn tại"
        message="Những từ dưới đây đã có trong danh sách của bạn nhưng khác nghĩa. Bạn có chắc chắn muốn thêm chúng dưới dạng định nghĩa mới không?"
        items={duplicateWordsNames}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSave={handleSaveApiKey}
      />

      <StorageManagerModal 
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        items={vocabList}
        onDeleteItems={handleBulkDelete}
      />

      {/* Background - Blue Ocean Theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/20 blur-[120px]"></div>
          <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-200/20 blur-[100px]"></div>
      </div>

      {/* Minimal Header */}
      <header className="flex-shrink-0 sticky top-0 z-40 pt-4 px-4 sm:px-6 lg:px-8 mb-2 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-start justify-between pointer-events-auto">
          
          {/* Stats Bar */}
          <div className="flex flex-col gap-2">
            <StatsBar 
               triggerRefresh={dataVersion} 
               onOpenStorage={() => setIsStorageModalOpen(true)}
            />
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-white/50 shadow-sm">
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hasStudiedToday ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400 grayscale'}`} title="Chuỗi ngày học liên tiếp">
                 <Flame className={`w-4 h-4 ${hasStudiedToday ? 'fill-orange-500 text-orange-600' : 'text-slate-300'}`} />
                 <span>{stats.streak}</span>
             </div>
             <button
               onClick={() => setIsSettingsOpen(true)}
               className={`p-2 rounded-full transition-all ${apiKey ? 'hover:bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600 animate-pulse'}`}
               title="Cài đặt"
             >
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 ${activeTab === 'flashcard' ? 'overflow-hidden h-full pb-24' : ''}`}>
        
        {/* Desktop Navigation (Hidden on Mobile) */}
        <div className="hidden md:flex justify-center mb-6 px-2 flex-shrink-0">
          <div className="bg-white p-2 rounded-full grid grid-cols-3 relative border border-slate-100 shadow-xl shadow-slate-200/50 w-full max-w-lg">
            <div 
              className={`absolute top-2 bottom-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/30 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]`}
              style={{
                width: 'calc((100% - 16px) / 3)', 
                left: '8px',
                transform: `translateX(${activeTab === 'learn' ? '0%' : activeTab === 'flashcard' ? '100%' : '200%'})`
              }}
            ></div>

            <button onClick={() => setActiveTab('learn')} className={`relative z-10 py-3 text-sm font-bold rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'learn' ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              <Zap className="w-4 h-4" />
              <span>Thêm từ</span>
            </button>
            <button onClick={() => setActiveTab('flashcard')} className={`relative z-10 py-3 text-sm font-bold rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'flashcard' ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              <GalleryHorizontalEnd className="w-4 h-4" />
              <span>Flashcard</span>
            </button>
            <button onClick={() => setActiveTab('repo')} className={`relative z-10 py-3 text-sm font-bold rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'repo' ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              <LayoutGrid className="w-4 h-4" />
              <span>Kho từ</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`flex-1 flex flex-col ${activeTab === 'flashcard' ? 'h-full' : ''}`}>
        {activeTab === 'learn' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-24">
            <div className="text-center space-y-1 mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-2 text-blue-600">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                 {apiKey ? 'Thêm từ tự động' : 'Thêm từ thủ công'}
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
                <VocabForm onAdd={handleAddVocab} apiKey={apiKey} />
            </div>
            
            {vocabList.length > 0 && (
              <div className="max-w-7xl mx-auto pt-8">
                 <div className="flex items-center gap-4 mb-6">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
                       Gần đây
                    </span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                 </div>
                 <VocabList items={vocabList.slice(0, 3)} onDelete={handleDeleteVocab} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'flashcard' && (
          <div className="animate-in zoom-in-95 duration-500 w-full h-full flex flex-col">
             <FlashcardMode items={vocabList} onUpdateConfidence={handleUpdateConfidence} />
          </div>
        )}

        {activeTab === 'repo' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
             <div className="mb-6 text-center md:text-left flex items-center gap-3">
                 <div className="p-2 bg-slate-100 rounded-xl">
                    <LayoutGrid className="w-6 h-6 text-slate-600" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kho từ vựng</h2>
                    <p className="text-slate-500 text-xs font-medium">{vocabList.length} từ đã lưu</p>
                 </div>
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

      {/* Floating Mobile Bottom Navigation - VISIBLE ON ALL TABS */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white/95 backdrop-blur-xl border border-blue-100 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 px-6 py-3 flex justify-between items-center h-[72px] animate-in slide-in-from-bottom-20 duration-500">
        
        {/* Repo Tab */}
        <button 
        onClick={() => setActiveTab('repo')}
        className={`flex flex-col items-center gap-1 transition-all active:scale-95 w-16 ${activeTab === 'repo' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <LayoutGrid className={`w-6 h-6 ${activeTab === 'repo' ? 'fill-blue-100' : ''}`} strokeWidth={activeTab === 'repo' ? 2.5 : 2} />
        </button>

        {/* Big Add Button (Learn) */}
        <div className="relative -top-8">
            <button 
                onClick={() => setActiveTab('learn')}
                className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-blue-500/40 border-[6px] border-slate-50 transition-all active:scale-90 ${activeTab === 'learn' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'}`}
            >
                <Plus className="w-8 h-8" strokeWidth={3} />
            </button>
        </div>

        {/* Flashcard Tab */}
        <button 
        onClick={() => setActiveTab('flashcard')}
        className={`flex flex-col items-center gap-1 transition-all active:scale-95 w-16 ${activeTab === 'flashcard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <GalleryHorizontalEnd className={`w-6 h-6 ${activeTab === 'flashcard' ? 'fill-blue-100' : ''}`} strokeWidth={activeTab === 'flashcard' ? 2.5 : 2} />
        </button>

      </div>

    </div>
  );
};

export default App;