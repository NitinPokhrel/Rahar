// "use client";
// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import { updateUser } from "./userApi"; // Ensure this API function is correctly defined
// import blobToFile from "@/app/utils/blobFileHandler";

// // Async thunk for updating user
// export const updateUserAsync = createAsyncThunk(
//   "user/updateUser",


// );

// // Auth slice
// const authSlice = createSlice({
//   name: "user",
//   initialState: {
//     user: null,
//     isLoading: false,
//     isError: false,
//     errorMessage: "",
//   },
//   extraReducers: (builder) => {
//     // Handle pending state
//     builder.addCase(updateUserAsync.pending, (state) => {
//       state.isLoading = true;
//       state.isError = false;
//       state.errorMessage = "";
//     });

//     // Handle fulfilled state
//     builder.addCase(updateUserAsync.fulfilled, (state, action) => {
//       state.isLoading = false;
//       state.user = action.payload; // Update the user state with the response
//       console.log(action.payload, "Updated user data"); // Log the updated user data
//     });

//     // Handle rejected state
//     builder.addCase(updateUserAsync.rejected, (state, action) => {
//       console.log(action.payload)
//       state.isLoading = false;
//       state.isError = true;
//       state.errorMessage = action.error.message || "An error occurred";
//       console.error("Error updating user:", action.error); // Log the error for debugging
//     });
//   },
// });

// export default authSlice.reducer;
