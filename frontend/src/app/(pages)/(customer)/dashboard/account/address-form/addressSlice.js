"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createUserAddress, getUserAddresses, removeUserAddress, updateUserAddress } from "./addressApi";


const handleAsync = (builder, thunkAction, successCallback) => {
    builder
      .addCase(thunkAction.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = "";
      })
      .addCase(thunkAction.fulfilled, (state, action) => {
        state.isLoading = false;
        successCallback(state, action);
      })
      .addCase(thunkAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.error.response?.data?.message || "An error occurred";
      });
  };


export const getUserAddressesAsync = createAsyncThunk(
  "userAddress/getUserAddresses",
  async (userId) => {
   
    const response = await getUserAddresses(userId);
    return response.data;
  }

);
export const createUserAddressAsync = createAsyncThunk(
  "userAddress/createUserAddress",
  async (addressData) => {
    const response = await createUserAddress(addressData);
    return response.data;
  }

);
export const updateUserAddressAsync = createAsyncThunk(
  "userAddress/updateUserAddress",
  async (addressData) => {
    const response = await updateUserAddress(addressData);
    return response.data;
  }

);
export const removeUserAddressAsync = createAsyncThunk(
  "userAddress/removeUserAddress",
  async (addressId) => {
    const response = await removeUserAddress(addressId);
    if(response.status === 200){
      return addressId;
    }
  }

);


const addressSlice = createSlice({
    name: "address",
    initialState: {
      address: null,
      isLoading: false,
      isError: false,
      errorMessage: "",
    },
    extraReducers: (builder) => {
      
      handleAsync(builder, getUserAddressesAsync, (state, action) => {
        state.address = action.payload; 
      });
      handleAsync(builder, createUserAddressAsync, (state, action) => {
        state.address = action.payload.address; 
      });

      handleAsync(builder, updateUserAddressAsync, (state, action) => {
        
        state.address = action.payload.userAddress;
    
      });
  
      handleAsync(builder, removeUserAddressAsync, (state,action) => {
       state.address = state.address.filter((address)=> address.id!==action.payload);
      });
    },
  });

  export default addressSlice.reducer;