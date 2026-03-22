import React, { useState, useEffect } from 'react';
// Added downloadInspectionReport and createInspectionFromTemplate to imports
import { getMyInspections, updateItem, updateInspection, createInspectionFromTemplate, downloadInspectionReport } from './api';
// Added FileText to the icon imports
import { ChevronLeft, Camera, CheckCircle, Home as HomeIcon, FileText } from 'lucide-react';
import Login from './Login';

const CATEGORY_ICONS = {
  "General Info": "📋", "Structural system and foundation": "🏗️", "Exterior": "🏡", "Plumbing System": "💧",
  "Electrical System": "⚡", "Heating System": "🔥", "Cooling System": "❄️",
  "Interior": "🏠", "Attic, Insulation and Ventilation": "💨", "Fireplaces": "🧱", "Garage": "🚗"
};

const STATUS_OPTIONS = [
  "Not Inspected", "Satisfactory", "Monitor", "Near End of Service Life",
  "Minor Defect", "Significant Deficiency", "Cosmetic Defect"
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access'));
  const [inspections, setInspections] = useState([]); 
  const [template, setTemplate] = useState(null);    
  const [view, setView] = useState('dashboard');      
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Not Inspected');
  const [answer, setAnswer] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { 
    if (isAuthenticated) {
      getMyInspections().then(setInspections); 
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

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
    const payload = { item_name: itemName, location, status, answer, note: notes };
    try {
      await updateItem(selectedItem.id, payload);
      const updatedItems = template.items.map(it => it.id === selectedItem.id ? { ...it, ...payload } : it);
      setTemplate({ ...template, items: updatedItems });
      setView('list');
    } catch (err) { alert("Save failed."); }
  };

  const handleGeneralSave = async () => {
    try {
      await updateInspection(template.id, template);
      setView('grid');
    } catch (err) { alert("Update failed."); }
  };

  const Header = () => (
  <header className="bg-white border-b border-slate-100 p-6 shadow-sm mb-6 flex flex-col items-center">
    <div className="flex items-center gap-2 mb-1">
      <HomeIcon className="text-append-orange" size={24} />
      <h1 className="text-append-navy text-2xl font-black tracking-tighter uppercase italic">
        Append <span className="text-append-orange">One</span>
      </h1>
    </div>
    <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase">
      Field Inspection Tool
    </p>
  </header>
);

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Header />
        <div className="max-w-lg mx-auto space-y-4 text-append-navy">
          <button 
            onClick={async () => {
              const addr = prompt("Property Address?");
              const client = prompt("Client Name?");
              if (addr && client) {
                const newReport = await createInspectionFromTemplate(addr, client);
                setTemplate(newReport);
                setView('grid');
              }
            }}
            className="w-full bg-append-orange p-8 rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition-all text-black"
          >
            + NEW INSPECTION
          </button>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Recent Inspections</h2>
          {inspections.map(ins => (
            <button key={ins.id} onClick={() => { setTemplate(ins); setView('grid'); }} className="w-full bg-white p-6 rounded-[2rem] border-b-4 border-slate-200 shadow-sm text-left active:translate-y-1 transition-all">
              <p className="font-black text-append-navy uppercase italic">{ins.property_address}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ins.client_name} • {ins.inspection_status}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'general_info') {
    return (
      <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
        <Header />
        <div className="px-4 max-w-lg mx-auto">
          <button onClick={() => setView('grid')} className="text-append-navy flex items-center mb-4 font-black text-xs tracking-widest uppercase">
            <ChevronLeft size={18} /> BACK TO SYSTEMS
          </button>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-2xl font-black text-append-navy mb-2 italic uppercase">Inspection Details</h2>
            <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Property Address</label>
                <input value={template?.property_address || ''} onChange={(e) => setTemplate({...template, property_address: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Client Name</label>
                <input value={template?.client_name || ''} onChange={(e) => setTemplate({...template, client_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Inspection Company</label>
                <input value={template?.inspection_company || ''} onChange={(e) => setTemplate({...template, inspection_company: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Inspector Name</label>
                <input value={template?.inspector_name || ''} onChange={(e) => setTemplate({...template, inspector_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Weather</label>
                  <input value={template?.weather_conditions || ''} onChange={(e) => setTemplate({...template, weather_conditions: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="Sunny" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Year Built</label>
                  <input type="number" value={template?.year_built || ''} onChange={(e) => setTemplate({...template, year_built: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Status</label>
                <select value={template?.inspection_status || 'active'} onChange={(e) => setTemplate({...template, inspection_status: e.target.value})} className="w-full p-4 bg-append-navy text-white rounded-2xl text-sm font-bold">
                  <option value="active">In Progress (Active)</option>
                  <option value="final">Complete (Finalized)</option>
                </select>
              </div>
            </div>
            <button onClick={handleGeneralSave} className="w-full bg-append-orange text-black py-5 rounded-full font-black text-lg shadow-xl active:scale-95">UPDATE GENERAL INFO</button>
            
            <div className="pt-4 border-t border-slate-100 mt-2">
              <button 
    onClick={() => downloadInspectionReport(template.id, template.property_address)}
    className="w-full bg-append-navy text-black py-5 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3"
  >
    <FileText size={20} className="text-append-orange" />
    GENERATE PDF REPORT
  </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'form' && selectedItem) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
        <Header />
        <div className="px-4 max-w-lg mx-auto">
          <button onClick={() => setView('list')} className="text-append-navy flex items-center mb-4 font-black text-xs tracking-widest uppercase"><ChevronLeft size={18} /> BACK TO LIST</button>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-append-orange font-black text-[10px] uppercase tracking-[0.2em] mb-1">{selectedItem.category}</h2>
              <h3 className="text-2xl font-bold text-slate-800 leading-tight">{selectedItem.sub_category}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Identify Item</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Toilet" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-append-navy outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Master Bath" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-append-navy outline-none" />
              </div>
            </div>
            {selectedItem.field_type === 'QUESTION' ? (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Answer</label>
                <div className="flex gap-2">
                  {['YES', 'NO', 'NA'].map(opt => (
                    <button key={opt} onClick={() => setAnswer(opt)} className={`flex-1 py-4 rounded-full font-black border-2 transition-all ${answer === opt ? 'bg-append-orange border-append-orange text-white' : 'bg-white border-slate-200 text-slate-500'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy">
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}
           <div className="space-y-2">
  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
    Observations
  </label>
  <textarea 
    value={notes} 
    onChange={e => setNotes(e.target.value)} 
    rows="4" 
    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-base font-bold text-append-navy outline-none focus:border-append-orange transition-colors placeholder:text-slate-300" 
    placeholder="Type professional findings here..."
  />
</div>
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200"><Camera size={20} /></div>
              ))}
            </div>
            <button onClick={handleSave} className="w-full bg-append-orange text-black py-5 rounded-full font-black text-lg shadow-xl active:scale-95 flex items-center justify-center gap-2"><CheckCircle size={20} /> SAVE FINDING</button>
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = template?.items?.filter(item => item.category === activeCategory) || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
      <Header />
      <div className="px-4 max-w-lg mx-auto">
        {view === 'grid' ? (
         // Inside your view === 'grid' section
<div className="grid grid-cols-2 gap-4 p-4">
  {Object.keys(CATEGORY_ICONS).map((cat) => (
    <button 
      key={cat} 
      onClick={() => { 
        if (cat === "General Info") { setView('general_info'); } 
        else { setActiveCategory(cat); setView('list'); } 
      }} 
      className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-append-xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 overflow-hidden"
    >
      {/* Decorative background accent that appears on hover */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-append-orange/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-[3]" />
      
      <div className="text-5xl mb-4 transform transition-transform group-hover:scale-110">
        {CATEGORY_ICONS[cat]}
      </div>
      
      <span className="text-[11px] font-black text-center text-append-navy uppercase tracking-widest leading-tight">
        {cat}
      </span>
    </button>
  ))}
</div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300 text-append-navy">
            <button onClick={() => setView('grid')} className="text-append-navy font-black text-xs tracking-widest flex items-center mb-6 uppercase"><ChevronLeft size={18} /> BACK TO SYSTEMS</button>
            <h2 className="text-2xl font-black mb-6 italic uppercase">{activeCategory}</h2>
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