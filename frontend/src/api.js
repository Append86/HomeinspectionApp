import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
});

// Fetches all inspections owned by the logged-in user
export const getMyInspections = async () => {
  try {
    const response = await axios.get(`${API_URL}inspections/`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return [];
  }
};

// Triggers the backend cloning logic
export const createInspectionFromTemplate = async (address, client) => {
  const response = await axios.post(
    `${API_URL}inspections/create_from_template/`, 
    { property_address: address, client_name: client },
    getAuthHeader()
  );
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