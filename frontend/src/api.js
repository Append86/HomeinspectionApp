// import axios from 'axios';

// export const API_URL = import.meta.env.VITE_API_URL;

// const getAuthHeader = () => ({
//   headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
// });


// export const getMyInspections = async () => {
//   try {
//     // Added / before inspections
//     const response = await axios.get(`${API_URL}/inspections/`, getAuthHeader());
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching inspections:", error);
//     return [];
//   }
// };

import axios from 'axios';

// --- ADD THESE TWO LINES HERE ---
// Tells Axios to look for the 'csrftoken' cookie from Django
axios.defaults.xsrfCookieName = 'csrftoken'; 
// Tells Axios to send it back as the 'X-CSRFToken' header
axios.defaults.xsrfHeaderName = 'X-CSRFToken'; 
// ----------------------------------

// 1. Get the raw variable
const rawUrl = import.meta.env.VITE_API_URL || '';

// 2. This magic line removes any trailing slash from the variable 
// so we can reliably add our own in the code.
export const API_URL = rawUrl.replace(/\/$/, "");

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

// 3. Now, in your functions, ALWAYS use a single leading slash:
export const getMyInspections = async () => {
  // This will ALWAYS result in /api/inspections/
  const response = await axios.get(`${API_URL}/inspections/`, getAuthHeader());
  return response.data;
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