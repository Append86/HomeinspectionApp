import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

export const getMyInspections = async () => {
  try {
    const response = await axios.get(`${API_URL}inspections/`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return [];
  }
};

export const createInspectionFromTemplate = async (address, client) => {
  const response = await axios.post(`${API_URL}inspections/create_from_template/`, 
    { property_address: address, client_name: client }, getAuthHeader());
  return response.data;
};

export const updateItem = async (itemId, data) => {
  const response = await axios.patch(`${API_URL}items/${itemId}/`, data, getAuthHeader());
  return response.data;
};

export const updateInspection = async (id, data) => {
  const token = localStorage.getItem('access');
  
  // We use FormData for files, or JSON for regular text
  const isFormData = data instanceof FormData;

  const response = await axios.patch(`${API_URL}inspections/${id}/`, data, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      // If it's FormData, the browser handles the content-type automatically
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
    }
  });
  return response.data;
};
// Add this to your api.js
export const downloadInspectionReport = async (inspectionId, propertyAddress) => {
  const token = localStorage.getItem('access');
  try {
    const response = await axios.get(`${API_URL}inspections/${inspectionId}/download_report/`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob', // Critical for handling binary PDF data
    });

    // Create a download link in the browser
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

// Add this to your existing api.js
// frontend/src/api.js
export const createItem = async (data) => {
  const token = localStorage.getItem('access'); // Retrieve the stored login token
  const response = await axios.post(`${API_URL}items/`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Add to frontend/src/api.js
export const deleteItem = async (itemId) => {
  const response = await axios.delete(`${API_URL}items/${itemId}/`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
  });
  return response.data;
};

export const uploadPhoto = async (itemId, file) => {
  const token = localStorage.getItem('access');
  const formData = new FormData();
  
  // If we have an itemId, attach it. 
  // If not (like for a logo), the backend needs to handle it differently.
  if (itemId) {
    formData.append('item', itemId);
  }
  formData.append('image', file);

  // CHANGE: Use axios directly and add the Auth header
  const response = await axios.post(`${API_URL}photos/`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

export const deletePhoto = async (photoId) => {
  const token = localStorage.getItem('access');
  const response = await axios.delete(`${API_URL}photos/${photoId}/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};