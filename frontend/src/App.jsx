import React, { useState, useEffect } from 'react';
import { getTemplate, updateItem, updateInspection } from './api'; // Added updateInspection
import { ChevronLeft, Camera, CheckCircle, Home as HomeIcon } from 'lucide-react';
import Login from './Login';

const CATEGORY_ICONS = {
  "General Info": "📋", 
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
  "Not Inspected", "Satisfactory", "Monitor", "Near End of Service Life",
  "Minor Defect", "Significant Deficiency", "Cosmetic Defect"
];

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access'));

  const [inspections, setInspections] = useState([]); // Stores list of all your reports
  const [template, setTemplate] = useState(null);    // Stores the ONE active report you clicked
  const [view, setView] = useState('dashboard');      // Start at the list of reports

  
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Not Inspected');
  const [answer, setAnswer] = useState(null);
  const [notes, setNotes] = useState('');


   // IF NOT LOGGED IN, SHOW LOGIN PAGE
 useEffect(() => { 
    if (isAuthenticated) {
      // Changed from getTemplate to getMyInspections
      getMyInspections().then(setInspections); 
    }
  }, [isAuthenticated]);

  // 3. NOW you can handle the early return/gatekeeper
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // DASHBOARD VIEW
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Header />
        <div className="max-w-lg mx-auto space-y-4">
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
            className="w-full bg-append-orange p-8 rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition-all"
          >
            + NEW INSPECTION
          </button>
          
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Your History</h2>
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

  // ... (the rest of your grid, list, and form views)



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

  // 1. SAVE FOR FINDINGS (Toilet, Roof, etc)
  const handleSave = async () => {
    const payload = { item_name: itemName, location, status, answer, note: notes };
    try {
      await updateItem(selectedItem.id, payload);
      const updatedItems = template.items.map(it => it.id === selectedItem.id ? { ...it, ...payload } : it);
      setTemplate({ ...template, items: updatedItems });
      setView('list');
    } catch (err) { alert("Save failed."); }
  };

  // 2. SAVE FOR GENERAL INFO (Address, Client Name, Status)
  const handleGeneralSave = async () => {
    try {
      await updateInspection(template.id, template);
      setView('grid');
    } catch (err) { alert("Update failed."); }
  };

  const Header = () => (
    <header className="bg-append-navy p-6 shadow-xl mb-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-1">
        <HomeIcon className="text-append-orange" size={24} />
        <h1 className="text-black text-2xl font-bold tracking-tighter uppercase italic">
          Append <span className="text-append-orange">One</span>
        </h1>
      </div>
      <p className="text-black-200 text-[9px] font-black tracking-[0.3em] uppercase opacity-70">Field Inspection Tool</p>
    </header>
  );

  // VIEW: GENERAL INFO FORM
  if (view === 'general_info') {
  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
      <Header />
      <div className="px-4 max-w-lg mx-auto">
        <button onClick={() => setView('grid')} className="text-append-navy flex items-center mb-4 font-black text-xs tracking-widest uppercase">
          <ChevronLeft size={18} /> BACK TO SYSTEMS
        </button>

        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-2xl font-black text-append-navy mb-2 italic">Inspection Details</h2>
          
          <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto px-1">
            {/* Property & Client */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Property Address</label>
              <input value={template?.property_address || ''} onChange={(e) => setTemplate({...template, property_address: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Client Name</label>
              <input value={template?.client_name || ''} onChange={(e) => setTemplate({...template, client_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
            </div>

            {/* Company & Inspector Info */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Inspection Company</label>
              <input value={template?.inspection_company || ''} onChange={(e) => setTemplate({...template, inspection_company: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Inspector Name</label>
              <input value={template?.inspector_name || ''} onChange={(e) => setTemplate({...template, inspector_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
            </div>

            {/* Field Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Weather</label>
                <input value={template?.weather_conditions || ''} onChange={(e) => setTemplate({...template, weather_conditions: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="Sunny, 75°F" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Year Built</label>
                <input type="number" value={template?.year_built || ''} onChange={(e) => setTemplate({...template, year_built: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-1">In Attendance</label>
              <input value={template?.in_attendance || ''} onChange={(e) => setTemplate({...template, in_attendance: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="Buyer, Agent" />
            </div>

            {/* Status Selection */}
            <div className="space-y-1 pt-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Inspection Status</label>
              <select 
                value={template?.inspection_status || 'active'} 
                onChange={(e) => setTemplate({...template, inspection_status: e.target.value})}
                className="w-full p-4 bg-append-navy text-white rounded-2xl text-sm font-bold appearance-none"
              >
                <option value="active">In Progress (Active)</option>
                <option value="final">Complete (Finalized)</option>
              </select>
            </div>
          </div>

          <button onClick={handleGeneralSave} className="w-full bg-append-orange text-black py-5 rounded-full font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all">
            UPDATE ALL GENERAL INFO
          </button>
        </div>
      </div>
    </div>
  );
}

  // VIEW: ITEM FORM (Findings/Questions)
  if (view === 'form' && selectedItem) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
        <Header />
        <div className="px-4 max-w-lg mx-auto">
          <button onClick={() => setView('list')} className="text-append-navy flex items-center mb-4 font-black text-xs tracking-widest uppercase">
            <ChevronLeft size={18} /> BACK TO LIST
          </button>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-append-orange font-black text-[10px] uppercase tracking-[0.2em] mb-1">{selectedItem.category}</h2>
              <h3 className="text-2xl font-bold text-slate-800 leading-tight">{selectedItem.sub_category}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Identify Item</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Toilet" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-append-navy outline-none focus:ring-2 focus:ring-append-orange" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Master Bath" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-append-navy outline-none focus:ring-2 focus:ring-append-orange" />
              </div>
            </div>
            {selectedItem.field_type === 'QUESTION' ? (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Legal Answer</label>
                <div className="flex gap-2">
                  {['YES', 'NO', 'NA'].map(opt => (
                    <button key={opt} onClick={() => setAnswer(opt)} className={`flex-1 py-4 rounded-full font-black border-2 transition-all ${answer === opt ? 'bg-append-orange border-append-orange text-white' : 'bg-white border-slate-200 text-slate-500'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">System Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none">
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Observations</label>
               <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-append-navy outline-none focus:ring-2 focus:ring-append-orange" placeholder="Type professional findings here..."></textarea>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200"><Camera size={20} /></div>
              ))}
            </div>
            <button onClick={handleSave} className="w-full bg-append-orange text-black py-5 rounded-full font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2">
              <CheckCircle size={20} /> SAVE FINDING
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: MAIN CATEGORY GRID
  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
      <Header />
      <div className="px-4 max-w-lg mx-auto">
        {view === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(CATEGORY_ICONS).map((cat) => (
              <button 
                key={cat} 
                onClick={() => { 
                  if (cat === "General Info") {
                    setView('general_info');
                  } else {
                    setActiveCategory(cat); 
                    setView('list'); 
                  }
                }} 
                className="flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] shadow-sm border-b-8 border-append-orange active:translate-y-2 transition-all"
              >
                <div className="text-4xl mb-3">{CATEGORY_ICONS[cat]}</div>
                <span className="text-[10px] font-black text-center text-append-navy uppercase px-1 leading-tight">{cat}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={() => setView('grid')} className="text-append-navy font-black text-xs tracking-widest flex items-center mb-6 uppercase">
              <ChevronLeft size={18} /> BACK TO SYSTEMS
            </button>
            <h2 className="text-2xl font-black text-append-navy mb-6 italic">{activeCategory}</h2>
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