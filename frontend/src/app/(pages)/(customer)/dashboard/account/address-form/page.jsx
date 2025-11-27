"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createUserAddressAsync, updateUserAddressAsync } from './addressSlice'; // Import actions

const UserAddressForm = ({ existingAddress = null, onClose,userId,onAddressUpdated }) => {
  const dispatch = useDispatch();

  // Initial state is either the existing address (for editing) or empty fields (for adding)
  const [addressDetails, setAddressDetails] = useState({
    userId : userId,
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // If an existingAddress prop is passed, set the form state with its values (edit mode)
  useEffect(() => {
    if (existingAddress) {
      setAddressDetails({
       
        contactPhone: existingAddress.contactPhone || '',
        address: existingAddress.address || '',
        city: existingAddress.city || '',
        state: existingAddress.state || '',
        zipCode: existingAddress.zipCode || '',
        country: existingAddress.country || '',
      });
    }
  }, [existingAddress]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      if (existingAddress) {
        // Update the address
        await dispatch(updateUserAddressAsync({ id: existingAddress.id, userId, ...addressDetails })).unwrap();
      } else {
        // Add a new address
        await dispatch(createUserAddressAsync(addressDetails)).unwrap();
      }
      onAddressUpdated(); // Notify parent to refresh the address list
      onClose(); // Close the form after successful submission
    } catch (error) {
      setError("Failed to save address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () =>{
    onClose();
  }

  return (
    <div className="flex items-start  justify-center ">
      <div className="bg-transparent backdrop-blur-md h-full  p-8 w-full ">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          {existingAddress ? "Edit Address" : "Add New Address"}
        </h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading && <div className="mb-4 text-blue-500">Loading...</div>}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="contactPhone">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                id="contactPhone"
                value={addressDetails.contactPhone}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your contact phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="address">
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={addressDetails.address}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="city">
                City
              </label>
              <input
                type="text"
                name="city"
                id="city"
                value={addressDetails.city}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="state">
                State
              </label>
              <input
                type="text"
                name="state"
                id="state"
                value={addressDetails.state}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your state"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="zipCode">
                Zip Code
              </label>
              <input
                type="text"
                name="zipCode"
                id="zipCode"
                value={addressDetails.zipCode}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your zip code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="country">
                Country
              </label>
              <input
                type="text"
                name="country"
                id="country"
                value={addressDetails.country}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your country"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
          <button
              onClick={handleCloseForm}
              className="cursor-pointer  flex justify-center items-center bg-gray-500 h-12 text-white px-6 py-2 rounded-lg border-gray-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
              disabled={loading}
              
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer  flex justify-center items-center bg-blue-500 h-12 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
              disabled={loading}
              
            >
              {existingAddress ? "Update Address" : "Save Address"}
            </button>
         
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserAddressForm;
