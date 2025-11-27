"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";



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


export const createVendorAsync = createAsyncThunk(
  "vendor/createVendor",
  async (userDetails) => {
   
    const response = await createVendor(userDetails);
    return response.data;
  }

);


const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    address: null,
    isLoading: false,
    isError: false,
    errorMessage: "",
  },
  extraReducers: (builder) => {
    handleAsync(builder, createVendorAsync, (state, action) => {
      state.vendor = action.payload;
    });
  },
});

  export default vendorSlice.reducer;