import React, { useState, useEffect } from 'react';
import { getTemplate, updateItem } from './api';
import { ChevronLeft, Camera, CheckCircle, Home as HomeIcon } from 'lucide-react';

const CATEGORY_ICONS = {
  "Structural system and foundation": "🏗️",
  "Exterior": "🏡",
  "Plumbing System": "💧",
  "Electrical System": "⚡",
  "Heating System": "🔥",
  "Cooling System": "❄️",
  "Interior": "🏠",
  "Attic, Insulation and Ventilation": "💨",
  "Fireplaces": "🧱",
  "Garage": "🚗"
};

const STATUS_OPTIONS = [
  "Not Inspected",
  "Satisfactory",
  "Monitor",
  "Near End of Service Life",
  "Minor Defect",
  "Significant Deficiency",
  "Cosmetic Defect"
];

function App() {
  const [template, setTemplate] = useState(null);
  const [view, setView] = useState('grid'); 
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Not Inspected');
  const [answer, setAnswer] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { 
    getTemplate().then(setTemplate); 
  }, []);

  const filteredItems = template?.items?.filter(item => item.category === activeCategory) || [];

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemName(item.item_name || '');
    setLocation(item.location || '');
    setNotes(item.note || '');
    setAnswer(item.answer || null);
    setStatus(item.status || (item.field_type === 'QUESTION' ? '' : 'Not Inspected'));
    setView('form');
  };

  const handleSave = async () => {
    const payload = {
      item_name: itemName,
      location: location,
      status: status,
      answer: answer,
      note: notes,
    };

    try {
      await updateItem(selectedItem.id, payload);
      const updatedItems = template.items.map(it => 
        it.id === selectedItem.id ? { ...it, ...payload } : it
      );
      setTemplate({ ...template, items: updatedItems });
      setView('list');
    } catch (err) {
      alert("Error saving data. Is the backend running?");
    }
  };

  // --- BRANDED COMPONENTS ---

  const Header = () => (
    <header className="bg-append-navy p-6 shadow-xl mb-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-1">
        <HomeIcon className="text-append-orange" size={24} />
        <h1 className="text-white text-2xl font-bold tracking-tighter uppercase italic">
          Append <span className="text-append-orange">One</span>
        </h1>
      </div>
      <p className="text-blue-200 text-[9px] font-black tracking-[0.3em] uppercase opacity-70">Field Inspection Tool</p>
    </header>
  );

  // --- FORM VIEW ---
  if (view === 'form' && selectedItem) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <Header />
        <div className="px-4 max-w-lg mx-auto">
          <button onClick={() => setView('list')} className="text-append-navy flex items-center mb-4 font-black text-xs tracking-widest uppercase">
            <ChevronLeft size={18} /> Back to List
          </button>

          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-append-orange font-black text-[10px] uppercase tracking-[0.2em] mb-1">{selectedItem.category}</h2>
              <h3 className="text-xl font-bold text-append-navy leading-tight">{selectedItem.sub_category}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Identify Item</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Toilet" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-append-orange" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Master Bath" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-append-orange" />
              </div>
            </div>

            {selectedItem.field_type === 'QUESTION' ? (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Legal Answer</label>
                <div className="flex gap-2">
                  {['YES', 'NO', 'NA'].map(opt => (
                    <button key={opt} onClick={() => setAnswer(opt)} className={`flex-1 py-4 rounded-full font-black border-2 transition-all ${answer === opt ? 'bg-append-orange border-append-orange text-white shadow-lg shadow-orange-200' : 'bg-white border-slate-100 text-slate-400'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">System Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none appearance-none">
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Observations</label>
               <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-append-orange" placeholder="Type professional findings here..."></textarea>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200"><Camera size={20} /></div>
              ))}
            </div>

            <button onClick={handleSave} className="w-full bg-append-orange text-white py-5 rounded-full font-black text-lg shadow-xl shadow-orange-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              <CheckCircle size={20} /> SAVE FINDING
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GRID/LIST VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Header />
      <div className="px-4 max-w-lg mx-auto">
        {view === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(CATEGORY_ICONS).map((cat) => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setView('list'); }} className="flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] shadow-sm border-b-8 border-append-orange active:translate-y-2 transition-all group">
                <div className="text-4xl mb-3 group-active:scale-110 transition-transform">{CATEGORY_ICONS[cat]}</div>
                <span className="text-[10px] font-black text-center text-append-navy uppercase leading-tight px-1">{cat}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={() => setView('grid')} className="text-append-navy font-black text-xs tracking-widest flex items-center mb-6 uppercase">
              <ChevronLeft size={18} /> Back to Systems
            </button>
            
            <div className="flex items-center gap-4 mb-8">
               <div className="text-4xl p-4 bg-white rounded-3xl shadow-sm">{CATEGORY_ICONS[activeCategory]}</div>
               <h2 className="text-2xl font-black text-append-navy leading-tight">{activeCategory}</h2>
            </div>

            <div className="space-y-3">
              {filteredItems.map((item) => {
                const isDone = (item.answer !== null) || (item.status && item.status !== 'Not Inspected');
                return (
                  <button key={item.id} onClick={() => handleSelectItem(item)} className={`w-full text-left p-6 rounded-[2rem] shadow-sm border-2 transition-all flex justify-between items-center ${isDone ? 'bg-white border-green-500' : 'bg-white border-slate-100'}`}>
                    <div className="flex flex-col pr-4">
                      <span className={`text-sm font-bold ${isDone ? 'text-green-700' : 'text-slate-700'}`}>{item.sub_category}</span>
                      {isDone && <span className="text-[9px] font-black text-green-500 uppercase mt-1 tracking-tighter">Completed: {item.answer || item.status}</span>}
                    </div>
                    <span className={isDone ? 'text-green-500 font-black' : 'text-slate-300'}>{isDone ? '✓' : '→'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;