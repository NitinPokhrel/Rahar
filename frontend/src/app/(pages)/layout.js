"use client"; 
import React from 'react'
import Header from '../components/layout/Header'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ClientLayout = ({ children }) => {
  return (
    <Provider store={store}>
      
      {children}
      <ToastContainer />
    </Provider>
  )
}

export default ClientLayout;
