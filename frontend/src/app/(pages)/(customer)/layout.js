"use client";
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from '@/app/components/layout/Header';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  return (
    <>
    <Header />
    <div className="flex min-h-screen w-full   bg-gray-50">
      {/* Sidebar */}

      

      {/* Main content area */}
      <main className='flex w-full '>
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex w-full md:w-[80%] px-10 md:m-0 flex-col   pb-10 ">{children}</div>
      </main>
    </div>
    </>
    
  );
};

export default DashboardLayout;
