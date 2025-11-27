"use client";
import React, { useState } from "react";
import axios from "axios";

const VendorRegistrationForm = ({ userId, onClose, onVendorCreated }) => {
  const [formDetails, setFormDetails] = useState({
    userId: userId,
    companyName: "",
    businessLicenseNumber: "",
  });

  const [licenseImage, setLicenseImage] = useState(null);
  const [licenseImagePreview, setLicenseImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLicenseImage(file);
      setLicenseImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setLicenseImage(null);
    setLicenseImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("userId", formDetails.userId);
      formData.append("companyName", formDetails.companyName);
      formData.append("businessLicenseNumber", formDetails.businessLicenseNumber);
      if (licenseImage) {
        formData.append("businessLicenseImage", licenseImage);
      }

     
      const response = await axios.post("/api/vendors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onVendorCreated(response.data);
      onClose();
    } catch (err) {
      setError("Failed to create vendor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-center">
      <div className="bg-white p-8 w-8/12 md:min-w-[40rem] shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Register as a Vendor
        </h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading && <div className="mb-4 text-blue-500">Submitting...</div>}
          <div className="w-full flex md:flex-row flex-col justify-between">
            <div className="md:w-7/12 mr-10">
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-600 mb-2"
                  htmlFor="companyName"
                >
                  Store Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={formDetails.companyName}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter your store name"
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-600 mb-2"
                  htmlFor="businessLicenseNumber"
                >
                  Business License Number
                </label>
                <input
                  type="text"
                  name="businessLicenseNumber"
                  id="businessLicenseNumber"
                  value={formDetails.businessLicenseNumber}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter your business license number"
                />
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-600 mb-2"
                  htmlFor="businessLicenseImage"
                >
                  Business License Image
                </label>
                <input
                  type="file"
                  id="businessLicenseImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                <div className="mt-4 cursor-pointer w-5/12" >
                  <img
                  
                    src={`${licenseImagePreview || "/add-image.svg"}`}
                    alt="Business License Preview"
                    className="w-40 h-auto border border-gray-300 rounded-lg"
                  />
                  {licenseImagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="mt-2 text-red-500 text-sm underline"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-start space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-150"
                  disabled={loading}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorRegistrationForm;
