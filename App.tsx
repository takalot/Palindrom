
import React, { useState, useCallback, useMemo } from 'react';
import { Search, Sparkles, BookOpen, Trash2, Info, MapPin } from 'lucide-react';
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
    const found = findPalindromes(inputText, 3, 50);
    setResults(found.map(f => ({ ...f, isCheckingSource: false })).sort((a, b) => b.length - a.length));
    setActiveTab('search');
  }, [inputText]);

  const handleAIDiscover = async () => {
    setIsLoading(true);
    try {
      const data = await gemini.discoverPalindromes(inputText || undefined);
      setAiDiscoveries(data.palindromes);
      setActiveTab('discover');
    } catch (error) {
      console.error(error);
      alert("שגיאה בתקשורת עם ה-AI. נסה שוב מאוחר יותר.");
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
        alert("לא נמצא מקור מקראי מדויק לרצף זה.");
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
    <div className="min-h-screen flex flex-col items-center pb-12">
      <header className="w-full bg-stone-900 text-stone-100 py-10 px-6 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold tanakh-font mb-4 tracking-tight">מגלה רצפי פלינדרום</h1>
          <p className="text-stone-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            חיפוש רצפים הנקראים ישר והפוך בתוך פסוקי התנ"ך.
          </p>
        </div>
      </header>

      <main className="w-full max-w-5xl px-4 mt-[-40px] z-20 flex-1">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 md:p-8 mb-8 transition-all hover:shadow-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-stone-700 font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-amber-700" />
                הכנס טקסט לניתוח
              </label>
              <button onClick={clearAll} className="text-stone-400 hover:text-red-500 transition-colors p-1" title="נקה הכל">
                <Trash2 size={20} />
              </button>
            </div>
            <textarea
              className="w-full h-40 p-4 border-2 border-stone-100 rounded-xl bg-stone-50 focus:bg-white focus:border-amber-600 focus:outline-none transition-all text-xl tanakh-font resize-none leading-relaxed"
              placeholder="לדוגמה: הבא נא אבא אליך כי לא ידע כי כלתו היא..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <button onClick={handleSearch} className="flex-1 min-w-[150px] bg-stone-800 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-700 active:scale-95 transition-all shadow-md">
                <Search size={22} />
                חפש רצפים מקומיים
              </button>
              <button onClick={handleAIDiscover} disabled={isLoading} className="flex-1 min-w-[150px] bg-amber-600 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-500 active:scale-95 transition-all shadow-md disabled:opacity-50">
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Sparkles size={22} />}
                גילוי פלינדרומים בתנ"ך (AI)
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b border-stone-200">
          <button onClick={() => setActiveTab('search')} className={`pb-3 px-4 font-bold transition-all ${activeTab === 'search' ? 'border-b-4 border-amber-600 text-amber-900' : 'text-stone-400 hover:text-stone-600'}`}>
            תוצאות חיפוש ({results.length})
          </button>
          <button onClick={() => setActiveTab('discover')} className={`pb-3 px-4 font-bold transition-all ${activeTab === 'discover' ? 'border-b-4 border-amber-600 text-amber-900' : 'text-stone-400 hover:text-stone-600'}`}>
            תגליות AI ({aiDiscoveries.length})
          </button>
        </div>

        <div className="min-h-[300px]">
          {activeTab === 'search' ? (
            results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((res, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all border-r-4 border-r-amber-500 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">
                        {res.length} אותיות
                      </span>
                      {res.source ? (
                        <div className="flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          <MapPin size={12} />
                          {res.source.book} {res.source.chapter}:{res.source.verse}
                        </div>
                      ) : (
                        <button 
                          onClick={() => lookupSourceFor(idx)}
                          disabled={res.isCheckingSource}
                          className="text-[10px] text-stone-400 hover:text-amber-600 border border-stone-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          {res.isCheckingSource ? 'מחפש...' : 'זהה מקור בתנ"ך'}
                        </button>
                      )}
                    </div>
                    <div className="text-3xl text-center font-bold tanakh-font text-stone-800 py-4 bg-stone-50 rounded-lg mb-4">
                      {res.normalized}
                    </div>
                    <div className="mt-auto pt-4 border-t border-stone-100">
                      <p className="text-stone-400 text-[10px] mb-1 uppercase tracking-wider font-bold">מקור מהטקסט:</p>
                      <p className="text-stone-700 tanakh-font text-lg text-center leading-relaxed">
                        {res.original}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="לא נמצאו רצפים בטקסט." />
            )
          ) : (
            aiDiscoveries.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {aiDiscoveries.map((discovery, idx) => (
                  <div key={idx} className="bg-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 text-amber-800 font-bold mb-3 border-b border-amber-200 pb-2">
                        <div className="flex items-center gap-1 bg-amber-200 px-3 py-1 rounded-full text-sm">
                          <BookOpen size={16} />
                          {discovery.book}
                        </div>
                        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-amber-200">
                          <span className="text-stone-400">פרק</span> {discovery.chapter}
                        </div>
                        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-amber-200">
                          <span className="text-stone-400">פסוק</span> {discovery.verse}
                        </div>
                      </div>
                      <h3 className="text-4xl font-bold tanakh-font text-stone-900 mb-4">
                        {discovery.text}
                      </h3>
                      {discovery.meaning && (
                        <div className="bg-white/50 p-4 rounded-lg border border-amber-100">
                           <p className="text-stone-700 text-lg leading-relaxed flex gap-2">
                             <Info size={20} className="text-amber-600 flex-shrink-0 mt-1" />
                             {discovery.meaning}
                           </p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-6 rounded-full border-4 border-amber-200 shadow-inner hidden md:block">
                      <Sparkles size={48} className="text-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="לחץ על 'גילוי פלינדרומים' כדי לחפש רצפים בתנ&quot;ך." />
            )
          )}
        </div>
      </main>

      <footer className="w-full mt-12 py-8 border-t border-stone-200 text-center text-stone-500 text-sm">
        <p>כלי מחקר למבנה הטקסט המקראי - פלינדרומים בתנ"ך</p>
      </footer>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 text-stone-400">
    <div className="bg-stone-100 p-6 rounded-full mb-6">
      <Search size={48} strokeWidth={1} />
    </div>
    <p className="text-xl text-center max-w-md">{message}</p>
  </div>
);

export default App;
