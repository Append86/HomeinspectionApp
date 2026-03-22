import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

// Helper to get the current token for authenticated requests
const getAuthHeader = () => {
  const token = localStorage.getItem('access');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetches the initial list to find the Template Master
export const getTemplate = async () => {
  try {
    const response = await axios.get(`${API_URL}inspections/`, {
      headers: getAuthHeader()
    });
    // Returns the TEMPLATE MASTER inspection
    return response.data.find(ins => ins.property_address === "TEMPLATE MASTER");
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
};

// The "Save/Edit" engine for individual findings (Toilet, Roof, etc.)
export const updateItem = async (itemId, data) => {
  try {
    // Standard endpoint is usually api/inspections/items/ID/ or similar based on your router
    // Note: ensure your backend/core/urls.py supports this path
    const response = await axios.patch(`${API_URL}items/${itemId}/`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error("Error saving item:", error);
    throw error;
  }
};

// Updates general inspection info (Address, Client Name, Status)
export const updateInspection = async (id, data) => {
  try {
    const response = await axios.patch(`${API_URL}inspections/${id}/`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error("Error updating inspection info:", error);
    throw error;
  }
};