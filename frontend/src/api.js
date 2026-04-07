import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

// --- UPDATED FUNCTIONS WITH LEADING SLASHES ---

export const getMyInspections = async () => {
  try {
    // Added / before inspections
    const response = await axios.get(`${API_URL}/inspections/`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return [];
  }
};

export const createInspectionFromTemplate = async (address, client) => {
  // Added / before inspections
  const response = await axios.post(`${API_URL}/inspections/create_from_template/`, 
    { property_address: address, client_name: client }, getAuthHeader());
  return response.data;
};

export const updateItem = async (itemId, data) => {
  // Added / before items
  const response = await axios.patch(`${API_URL}/items/${itemId}/`, data, getAuthHeader());
  return response.data;
};

export const updateInspection = async (id, data) => {
  const token = localStorage.getItem('access');
  const isFormData = data instanceof FormData;

  // Added / before inspections
  const response = await axios.patch(`${API_URL}/inspections/${id}/`, data, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
    }
  });
  return response.data;
};

export const downloadInspectionReport = async (inspectionId, propertyAddress) => {
  const token = localStorage.getItem('access');
  try {
    // Added / before inspections
    const response = await axios.get(`${API_URL}/inspections/${inspectionId}/download_report/`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob', 
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report_${propertyAddress.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Could not generate report. Please try again.");
  }
};

export const createItem = async (data) => {
  const token = localStorage.getItem('access'); 
  // Added / before items
  const response = await axios.post(`${API_URL}/items/`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteItem = async (itemId) => {
  // Added / before items
  const response = await axios.delete(`${API_URL}/items/${itemId}/`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
  });
  return response.data;
};

export const uploadPhoto = async (itemId, file) => {
  const token = localStorage.getItem('access');
  const formData = new FormData();
  if (itemId) {
    formData.append('item', itemId);
  }
  formData.append('image', file);

  // Added / before photos
  const response = await axios.post(`${API_URL}/photos/`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

export const deletePhoto = async (photoId) => {
  const token = localStorage.getItem('access');
  // Added / before photos
  const response = await axios.delete(`${API_URL}/photos/${photoId}/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};