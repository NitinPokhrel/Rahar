"use client";
import Image from 'next/image';
import React, { useState } from 'react';

const Header = () => {
 

  return (
    <div className="bg-white shadow-2xl  py-4 px-6 md:px-12">
    
      <div className="max-w-screen-xl mx-auto flex justify-between items-center flex-col gap-4 md:flex-row">
        
        {/* Logo Section */}
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Image
              className="rounded-full h-12 w-12"
              src="/images/logo.jpeg"
              width={50}
              height={50}
              alt="Logo"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-semibold text-lg">Milan Bhattarai</div>
            <div className="text-gray-600 text-sm">Seller</div>
          </div>
        </div>

        {/* Search Section */}
        <div className="w-full max-w-md mx-auto md:max-w-xl flex items-center md:space-x-2">
          <form className="w-full flex justify-between items-center border border-gray-300 rounded-lg p-2">
            <input
              type="search"
              id="search-input"
              className="w-full p-2 text-sm text-gray-700 bg-transparent border-none outline-none"
              placeholder="Search Here!"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md ml-2 text-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300"
            >
              Search
            </button>
          </form>
        </div>
        
    </div>
    </div>
    

   
  );
};

export default Header;
