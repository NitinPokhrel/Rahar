"use client";
import axios from 'axios';
import { toast } from 'react-toastify';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// General function to handle API requests
const handleRequest = async ({ url, method = 'POST', data = null, headers = {} }) => {
  try {
    const response = await axios({
      url,
      method,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'An error occurred';
    toast.error(errorMessage);
    console.error(`Error in ${method} request:`, error);
    throw error;
  }
};

// Register user
export const registerUser = async(userData) => {
  const url = `${apiUrl}/users/signUp`;
  const response = await handleRequest({ url, method: 'POST', data: userData });
  return response;
};

// Login user
export const loginUser = async (userData) => {
  const url = `${apiUrl}/users/login`;
  const response = await handleRequest({ url, method: 'POST', data: userData });
  return response;
};



// Logout user
export const logoutUser = async () => {
  const url = `${apiUrl}/users/logout`;
  const response = await handleRequest({ url, method: 'GET' });
  if (response?.success) {
    toast.success("Logged Out Successfully!");
  }
  return response;
};

// Authenticate user (refresh token)
export const authenticateUser = async () => {
  const url = `${apiUrl}/users/refreshToken`;
  try {
    const response = await axios.get(url, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user details
export const updateUser = async (userData) => {
  const url = `${apiUrl}/users/updateUser`;
  try {
    const response = await axios.post(url, userData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'Failed to update user!';
    toast.error(errorMessage);
    console.error(error);
    throw error;
  }
};

// Generate new OTP
export const generateNewOtp = async (userId) => {
  const url = `${apiUrl}/users/generate-otp`;
  const response = await handleRequest({ url, method: 'POST',data: {userId} });
  if (response?.success) {
    toast.success(" enter your otp!");
  }
  return response;
};
export const verifyOtp = async (otp,userId) => {
  const url = `${apiUrl}/users/verify-otp`;
  
  const response = await handleRequest({ url, method: 'POST',data: {otp,userId} });
  
  return response;
};
