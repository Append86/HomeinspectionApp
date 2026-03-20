import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

// Fetches the initial list to find the Template Master
export const getTemplate = async () => {
  try {
    const response = await axios.get(`${API_URL}inspections/`);
    // Returns the TEMPLATE MASTER inspection
    return response.data.find(ins => ins.property_address === "TEMPLATE MASTER");
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
};

// The "Save/Edit" engine - this updates specific items in the database
export const updateItem = async (itemId, data) => {
  try {
    // Note: This endpoint depends on your Django URLs. 
    // Usually 'api/items/ID/' or 'api/inspection-items/ID/'
    const response = await axios.patch(`${API_URL}items/${itemId}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error saving item:", error);
    throw error;
  }
};