import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

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
  const response = await axios.patch(`${API_URL}inspections/${id}/`, data, getAuthHeader());
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