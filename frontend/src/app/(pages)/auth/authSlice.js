"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authenticateUser, generateNewOtp, loginUser, logoutUser, registerUser, updateUser, verifyOtp } from "./authApi";
import blobToFile from "@/app/utils/ImageCompressor";


// Reusable function to handle async logic
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

// Async thunks for auth operations
export const registerUserAsync = createAsyncThunk(
  "user/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await registerUser(userData);
      console.log(response,"sadf")
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const loginUserAsync = createAsyncThunk(
  "user/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await loginUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const logoutUserAsync = createAsyncThunk(
  "user/logoutUser",
  async () => {
    await logoutUser();
  }
);

export const authenticateUserAsync = createAsyncThunk(
  "user/authenticateUser",
  async () => {
    const response = await authenticateUser();
    return response.data;
  }
);

export const updateUserAsync = createAsyncThunk(
  "user/updateUser",
  async (userDetails, { rejectWithValue }) => {
    const { displayName, email, phoneNumber } = userDetails;

    if (!displayName || !email) {
      return rejectWithValue("Full Name and Email are required.");
    }

    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);

    if (userDetails.image) {
      const blob = await fetch(userDetails.image).then((r) => r.blob());
      const compressedImage = await blobToFile(blob);

      formData.append('profileImage', compressedImage);
    }

    try {
      const response = await updateUser(formData);
     
      return response; 
    } catch (error) {
      console.error("Error in updateUser:", error); 
      return rejectWithValue("Failed to update user");
    }
  }
  
);

export const generateNewOtpAsync = createAsyncThunk(
  "user/generateNewOtp",
  async (userId) => {
    const response = await generateNewOtp(userId);
    return response.data;
  }
);
export const verifyOtpAsync = createAsyncThunk(
  "user/verifyOtp",
  async ({otp,userId}) => {
    const response = await verifyOtp(otp,userId);
    console.log(response,'user')
    return response.data;
  }
);

// Auth slice
const authSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    isLogin: false,
    isLoading: false,
    isError: false,
    errorMessage: "",
  },
  extraReducers: (builder) => {
    // Register User
    handleAsync(builder, registerUserAsync, (state, action) => {
      state.user = action.payload.user; 
    });

    // Login User
    handleAsync(builder, loginUserAsync, (state, action) => {
      state.user = action.payload.user;  
      
      if(action.payload.user.isVerified){
        state.isLogin = true;
        
      }
    });

    // Logout User
    handleAsync(builder, logoutUserAsync, (state) => {
      state.isLogin = false;
      state.user = null;

    });

    // Authenticate User
    handleAsync(builder, authenticateUserAsync, (state, action) => {
    if(action.payload.user.isVerified){
      state.isLogin = true;
    }
      state.user = action.payload.user; 
    });
    // Update User 
    handleAsync(builder, updateUserAsync, (state, action) => {
      state.user = action.payload.user;
    });
    // Verify OTP 
    handleAsync(builder, verifyOtpAsync, (state, action) => {
      state.isVerified = true ;
      
      state.user = action.payload.user;
    });
  },
});

export default authSlice.reducer;
