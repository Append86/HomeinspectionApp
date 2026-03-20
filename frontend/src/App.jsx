import React, { useState, useEffect } from 'react';
import { getTemplate, updateItem } from './api'; // Added updateItem here
import { ChevronLeft, Camera, CheckCircle } from 'lucide-react';

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
  const [view, setView] = useState('grid'); // 'grid', 'list', 'form'
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form States
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Not Inspected');
  const [answer, setAnswer] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { 
    getTemplate().then(setTemplate); 
  }, []);

  const filteredItems = template?.items?.filter(item => item.category === activeCategory) || [];

  // EDIT LOGIC: Pre-fill the form if data already exists
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemName(item.item_name || '');
    setLocation(item.location || '');
    setNotes(item.note || '');
    setAnswer(item.answer || null);
    setStatus(item.status || (item.field_type === 'QUESTION' ? '' : 'Not Inspected'));
    setView('form');
  };

  // SAVE LOGIC: Send to Backend
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
      
      // Update local state so the list turns green immediately
      const updatedItems = template.items.map(it => 
        it.id === selectedItem.id ? { ...it, ...payload } : it
      );
      setTemplate({ ...template, items: updatedItems });

      setView('list');
    } catch (err) {
      alert("Error saving data. Is the backend running?");
    }
  };

  // --- RENDER FORM VIEW ---
  if (view === 'form' && selectedItem) {
    return (
      <div className="min-h-screen bg-white p-4 animate-in fade-in duration-300">
        <button onClick={() => setView('list')} className="text-blue-600 flex items-center mb-4 font-bold">
          <ChevronLeft size={20} /> Back to List
        </button>

        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-blue-500 font-black">{selectedItem.category}</h2>
          <h3 className="text-xl font-bold text-slate-800">{selectedItem.sub_category}</h3>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Identify Item</label>
              <input 
                type="text" 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Toilet" 
                className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Master Bath" 
                className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          {selectedItem.field_type === 'QUESTION' ? (
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">Legal Answer</label>
              <div className="flex gap-2">
                {['YES', 'NO', 'NA'].map(opt => (
                  <button 
                    key={opt} 
                    onClick={() => setAnswer(opt)}
                    className={`flex-1 p-4 rounded-2xl font-black transition-all border-2 ${
                      answer === opt 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                      : 'bg-white text-slate-600 border-slate-100 shadow-sm'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">System Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none appearance-none shadow-sm"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Observations / Details</label>
            <textarea 
              rows="4" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Type professional findings here..."
            ></textarea>
          </div>

          <div>
             <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">Evidence Photos (4 Max)</label>
             <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 active:bg-slate-100 transition-colors cursor-pointer">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Photo {i}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-transform mt-8"
          >
            <CheckCircle /> Save to Report
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER GRID/LIST VIEWS ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-10 font-sans">
      <header className="mb-6 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">HomeInspect Pro</h1>
        <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Inspection in Progress</p>
        </div>
      </header>

      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(CATEGORY_ICONS).map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setView('list'); }}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] shadow-sm border-b-4 border-blue-500 active:bg-blue-50 active:translate-y-1 transition-all"
            >
              <div className="text-3xl mb-3">{CATEGORY_ICONS[cat]}</div>
              <span className="text-[10px] font-black text-center text-slate-500 uppercase leading-tight px-2">
                {cat}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="animate-in slide-in-from-right duration-200">
          <button onClick={() => setView('grid')} className="text-blue-600 font-black text-sm flex items-center mb-6 uppercase tracking-wider">
            <ChevronLeft size={18} className="mr-1" /> Back to Systems
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">{CATEGORY_ICONS[activeCategory]}</div>
            <h2 className="text-2xl font-black text-slate-800 leading-tight">{activeCategory}</h2>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              // LOGIC: Is this item "Done"?
              const isDone = (item.answer !== null) || (item.status && item.status !== 'Not Inspected');
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left p-5 rounded-3xl shadow-sm border flex justify-between items-center transition-all ${
                    isDone ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex flex-col pr-4">
                    <span className={`text-sm font-bold ${isDone ? 'text-green-800' : 'text-slate-700'}`}>
                      {item.sub_category}
                    </span>
                    {isDone && (
                      <span className="text-[9px] font-black text-green-600 uppercase mt-1">
                        Saved: {item.answer || item.status} {item.item_name && `- ${item.item_name}`}
                      </span>
                    )}
                  </div>
                  <span className={`${isDone ? 'text-green-500' : 'text-blue-300'} font-black`}>
                    {isDone ? '✓' : '→'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;