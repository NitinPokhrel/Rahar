"use client";
import React, { useState } from "react";
import Header from "./components/VendorHeader";
import Sidebar from "./components/VendorSidebar";
import CreateStorePrompt from "./components/storeCreatePrompt";

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const sidebarWidth = isOpen ? "w-64" : "w-14"; // 256px vs 56px
  const contentPadding = isOpen ? "pl-64" : "pl-14";
  const store = false;
  return (
    <div className="relative">
      {/* Fixed Sidebar */}
      <div className={`fixed top-0 left-0 h-screen transition-all duration-300 z-30 ${sidebarWidth}`}>
        <Sidebar setIsOpen={setIsOpen} isOpen={isOpen} />
      </div>

      {/* Main Content with padded layout */}
      <div className={`transition-all duration-300 ${contentPadding}`}>
        {store &&<Header setIsOpen={setIsOpen} isOpen={isOpen} />}
        <main className="p-6 min-h-screen bg-gray-100 bg-[linear-gradient(to_right,#ffffff,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:6rem_4rem]">
        
          {!store ?children : <CreateStorePrompt />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
