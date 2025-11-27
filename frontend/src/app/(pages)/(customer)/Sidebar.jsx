"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Ensure you import from next/navigation
import { useEffect, useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi'; // Import hamburger and close icons

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const router = useRouter();
  const [active, setActive] = useState('');

  useEffect(() => {
    setActive(router.pathname);
  }, [router.pathname]);

  const menuItems = [
    { label: 'My Account', path: '/dashboard/account' },
    { label: 'My Orders', path: '/dashboard/orders' },
    { label: 'My Reviews', path: '/dashboard/reviews' },
    { label: 'My Wishlists', path: '/dashboard/wishlists' },
    { label: 'My Returns', path: '/dashboard/returns' },
  ];

  return (
    <div className='relative left-0 w-auto md:w-64'>
      {/* Hamburger Menu for Mobile */}
      {!isSidebarOpen&&<button
        className="md:hidden  absolute top-[21px] left-1  text-2xl p-2 "
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
       <FiMenu />
      </button>}
    

      {/* Sidebar */}
      <div
        className={`fixed  md:static top-17 overflow-auto left-0 h-full  w-[70%] max-w-xs bg-white shadow-lg transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:w-[100%] z-40`}
      >
     
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-700">Dashboard</h2>
          {isSidebarOpen&&<button
        className="md:hidden  top-[82px] left-64 z-50 text-2xl p-2  "
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
         <FiX />
      </button>}
        </div>
        <nav className="mt-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center text-base px-4 py-2 font-semibold text-gray-700 hover:bg-blue-50 transition-colors ${
                    active === item.path
                      ? 'bg-gray-100 text-blue-500 font-extrabold'
                      : ''
                  }`}
                  onClick={() => {
                    setActive(item.path);
                    setIsSidebarOpen(false); // Close sidebar on mobile after clicking
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Sidebar;
