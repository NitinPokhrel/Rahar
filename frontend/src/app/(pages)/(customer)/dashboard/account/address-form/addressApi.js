"use client";
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const handleRequest = async (url, method = "POST", body = null) => {
  
  
  const requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
    ...(method === "POST" || method === "PUT" ? { data: body } : {}), 
  };

  try {
    const response = await axios({
      url,
      ...requestOptions,
    });
   
    return response;
  } catch (error) {
    console.error(`Error in ${method} request:`, error);
    throw error;
  }
};

export const getUserAddresses = async (userId) => {
  const url = `${apiUrl}/user-address/get?userId=${userId}`;
  return await handleRequest(url, "GET");
};

export const createUserAddress = async (addressData) => {
  const url = `${apiUrl}/user-address/add`;
  return await handleRequest(url, "POST", addressData);
};

export const updateUserAddress = async (addressData) => {
  const url = `${apiUrl}/user-address/update`;
  return await handleRequest(url, "POST", addressData);
};

export const removeUserAddress = async (addressId) => {
  
  const url = `${apiUrl}/user-address//remove?addressId=${addressId}`;
  return await handleRequest(url, "DELETE");
};
