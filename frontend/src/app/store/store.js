"use client"
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../(pages)/auth/authSlice.js'
import addressReducer from '../(pages)/(customer)/dashboard/account/address-form/addressSlice.js'
export const store = configureStore({
  reducer: {

    user : authReducer,
    address : addressReducer,

  },
})