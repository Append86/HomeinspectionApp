import React, { useState, useEffect } from 'react';
import { getMyInspections, updateItem, updateInspection, createInspectionFromTemplate, downloadInspectionReport, createItem, deleteItem, uploadPhoto, deletePhoto} from './api';
import { ChevronLeft, Camera, CheckCircle, Home as HomeIcon, FileText, LogOut, Trash2 } from 'lucide-react';
import Login from './Login';


const CATEGORY_ICONS = {
  "General Info": "📋", "Structural system and foundation": "🏗️", "Exterior": "🏡", "Plumbing System": "💧",
  "Electrical System": "⚡", "Heating System": "🔥", "Cooling System": "❄️",
  "Interior": "🏠", "Attic, Insulation and Ventilation": "💨", "Fireplaces": "🧱", "Garage": "🚗"
};

const STATUS_OPTIONS = [
 { key: 'NI', label: 'Not Inspected' },
  { key: 'NDO', label: 'No Defects Observed' },
  { key: 'MON', label: 'Monitor' },
  { key: 'EOSL', label: 'Near End of Service Life' },
  { key: 'MINOR', label: 'Minor Defect' },
  { key: 'SIG', label: 'Significant Deficiency' },
  { key: 'COS', label: 'Cosmetic Defect' },
  { key: 'NOTE', label: 'See Notes' },
  { key: 'YES', label: 'Yes' },
  { key: 'NO', label: 'No' },
  { key: 'NA', label: 'N/A'},
];

const Modal = ({ isOpen, title, children, onClose, onConfirm, confirmText = "Confirm", isDelete = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-append-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl scale-in-center">
        <div className="p-8">
          <h3 className="text-2xl font-black text-append-navy mb-4 italic uppercase">{title}</h3>
          <div className="text-slate-600 font-medium">{children}</div>
          <div className="mt-8 flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 rounded-full font-black text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              className={`flex-1 py-4 rounded-full font-black text-black transition-all uppercase tracking-widest text-xs shadow-lg ${isDelete ? 'bg-red-500 shadow-red-100' : 'bg-append-orange text-append-navy shadow-orange-100'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access'));
  const [inspections, setInspections] = useState([]); 
  const [template, setTemplate] = useState(null);    
  const [view, setView] = useState('dashboard');      
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('NI');
  const [answer, setAnswer] = useState(null);
  const [notes, setNotes] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInspectData, setNewInspectData] = useState({ address: '', client: '' });
  const [errorMsg, setErrorMsg] = useState(null); // Replace alert() with this

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [isUploading, setIsUploading] = useState(false);


useEffect(() => {
  if (view === 'profile' && isAuthenticated) {
    // If no inspection is active, we fetch your latest one to pull profile data
    if (!template && inspections.length > 0) {
      setTemplate(inspections[0]);
    }
  }
}, [view, inspections, isAuthenticated, template]);


  useEffect(() => { 
    if (isAuthenticated) {
      getMyInspections().then(setInspections); 
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setIsAuthenticated(false);
    setView('dashboard');
    setTemplate(null);
  };

  //upload logo function to be used in the profile view
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    
    // Safety check: Is there actually a file?
    if (!file) return;

    // 1. Store the actual File object in our new state (defined below)
    setLogoFile(file);

    // 2. Create a temporary "Local URL" so the UI updates immediately
    // This lets you see the logo before it even hits the server
    const localPreview = URL.createObjectURL(file);
    
    setTemplate({ 
      ...template, 
      company_logo: localPreview 
    });

    setErrorMsg("Logo staged - Press SAVE to finalize");
  };

  // Add this function to handle the Modal's confirmation
 const handleCreateRequest = async () => {
  if (newInspectData.address && newInspectData.client) {
    try {
      // 1. Create the new report from template
      const newReport = await createInspectionFromTemplate(newInspectData.address, newInspectData.client);
      
      // 2. AUTO-FILL: Inject your saved profile into this specific new report
      const brandedReport = {
        ...newReport,
        inspector_name: template?.inspector_name,
        inspection_company: template?.inspection_company,
        inspection_company_address: template?.inspection_company_address,
        phone_number: template?.phone_number,
        company_email: template?.company_email,
        inspector_license_number: template?.inspector_license_number,
        license_expiration_date: template?.license_expiration_date,
        company_logo: template?.company_logo
      };

      // 3. Save the branded version immediately
      await updateInspection(newReport.id, brandedReport);
      
      setTemplate(brandedReport);
      setIsModalOpen(false); 
      setView('grid');
      setErrorMsg("New Branded Report Created!");
      getMyInspections().then(setInspections);
    } catch (err) {
      setErrorMsg("Failed to create branded report");
    }
  }
};

  const handleSelectItem = (item) => {
  setSelectedItem(item);
  setItemName(item.item_name || '');
  setLocation(item.location || '');
  setNotes(item.note || '');
  // FORCE INITIAL KEY: prevents 'Not Inspected' from entering the state
  const cleanStatus = item.status === 'Not Inspected' ? 'NI' : (item.status || 'NI');
  setStatus(cleanStatus); 
  setView('form');
};
  const handleDeleteItem = (e, itemId) => {
  e.stopPropagation(); // Prevents opening the edit form
  setItemToDelete(itemId);
  setIsDeleteModalOpen(true);
};

// Create a new function for the actual deletion
const confirmDelete = async () => {
  if (!itemToDelete) return;
  
  try {
    await deleteItem(itemToDelete);
    const updatedItems = template.items.filter(it => it.id !== itemToDelete);
    setTemplate({ ...template, items: updatedItems });
    setErrorMsg("Entry Removed Successfully");
  } catch (err) {
    setErrorMsg("Delete Failed - Server Error");
  } finally {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }
};

  // Update your handleSave function
const handleSave = async (shouldAddAnother = false) => {
  if (!template?.id || !selectedItem) return;

  const payload = { 
    inspection: template.id,
    category: selectedItem.category,
    sub_category: selectedItem.sub_category,
    item_name: itemName || selectedItem.sub_category, 
    location: location, 
    status: status.length > 5 ? 'NI' : status, 
    note: notes,
    field_type: selectedItem.field_type || 'FINDING'
  };

  try {
    const newItem = await createItem(payload);
    setTemplate(prev => ({ ...prev, items: [...prev.items, newItem] }));

    if (shouldAddAnother) {
      // --- RESET DATA FOR THE NEXT FINDING ---
      setItemName(''); // Clear the name
      setLocation(''); // Clear the location
      setNotes('');    // Clear the notes
      setStatus('NI'); // Reset status to default
      
      // NEW LINE: This clears the photos from the UI for the next entry
      setSelectedItem({ ...selectedItem, id: null, photos: [] }); 
      
      setErrorMsg("Saved - Add Next");
    } else {
      setView('list');
      setSelectedItem(null);
    }
  } catch (err) {
    setErrorMsg("Save Failed - Data Format Error");
  }
};

// Add this function back to resolve the ReferenceError
  const handleGeneralSave = async () => {
    try {
      setErrorMsg("Saving Profile...");
      const data = new FormData();
      
      // If we have a staged logo file, add it to the upload
      if (logoFile) {
        data.append('company_logo', logoFile);
      }

      // Add the rest of your profile fields
      data.append('inspector_name', template.inspector_name || '');
      data.append('inspection_company', template.inspection_company || '');
      data.append('inspection_company_address', template.inspection_company_address || '');
      data.append('phone_number', template.phone_number || '');
      data.append('company_email', template.company_email || '');
      data.append('inspector_license_number', template.inspector_license_number || '');
      data.append('license_expiration_date', template.license_expiration_date || '');

      // Send to the SMART updateInspection function we fixed in api.js
      await updateInspection(template.id, data);
      
      setErrorMsg("Profile & Logo Saved!");
      setLogoFile(null); // Clear the stage
      setView('dashboard');
      
      // Refresh list to show new branding
      getMyInspections().then(setInspections);
    } catch (err) { 
      setErrorMsg("Save Failed - Check image size"); 
    }
  };

  const isDefect = (item) => {
  const defectStatuses = ['MON', 'EOSL', 'MINOR', 'SIG', 'NI'];
  return defectStatuses.includes(item.status);
};

  // Helper to determine if a sub-category has a real entry
const hasEntry = (item) => {
  return (item.note && item.note.trim() !== "") || 
         (item.location && item.location.trim() !== "") || 
         (item.status && item.status !== 'NI' && item.status !== 'Not Inspected');
};

const handlePhotoDelete = async (e, photoId) => {
  e.stopPropagation(); // Prevent triggering other click events
  if (!window.confirm("Delete this photo?")) return;

  try {
    await deletePhoto(photoId);
    
    // 1. Update the selectedItem state for the current form view
    const updatedSelectedPhotos = selectedItem.photos.filter(p => p.id !== photoId);
    setSelectedItem({ ...selectedItem, photos: updatedSelectedPhotos });

    // 2. Update the main template state so the change persists
    const updatedItems = template.items.map(it => {
      if (it.id === selectedItem.id) {
        return { ...it, photos: updatedSelectedPhotos };
      }
      return it;
    });
    setTemplate({ ...template, items: updatedItems });
    
    setErrorMsg("Photo Deleted");
  } catch (err) {
    setErrorMsg("Failed to delete photo");
  }
};

  // --- MODERN HEADER WITH LOGOUT ---
  const Header = () => (
    <header className="bg-white border-b border-slate-100 p-6 shadow-sm mb-6 flex flex-col items-center relative">
      <button 
  onClick={() => setView('dashboard')}
  className="flex items-center gap-2 mb-1 active:scale-95 transition-all"
>
  <HomeIcon className="text-append-orange" size={24} />
  <h1 className="text-append-navy text-2xl font-black tracking-tighter uppercase italic">
    Append <span className="text-append-orange">One</span>
  </h1>
</button>
      <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
        Field Inspection Tool
      </p>
      
      {/* Logout Button placed in the header for easy access */}
      <button 
        onClick={handleLogout}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-append-orange transition-colors"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </header>
  );

  // ✅ CORRECT: Use the 'uploadPhoto' function you imported at the top
const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    // CRITICAL: Ensure we have both the file AND the selectedItem with an ID
    if (!file || !selectedItem || !selectedItem.id) {
      setErrorMsg("Please save the item first before adding photos.");
      return;
    }

    setIsUploading(true);

    try {
      // Use the function from api.js - it handles the FormData and headers correctly
      const newPhotoData = await uploadPhoto(selectedItem.id, file);
      
      // Update the local state for immediate UI feedback
      const updatedPhotos = [...(selectedItem.photos || []), newPhotoData];
      const updatedItem = { ...selectedItem, photos: updatedPhotos };
      setSelectedItem(updatedItem);

      // Update the main template state
      const updatedItems = template.items.map(it => 
        it.id === selectedItem.id ? updatedItem : it
      );
      setTemplate({ ...template, items: updatedItems });

      setErrorMsg("Photo Uploaded!");
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg("Upload failed. Check server logs.");
    } finally {
      setIsUploading(false);
    }
};

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Header />
        <div className="max-w-lg mx-auto space-y-4 text-append-navy">

          {/* NEW: Profile Settings Quick Link */}
        <button 
          onClick={() => setView('profile')}
          className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-append-orange/10 rounded-full flex items-center justify-center text-append-orange">
              <FileText size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inspector Profile</p>
              <p className="text-xs font-bold text-append-navy">Manage Branding & License</p>
            </div>
          </div>
          <ChevronLeft size={18} className="rotate-180 text-slate-300 group-hover:text-append-orange" />
        </button>

          {/* UPDATED BUTTON: No more prompt() here */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-append-orange p-8 rounded-[2.5rem] font-black text-xl shadow-xl hover:shadow-orange-200 active:scale-95 transition-all text-append-navy"
          >
            + NEW INSPECTION
          </button>

          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Recent Inspections</h2>
          {inspections.map(ins => (
            <div key={ins.id} className="w-full bg-white p-6 rounded-[2rem] border-b-4 border-slate-200 shadow-sm text-left transition-all">
    
    {/* Clickable Area 1: Top part opens the Grid as usual */}
    <div 
      onClick={() => { setTemplate(ins); setView('grid'); }} 
      className="cursor-pointer active:opacity-70"
    >
      <p className="font-black text-append-navy uppercase italic">{ins.property_address}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
        {ins.client_name} • {ins.inspection_status}
      </p>
    </div>
    
    {/* NEW: Clickable Area 2: Bottom button opens the Summary */}
    <button 
      onClick={(e) => { e.stopPropagation(); setTemplate(ins); setView('summary'); }}
      className="w-full py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-append-navy hover:bg-append-orange/10 active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      📋 View Defect Summary
    </button>
  </div>
))}
        </div>

        {/* NEW MODAL: This replaces the browser prompts */}
        <Modal 
          isOpen={isModalOpen} 
          title="New Inspection" 
          onClose={() => setIsModalOpen(false)} 
          onConfirm={handleCreateRequest}
          confirmText="Create Report"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Property Address</label>
              <input 
                autoFocus
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-append-navy font-bold outline-none focus:border-append-orange transition-colors"
                placeholder="123 Main St..."
                onChange={(e) => setNewInspectData({...newInspectData, address: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Client Name</label>
              <input 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-append-navy font-bold outline-none focus:border-append-orange transition-colors"
                placeholder="John Doe"
                onChange={(e) => setNewInspectData({...newInspectData, client: e.target.value})}
              />
            </div>
          </div>
        </Modal>
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
            
            {/* Scrollable container for the many form fields */}
            <div className="grid grid-cols-1 gap-4 max-h-[65vh] overflow-y-auto px-1 custom-scrollbar">
              
              {/* Property & Client Info */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Property Address</label>
                <input value={template?.property_address || ''} onChange={(e) => setTemplate({...template, property_address: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Name</label>
                  <input value={template?.client_name || ''} onChange={(e) => setTemplate({...template, client_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Email</label>
                  <input type="email" value={template?.client_email || ''} onChange={(e) => setTemplate({...template, client_email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
              </div>

              {/* Inspection Logistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                  <input type="date" value={template?.date_of_inspection || ''} onChange={(e) => setTemplate({...template, date_of_inspection: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Time</label>
                  <input type="time" value={template?.inspection_time || ''} onChange={(e) => setTemplate({...template, inspection_time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Inspection Company</label>
                <input value={template?.inspection_company || ''} onChange={(e) => setTemplate({...template, inspection_company: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Address</label>
                <input value={template?.inspection_company_address || ''} onChange={(e) => setTemplate({...template, inspection_company_address: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Phone</label>
                  <input value={template?.phone_number || ''} onChange={(e) => setTemplate({...template, phone_number: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Email</label>
                  <input type="email" value={template?.company_email || ''} onChange={(e) => setTemplate({...template, company_email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
              </div>

              {/* Inspector Details */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Inspector Name</label>
                <input value={template?.inspector_name || ''} onChange={(e) => setTemplate({...template, inspector_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">License #</label>
                  <input value={template?.inspector_license_number || ''} onChange={(e) => setTemplate({...template, inspector_license_number: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">License Expiry</label>
                  <input type="date" value={template?.license_expiration_date || ''} onChange={(e) => setTemplate({...template, license_expiration_date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
              </div>

              {/* Conditions & Building Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Weather</label>
                  <input value={template?.weather_conditions || ''} onChange={(e) => setTemplate({...template, weather_conditions: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" placeholder="Sunny" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">In Attendance</label>
                  <input value={template?.in_attendance || ''} onChange={(e) => setTemplate({...template, in_attendance: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Occupancy</label>
                  <input value={template?.occupancy || ''} onChange={(e) => setTemplate({...template, occupancy: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bldg Type</label>
                  <input value={template?.building_type || ''} onChange={(e) => setTemplate({...template, building_type: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Year Built</label>
                  <input type="number" value={template?.year_built || ''} onChange={(e) => setTemplate({...template, year_built: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy" />
                </div>
              </div>

              {/* Agreement & Status */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input 
                  type="checkbox" 
                  checked={template?.signed_agreement || false} 
                  onChange={(e) => setTemplate({...template, signed_agreement: e.target.checked})} 
                  className="w-5 h-5 accent-append-orange" 
                />
                <label className="text-[10px] font-black text-append-navy uppercase tracking-widest">Signed Agreement Received</label>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Report Status</label>
                <select 
                  value={template?.inspection_status || 'active'} 
                  onChange={(e) => setTemplate({...template, inspection_status: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-append-navy outline-none focus:border-append-orange transition-colors"
                >
                  <option value="active">In Progress (Active)</option>
                  <option value="final">Complete (Finalized)</option>
                </select>
              </div>
            </div>

            <button onClick={handleGeneralSave} className="w-full bg-append-orange text-append-navy py-5 rounded-3xl font-black text-lg shadow-xl active:scale-95">UPDATE GENERAL INFO</button>
            
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

  if (view === 'profile') {
  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
      <Header />
      <div className="px-4 max-w-lg mx-auto">
        <button 
          onClick={() => setView('dashboard')} 
          className="text-append-navy flex items-center mb-6 font-black text-xs tracking-widest uppercase"
        >
          <ChevronLeft size={18} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6">
          <h2 className="text-2xl font-black italic uppercase mb-2">Inspector Profile</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Manage your professional branding & credentials
          </p>
        </div>

        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          
          {/* 1. Logo Upload Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                {template?.company_logo ? (
                  <img src={template.company_logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Camera size={24} className="text-slate-300" />
                )}
              </div>
              <label className="bg-append-navy text-black px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest cursor-pointer active:scale-95 transition-all">
                Upload New Logo
                <input 
    id="logo-upload-input" // Add this ID
    type="file" 
    accept="image/*" 
    className="hidden" 
    onChange={handleLogoUpload} 
  />
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. Professional Details */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none focus:border-append-orange transition-all"
                value={template?.inspector_name || ''} 
                onChange={(e) => setTemplate({...template, inspector_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">License #</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none"
                  value={template?.inspector_license_number || ''} 
                  onChange={(e) => setTemplate({...template, inspector_license_number: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">License Expiry</label>
                <input 
                  type="date"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none"
                  value={template?.license_expiration_date || ''} 
                  onChange={(e) => setTemplate({...template, license_expiration_date: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* 3. Company Details */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none"
                value={template?.inspection_company || ''} 
                onChange={(e) => setTemplate({...template, inspection_company: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Address</label>
              <input 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none"
                value={template?.inspection_company_address || ''} 
                onChange={(e) => setTemplate({...template, inspection_company_address: e.target.value})}
              />
            </div>
            {/* Add this inside the Company Details section of your Profile View */}
<div className="grid grid-cols-2 gap-3">
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Phone</label>
    <input 
      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none"
      value={template?.phone_number || ''} 
      onChange={(e) => setTemplate({...template, phone_number: e.target.value})}
    />
  </div>
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Email</label>
    <input 
      type="email"
      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy outline-none"
      value={template?.company_email || ''} 
      onChange={(e) => setTemplate({...template, company_email: e.target.value})}
    />
  </div>
</div>
          </div>

          <button 
            onClick={handleGeneralSave} 
            className="w-full bg-append-orange text-append-navy py-5 rounded-full font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all mt-4"
          >
            SAVE PROFILE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
}

  if (view === 'summary') {
  const defects = template?.items?.filter(item => isDefect(item)) || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-append-navy">
      <Header />
      <div className="px-4 max-w-lg mx-auto">
        <button onClick={() => setView('dashboard')} className="text-append-navy flex items-center mb-6 font-black text-xs tracking-widest uppercase">
          <ChevronLeft size={18} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6">
          <h2 className="text-2xl font-black italic uppercase mb-2">Defect Summary</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {defects.length} Issues Identified at {template?.property_address}
          </p>
        </div>

        <div className="space-y-4">
          {defects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <p className="font-bold text-slate-400 uppercase text-xs tracking-widest">No Defects Found</p>
            </div>
          ) : (
            defects.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] border-l-8 border-append-orange shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-append-orange uppercase tracking-widest">
                    {item.category}
                  </span>
                  <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-red-100">
                    {STATUS_OPTIONS.find(o => o.key === item.status)?.label}
                  </span>
                </div>
                <h4 className="font-black text-append-navy uppercase italic text-sm mb-1">
                  {item.sub_category} {item.location && `(${item.location})`}
                </h4>
                <p className="text-slate-600 text-xs font-medium leading-relaxed italic">
                  "{item.note || 'No specific notes provided.'}"
                </p>
                
                {/* Thumbnail Previews */}
                {item.photos?.length > 0 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {item.photos.map(p => (
                      <img key={p.id} src={p.image} className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
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
  <input 
    value={itemName} 
    onChange={e => setItemName(e.target.value)} 
    placeholder="e.g. North Wall, Main Toilet, etc." // Descriptive example text
    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-append-navy outline-none" 
  />
</div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Master Bath" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-append-navy outline-none" />
              </div>
            </div>

            {/* Unified Status Dropdown (Replaces YES/NO/NA logic) */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase ml-1">System Status</label>
             <select 
  value={status} 
  onChange={e => setStatus(e.target.value)} 
  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-append-navy"
>
  {STATUS_OPTIONS.map(opt => (
    <option key={opt.key} value={opt.key}>
      {opt.label}
    </option>
  ))}
</select>
            </div>

            {/* Updated Label: Notes/Observations */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Notes/Observations
              </label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                rows="4" 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-base font-bold text-append-navy outline-none focus:border-append-orange transition-colors placeholder:text-slate-300" 
                placeholder="Type notes or answer questions here..."
              />
            </div>

            <div className="space-y-2">
  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
    Photos ({selectedItem.photos?.length || 0})
  </label>
  
  <div className="grid grid-cols-4 gap-2">
    {/* Show existing uploaded photos */}
    {selectedItem.photos?.map((photo) => (
    <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group">
      <img 
        src={photo.image} 
        alt="Finding" 
        className="w-full h-full object-cover"
      />
      {/* Delete Button Overlay */}
      <button
        onClick={(e) => handlePhotoDelete(e, photo.id)}
        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg transition-transform active:scale-90"
      >
        <Trash2 size={12} />
      </button>
    </div>
  ))}

    {/* The "Add Photo" Button */}
    <label className={`flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
    isUploading ? 'bg-gray-100 border-gray-300' : 'border-orange-200 hover:bg-orange-50'
}`}>
    <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoUpload}
        disabled={isUploading}
    />
    <div className="flex flex-col items-center">
        {isUploading ? (
            <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                <span className="text-sm text-gray-500 font-medium">Uploading to Spaces...</span>
            </>
        ) : (
            <>
                <Camera className="w-8 h-8 text-orange-500 mb-2" />
                <span className="text-sm text-orange-600 font-medium">Add Photo</span>
            </>
        )}
    </div>
</label>
  </div>
</div>

            <div className="flex flex-col gap-3 mt-4">
  {/* Primary Action: Save and keep going */}
  <button 
    onClick={() => handleSave(true)}
    className="w-full bg-slate-100 text-append-navy py-4 rounded-full font-black text-xs tracking-widest border border-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
  >
    + SAVE & ADD ANOTHER
  </button>

  {/* Finalize Action: Save and go back */}
  <button 
    onClick={() => handleSave(false)}
    className="w-full bg-append-orange text-append-navy py-5 rounded-full font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
  >
    <CheckCircle size={20} /> SAVE & CLOSE
  </button>
</div>
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

          <div className="animate-in fade-in duration-500">
    {/* Navigation & Address Header */}
    <div className="px-6 mb-2 flex flex-col items-start">
      <button 
        onClick={() => setView('dashboard')}
        className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-append-orange transition-colors mb-2"
      >
        <ChevronLeft size={12} /> Back to All Inspections
      </button>
      
      {/* THE DYNAMIC ADDRESS LABEL */}
      <div className="flex items-baseline gap-2">
        <span className="text-append-orange text-xs">📍</span>
        <h2 className="text-xl font-black italic uppercase text-append-navy tracking-tight">
          {template?.property_address || "Unnamed Inspection"}
        </h2>
      </div>
      
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-5 mt-1">
        Currently Inspecting • {template?.client_name}
      </p>
    </div>
          
          <div className="grid grid-cols-2 gap-4 p-4">
            {Object.keys(CATEGORY_ICONS).map((cat) => {
  // Logic: Calculate missing sub-categories for this category
  const missingCount = (() => {
    if (cat === "General Info") return 0;

    // Get all items in this category
    const catItems = template?.items?.filter(i => i.category === cat) || [];
    
    // Get unique list of sub-category names (the "Required" list)
    const uniqueSubCats = [...new Set(catItems.map(i => i.sub_category))];
    
    // Count how many of those names have NO items that pass 'hasEntry'
    return uniqueSubCats.filter(subName => {
      const entriesForSub = catItems.filter(i => i.sub_category === subName);
      return !entriesForSub.some(item => hasEntry(item));
    }).length;
  })();

  return (
    <button 
      key={cat} 
      onClick={() => { 
        if (cat === "General Info") { setView('general_info'); } 
        else { setActiveCategory(cat); setView('list'); } 
      }} 
      className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 overflow-hidden"
    >
      {/* Dynamic Status Badge */}
      {cat !== "General Info" && (
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm transition-all border ${
          missingCount === 0 
            ? 'bg-green-500 text-white border-green-600' 
            : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {missingCount === 0 ? '✓ Complete' : `${missingCount} Missing Entry`}
        </div>
      )}

      <div className="absolute top-0 left-0 w-16 h-16 bg-append-orange/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-[3]" />
      <div className="text-5xl mb-4 transform transition-transform group-hover:scale-110">{CATEGORY_ICONS[cat]}</div>
      <span className="text-[11px] font-black text-center text-append-navy uppercase tracking-widest leading-tight">{cat}</span>
    </button>
  );
})}
          </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300 text-append-navy">
            <button onClick={() => setView('grid')} className="text-append-navy font-black text-xs tracking-widest flex items-center mb-6 uppercase"><ChevronLeft size={18} /> BACK TO SYSTEMS</button>
            <h2 className="text-2xl font-black mb-6 italic uppercase">{activeCategory}</h2>
            <div className="space-y-3">
              {filteredItems.map((item) => {
  // Use your hasEntry logic for colors and checks
  const isDone = hasEntry(item);
  
  return (
    <div 
      key={item.id} 
      onClick={() => handleSelectItem(item)} 
      className={`w-full text-left p-6 rounded-[2rem] shadow-sm border-2 transition-all flex justify-between items-center group cursor-pointer ${
        isDone ? 'bg-white border-green-500 shadow-green-50' : 'bg-white border-slate-100'
      }`}
    >
      <div className="flex flex-col pr-4">
        <span className={`text-sm font-bold ${isDone ? 'text-green-700' : 'text-slate-700'}`}>
          {item.sub_category} {item.location && `(${item.location})`}
        </span>
        {isDone && (
          <span className="text-[9px] font-black text-green-500 uppercase mt-1 tracking-tighter">
            {STATUS_OPTIONS.find(o => o.key === item.status)?.label || item.status}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* TRASH ICON LOGIC: 
            1. Only show if 'isDone' is true (it's a recorded entry, not a blank template)
            2. Removed 'opacity-0' so it's always visible on mobile/touch
        */}
        {isDone && (
  <button 
    onClick={(e) => handleDeleteItem(e, item.id)} // This triggers the staging
    className="p-3 text-slate-400 hover:text-red-500 transition-colors active:scale-90"
  >
    <Trash2 size={20} />
  </button>
)}
        
        <span className={isDone ? 'text-green-500 font-black' : 'text-slate-300'}>
          {isDone ? '✓' : '→'}
        </span>
      </div>
    </div>
  );
})}
            </div>
          </div>
        )}
      </div>

    <Modal 
  isOpen={isDeleteModalOpen} 
  title="Delete Entry?" 
  onClose={() => setIsDeleteModalOpen(false)} 
  onConfirm={confirmDelete}
  confirmText="Delete Now"
  isDelete={true} // This makes the button red in your existing component
>
  <div className="text-center py-2">
    <p className="text-slate-500 font-bold">
      Are you sure you want to remove this finding? 
    </p>
    <p className="text-[10px] text-red-400 uppercase mt-2 font-black tracking-widest">
      This action cannot be undone.
    </p>
  </div>
</Modal>

      {/* Minimal Modern Error Toast */}
{/* Update this section at the bottom of App.jsx */}
{errorMsg && (
  <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700">
    <span className="text-append-orange text-lg">●</span> 
    <span>{errorMsg}</span>
    <button 
      onClick={() => setErrorMsg(null)} 
      className="ml-4 bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
    >
      ✕
    </button>
  </div>
)}
    </div>
  );
}

export default App;