import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Github } from 'lucide-react';
import VocabForm from './components/VocabForm';
import VocabList from './components/VocabList';
import { VocabItem } from './types';
import { generateDoc } from './services/docService';

const App: React.FC = () => {
  // Load initial state from local storage
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    const saved = localStorage.getItem('vocabList');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local storage", e);
        return [];
      }
    }
    return [];
  });

  // Save to local storage whenever list changes
  useEffect(() => {
    localStorage.setItem('vocabList', JSON.stringify(vocabList));
  }, [vocabList]);

  const handleAddVocab = (newItem: Omit<VocabItem, 'id'>) => {
    const item: VocabItem = {
      ...newItem,
      id: crypto.randomUUID()
    };
    setVocabList(prev => [item, ...prev]);
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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">VocabNote AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="text-slate-500 hover:text-slate-700 transition-colors hidden sm:block"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8 text-center sm:text-left sm:flex sm:justify-between sm:items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Ghi chú từ vựng</h2>
            <p className="text-slate-600">
              Quản lý danh sách từ vựng của bạn và sử dụng AI để tự động điền thông tin.
            </p>
          </div>
          
          <button
            onClick={handleExport}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow active:transform active:scale-95"
            disabled={vocabList.length === 0}
          >
            <Download className="w-4 h-4" />
            Xuất file Word
          </button>
        </div>

        <VocabForm onAdd={handleAddVocab} />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Danh sách ({vocabList.length})
          </h3>
          {vocabList.length > 0 && (
            <button 
              onClick={() => {
                if(window.confirm('Bạn có chắc chắn muốn xóa tất cả?')) {
                  setVocabList([]);
                }
              }}
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        <VocabList items={vocabList} onDelete={handleDeleteVocab} />

      </main>
    </div>
  );
};

export default App;