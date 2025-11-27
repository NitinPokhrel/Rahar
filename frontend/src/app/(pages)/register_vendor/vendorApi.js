
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; 


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const createVendor = async (vendorData) => {
  try {
    const response = await api.post('/vendors', vendorData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to create vendor');
  }
};

export const fetchVendors = async () => {
  try {
    const response = await api.get('/vendors');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch vendors');
  }
};


export const fetchVendorById = async (vendorId) => {
  try {
    const response = await api.get(`/vendors/${vendorId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch vendor');
  }
};

export const updateVendor = async (vendorId, vendorData) => {
  try {
    const response = await api.put(`/vendors/${vendorId}`, vendorData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to update vendor');
  }
};


export const deleteVendor = async (vendorId) => {
  try {
    const response = await api.delete(`/vendors/${vendorId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to delete vendor');
  }
};
