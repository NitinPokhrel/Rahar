"use client"
import { useState } from 'react';

export default function CreateStoreForm() {
  const [storeLogo, setStoreLogo] = useState(null); // Holds the logo file URL
  const [storeBanner, setStoreBanner] = useState(null); // Holds the banner file URL

  // Handles logo file input
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) setStoreLogo(URL.createObjectURL(file));
  };

  // Handles banner file input
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) setStoreBanner(URL.createObjectURL(file));
  };

  // Placeholder submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission logic
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      {/* Form container */}
      <div className="w-full bg-white rounded-2xl shadow-2xl border border-gray-300">
        <div className="p-6 md:p-10">
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-8">
            🛍️ Create Your Store
          </h2>

          {/* Form */}
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={handleSubmit}
          >
            {/* Left side inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Store Name *
                </label>
                <input
                  required
                  placeholder="Enter store name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Tell us about your store..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourstore@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+977 9800000000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              {/* Address inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    placeholder="Mechinagar"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Postal Code
                  </label>
                  <input
                    placeholder="57207"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Address
                </label>
                <input
                  placeholder="Gadagalli, Mechinagar-1, Jhapa"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Right side inputs */}
            <div className="space-y-4">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Store Logo
                </label>
                <div className="border border-dashed border-gray-400 rounded-xl p-4 flex items-center justify-center h-32 relative">
                  {storeLogo ? (
                    <img
                      src={storeLogo}
                      alt="logo"
                      className="h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-sm text-center">
                      📷 Upload Logo
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Banner upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Store Banner
                </label>
                <div className="border border-dashed border-gray-400 rounded-xl p-4 flex items-center justify-center h-32 relative">
                  {storeBanner ? (
                    <img
                      src={storeBanner}
                      alt="banner"
                      className="h-full object-cover w-full rounded-md"
                    />
                  ) : (
                    <div className="text-gray-500 text-sm text-center">
                      🖼️ Upload Banner
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {/* Submit button */}
              </div>

            </div>
              <div className="md:col-span-2 mt-6 text-end  ">
                <button
                  type="submit"
                  className="bg-black text-white rounded-xl px-8 py-3 text-lg shadow-md hover:shadow-lg"
                >
                  🚀 Launch Store
                </button>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
}
