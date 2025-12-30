
import React, { useState, useCallback, useMemo } from 'react';
import { Search, Sparkles, BookOpen, Trash2, Info, MapPin, Hash } from 'lucide-react';
import { findPalindromes } from './utils/hebrew';
import { GeminiService } from './services/geminiService';

interface LocalResult {
  normalized: string;
  original: string;
  length: number;
  source?: { book: string; chapter: string; verse: string };
  isCheckingSource?: boolean;
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [results, setResults] = useState<LocalResult[]>([]);
  const [aiDiscoveries, setAiDiscoveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'discover'>('search');

  const gemini = useMemo(() => new GeminiService(), []);

  const handleSearch = useCallback(() => {
    if (!inputText.trim()) return;
    const found = findPalindromes(inputText, 3, 60);
    setResults(found.map(f => ({ ...f, isCheckingSource: false })));
    setActiveTab('search');
  }, [inputText]);

  const handleAIDiscover = async () => {
    setIsLoading(true);
    try {
      const data = await gemini.discoverPalindromes(inputText || undefined);
      setAiDiscoveries(data.palindromes || []);
      setActiveTab('discover');
    } catch (error) {
      console.error(error);
      alert("שגיאה בחיבור לשרת ה-AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const lookupSourceFor = async (index: number) => {
    const result = results[index];
    if (result.source || result.isCheckingSource) return;

    const newResults = [...results];
    newResults[index].isCheckingSource = true;
    setResults(newResults);

    try {
      const sourceData = await gemini.identifySource(result.original);
      const updatedResults = [...results];
      updatedResults[index].isCheckingSource = false;
      if (sourceData.found) {
        updatedResults[index].source = {
          book: sourceData.book,
          chapter: sourceData.chapter,
          verse: sourceData.verse
        };
      } else {
        alert("המקור לא זוהה בוודאות בתנ\"ך.");
      }
      setResults(updatedResults);
    } catch (e) {
      const updatedResults = [...results];
      updatedResults[index].isCheckingSource = false;
      setResults(updatedResults);
    }
  };

  const clearAll = () => {
    setInputText('');
    setResults([]);
    setAiDiscoveries([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-12 bg-[#fdfcf9]">
      <header className="w-full bg-stone-900 text-stone-100 py-12 px-6 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold tanakh-font mb-4 tracking-tight">מגלה רצפי פלינדרום</h1>
          <p className="text-stone-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            חשיפת סודות הפלינדרומים בתנ"ך - ישר והפוך באותה המידה.
          </p>
        </div>
      </header>

      <main className="w-full max-w-5xl px-4 mt-[-40px] z-20 flex-1">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 md:p-8 mb-8 transition-all">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-stone-700 font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-amber-700" />
                טקסט לניתוח (מילים או פסוקים)
              </label>
              <button onClick={clearAll} className="text-stone-300 hover:text-red-500 transition-colors p-1" title="נקה הכל">
                <Trash2 size={20} />
              </button>
            </div>
            <textarea
              className="w-full h-40 p-5 border-2 border-stone-100 rounded-xl bg-stone-50 focus:bg-white focus:border-amber-600 focus:outline-none transition-all text-2xl tanakh-font resize-none leading-relaxed shadow-inner"
              placeholder="הכנס כאן טקסט מהתנ״ך..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <button onClick={handleSearch} className="flex-1 min-w-[150px] bg-stone-800 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-700 active:scale-95 transition-all shadow-md">
                <Search size={22} />
                חפש בטקסט שלי
              </button>
              <button onClick={handleAIDiscover} disabled={isLoading} className="flex-1 min-w-[150px] bg-amber-600 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-500 active:scale-95 transition-all shadow-md disabled:opacity-50">
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Sparkles size={22} />}
                גילוי פלינדרומים בתנ"ך (AI)
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b border-stone-200">
          <button onClick={() => setActiveTab('search')} className={`pb-4 px-6 font-bold text-lg transition-all ${activeTab === 'search' ? 'border-b-4 border-amber-600 text-amber-900' : 'text-stone-400 hover:text-stone-600'}`}>
            תוצאות חיפוש ({results.length})
          </button>
          <button onClick={() => setActiveTab('discover')} className={`pb-4 px-6 font-bold text-lg transition-all ${activeTab === 'discover' ? 'border-b-4 border-amber-600 text-amber-900' : 'text-stone-400 hover:text-stone-600'}`}>
            תגליות מהתנ"ך ({aiDiscoveries.length})
          </button>
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'search' ? (
            results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((res, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg transition-all border-r-8 border-r-amber-500 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-stone-400 text-xs font-bold bg-stone-50 px-3 py-1 rounded-full border border-stone-100">
                        <Hash size={12} />
                        {res.length} אותיות
                      </div>
                      {res.source ? (
                        <div className="flex items-center gap-1 text-sm text-amber-800 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-in fade-in zoom-in duration-300">
                          <MapPin size={14} />
                          {res.source.book} {res.source.chapter}:{res.source.verse}
                        </div>
                      ) : (
                        <button 
                          onClick={() => lookupSourceFor(idx)}
                          disabled={res.isCheckingSource}
                          className="text-xs text-amber-600 hover:bg-amber-50 border border-amber-200 px-3 py-1 rounded-full transition-all disabled:opacity-50"
                        >
                          {res.isCheckingSource ? 'מזהה מקור...' : 'זהה מקור בתנ"ך'}
                        </button>
                      )}
                    </div>
                    <div className="text-4xl text-center font-bold tanakh-font text-stone-900 py-6 bg-stone-50 rounded-xl mb-4 tracking-widest">
                      {res.normalized}
                    </div>
                    <div className="mt-auto pt-4 border-t border-stone-100 bg-amber-50/30 p-4 rounded-b-xl">
                      <p className="text-stone-400 text-[10px] mb-2 uppercase tracking-widest font-bold">מקור מהטקסט:</p>
                      <p className="text-stone-800 tanakh-font text-2xl text-center leading-relaxed">
                        {res.original}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Search size={64} />} message="לא נמצאו פלינדרומים בטקסט שהזנת." />
            )
          ) : (
            aiDiscoveries.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {aiDiscoveries.map((discovery, idx) => (
                  <div key={idx} className="bg-amber-50/40 p-8 rounded-3xl border border-amber-100 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-amber-300/30 transition-all"></div>
                    <div className="flex-1 z-10">
                      <div className="flex flex-wrap items-center gap-3 text-amber-900 font-bold mb-5">
                        <div className="flex items-center gap-1 bg-amber-200/50 px-4 py-2 rounded-xl text-md">
                          <BookOpen size={18} />
                          {discovery.book}
                        </div>
                        <div className="flex items-center gap-1 bg-white px-4 py-2 rounded-xl text-md border border-amber-200/50">
                          <span className="text-stone-400">פרק</span> {discovery.chapter}
                        </div>
                        <div className="flex items-center gap-1 bg-white px-4 py-2 rounded-xl text-md border border-amber-200/50">
                          <span className="text-stone-400">פסוק</span> {discovery.verse}
                        </div>
                      </div>
                      <h3 className="text-5xl font-bold tanakh-font text-stone-900 mb-6 tracking-widest border-r-4 border-amber-600 pr-4">
                        {discovery.text}
                      </h3>
                      {discovery.meaning && (
                        <div className="bg-white/80 p-6 rounded-2xl border border-amber-100 shadow-sm backdrop-blur-sm">
                           <p className="text-stone-700 text-xl leading-relaxed flex gap-3 italic">
                             <Info size={24} className="text-amber-600 flex-shrink-0 mt-1" />
                             {discovery.meaning}
                           </p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-8 rounded-full border-4 border-amber-200 shadow-lg hidden md:block self-center">
                      <Sparkles size={56} className="text-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Sparkles size={64} />} message="לחץ על 'גילוי פלינדרומים' כדי שה-AI ימצא עבורך רצפים מרתקים בתנ&quot;ך." />
            )
          )}
        </div>
      </main>

      <footer className="w-full mt-20 py-12 border-t border-stone-200 text-center text-stone-400 text-sm bg-white">
        <p className="mb-2">כלי מחקר לפלינדרומים ומבנה הטקסט המקראי</p>
        <p className="font-light">מבוסס על בינה מלאכותית מתקדמת לניתוח שפות עתיקות</p>
      </footer>
    </div>
  );
};

const EmptyState: React.FC<{ icon: React.ReactNode, message: string }> = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-24 text-stone-300">
    <div className="bg-stone-50 p-10 rounded-full mb-8 border border-stone-100 shadow-inner">
      {icon}
    </div>
    <p className="text-2xl text-center max-w-md tanakh-font font-light text-stone-400">{message}</p>
  </div>
);

export default App;
