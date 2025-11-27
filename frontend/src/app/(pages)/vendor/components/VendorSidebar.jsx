
"use client";
import Link from 'next/link';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { IoCartOutline } from "react-icons/io5";
import { RiFileAddLine } from "react-icons/ri";
import { FiLayers } from "react-icons/fi";
import { FaRegUser } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";
import { AiOutlineBarChart, AiOutlineFileText } from "react-icons/ai";
import { BsChatSquareDots, BsTags } from "react-icons/bs";
import { useRouter } from 'next/navigation';



const sidebarData = [
  {
    title: "MAIN HOME",
    childrens: [
      {
        icons: <MdOutlineDashboardCustomize />,
        title: "Dashboard",
        path: '/vendor/dashboard'
      },
    ],
  },
  {
    title: "PRODUCTS & ORDERS",
    childrens: [
      {
        icons: <IoCartOutline />,
        title: "Products",
        childrens: [
          { 
            title: "Add Product",
            path: '/vendor/products/add'
          },
          { 
            title: "Product List",
            path: '/vendor/products/list'
          }
        ],
      },
      {
        icons: <RiFileAddLine />,
        title: "Orders",
        childrens: [
          { 
            title: "View Orders",
            path: '/vendor/orders/view'
          },
          { 
            title: "Pending Orders",
            path: '/vendor/orders/pending'
          }
        ],
      },
      {
        icons: <FiLayers />,
        title: "Returns & Refunds",
        childrens: [
          { 
            title: "Manage Returns",
            path: '/vendor/returns/manage'
          },
          { 
            title: "Refund Requests",
            path: '/vendor/returns/refunds'
          }
        ],
      },
    ],
  },
  {
    title: "PROMOTIONS & ANALYTICS",
    childrens: [
      {
        icons: <BsTags />,
        title: "Promotions & Discounts",
        childrens: [
          { 
            title: "Create Discount",
            path: '/vendor/promotions/create'
          },
          { 
            title: "Manage Discounts",
            path: '/vendor/promotions/manage'
          }
        ],
      },
      {
        icons: <AiOutlineBarChart />,
        title: "Analytics",
        childrens: [
          { 
            title: "Sales Overview",
            path: '/vendor/analytics/sales'
          },
          { 
            title: "Product Performance",
            path: '/vendor/analytics/product'
          }
        ],
      },
    ],
  },
  {
    title: "STORE & CUSTOMER",
    childrens: [
      {
        icons: <FaRegUser />,
        title: "Store Management",
        childrens: [
          { 
            title: "Store Profile",
            path: '/vendor/store/profile'
          },
          { 
            title: "Store Analytics",
            path: '/vendor/store/analytics'
          }
        ],
      },
      {
        icons: <BsChatSquareDots />,
        title: "Customer Feedback",
        childrens: [
          { 
            title: "Manage Reviews",
            path: '/vendor/feedback/reviews'
          },
          { 
            title: "Customer Messages",
            path: '/vendor/feedback/messages'
          }
        ],
      },
    ],
  },
  {
    title: "SUPPORT & SETTINGS",
    childrens: [
      {
        icons: <AiOutlineFileText />,
        title: "Support Tickets",
        childrens: [
          { 
            title: "View Tickets",
            path: '/vendor/support/tickets'
          },
          { 
            title: "Raise New Ticket",
            path: '/vendor/support/new-ticket'
          }
        ],
      },
      {
        icons: <CiSettings />,
        title: "Account Settings",
        path: '/vendor/account/settings'
      },
    ],
  },
];


const Sidebar = ({ isOpen, setIsOpen }) => {
  const [active, setActive] = useState('');

  const router = useRouter();

  useEffect(() => {
    setActive(router.pathname);
  }, [router.pathname]);

  const handleNavigation = (path) => {
    if (path) {
      router.push(path);
    }
  };
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <section className="">
    <div
      className={`${
        isOpen ? "w-64" : " w-14"
      }  overflow-y-auto h-screen scrollbar-none bg-white transition-all  duration-500`}
    >
      <div
        className={`border-b  border-gray-300 flex ${
          isOpen ? "flex-row" : "flex-col-reverse gap-y-7"
        } justify-between  items-center py-6 px-4 `}
      >
        <Image
          className="rounded-md  transition-none "
          src="/images/logo.jpeg"
          width={50}
          height={50}
          objectFit="cover"
          alt="Logo"
        />
        <GiHamburgerMenu
          onClick={toggleSidebar}
          className="cursor-pointer text-2xl text-slate-400 hover:text-blue-600 transition-all duration-150"
        />
      </div>

      <div className="">
        {sidebarData.map((category, index) => (
          <div
            key={index}
           
            className="flex flex-col justify-center w-full bg-slate items-start py-2"
          >
            {isOpen && (
              <div className="text-slate-400 text-xs font-bold px-6 break-normal whitespace-nowrap py-3 uppercase">
                {category.title}
              </div>
            )}
            {category.childrens.map((heading, headingIndex) => {
              const [isDropDown, setisDropDown] = useState(false);
              return (
                <div key={headingIndex} className="w-full ">
                  <div
                    
                    onClick={() => {
                        if (heading.childrens) {
                          setisDropDown(!isDropDown);
                        } else {
                          handleNavigation(heading.path);
                        }
                      }}
                    className={`flex ${
                      isOpen ? "justify-between" : "justify-center"
                    } items-center gap-3 px-8 hover:text-blue-600 hover:bg-indigo-50 transition-all duration-150 py-4 cursor-pointer text-md font-semibold`}
                   
                  >
                    <div className="flex items-center">
                      <div className="pr-3 ">{heading.icons}</div>
                      {isOpen && (
                        <div className="capitalize">{heading.title}</div>
                      )}
                    </div>
                    { isOpen && heading.childrens && (
                      <MdOutlineKeyboardArrowRight
                        className={`transition-transform duration-300 ${
                          isDropDown ? "rotate-90" : ""
                        }`}
                      />
                    )}
                  </div>
                  {/* Dropdown for children */}
                  {isDropDown && heading.childrens && (
                    <div className={`${isOpen ? "pl-12" : "pl-0 text-start"}`}>
                      {heading.childrens.map((child, childIndex) => (
                        <div
                        key={childIndex}
                        onClick={() => handleNavigation(child.path)} 
                          
                          className={`flex items-center gap-3 py-2 px-3 hover:text-blue-600 hover:bg-indigo-50 transition-all duration-150 cursor-pointer text-sm font-medium`}
                        >
                          {isOpen && (
                            <div className="text-lg pr-2">
                              {child.icons || "•"}
                            </div>
                          )}
                          <div className={`${!isOpen && 'text-[10px] mr-2'}`}>
                         
                          {isOpen ? child.title : child.title.split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
    </section>
  );
};

export default Sidebar;


