"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  UserIcon,
  ShoppingCartIcon,
  MenuIcon,
  XIcon,
} from "@heroicons/react/outline";
import LoginForm from "@/app/(pages)/auth/components/Login";
import SignupForm from "@/app/(pages)/auth/components/Signup";
import { useDispatch, useSelector } from "react-redux";
import {
  authenticateUserAsync,
  logoutUserAsync,
} from "@/app/(pages)/auth/authSlice";
import Link from "next/link";
import OtpForm from "@/app/(pages)/auth/components/OtpForm";
import ResetPassword from "@/app/(pages)/auth/components/page";
import ForgotPassword from "@/app/(pages)/auth/components/ForgotPassword";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("login"); // "login" or "signup"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const { isLogin, user } = useSelector((store) => store.user);
  

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(authenticateUserAsync());
  }, [dispatch]);

  const firstLetter = user?.displayName?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTimeout(() => setIsDropdownOpen(false), 100); // Small delay for better UX
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logoutUserAsync());
    closePopup();
    setIsDropdownOpen(false);
  };

  const closePopup = () => setShowPopup(false);

  const openLoginPopup = () => {
    setPopupType("login");
    setShowPopup(true);
  };

  const openSignupPopup = () => {
    setPopupType("signup");
    setShowPopup(true);
  };

  const openOtpPopup = () => {
    setPopupType("verifyOtp");
    setShowPopup(true);
  };
  const forgotPasswordPopup = () =>{
    setPopupType("forgotPassword")
    setShowPopup(true);
  }
  const openResetPasswordPopup = () => {
    setPopupType("resetPassword");
    setShowPopup(true);
  };

  const SearchBar = ({ mobile = false }) => (
    <div className={`${mobile ? "" : "hidden md:flex flex-grow mx-4"}`}>
      <input
        type="text"
        className="w-full outline-none px-4 py-2 border border-gray-300 rounded-l-md"
        placeholder="Search products..."
      />
      <button className="px-4 bg-glassyWhite text-black rounded-r-md hover:bg-gray-200">
        Search
      </button>
    </div>
  );

  return (
    <>
      <header className="bg-primary backdrop-blur-md shadow-md sticky top-0 z-50 w-full px-10">
        <div className="container mx-auto px-4 flex items-center justify-between py-4">
          <div className="text-xl font-bold text-white">Shopylib</div>

          <SearchBar />

          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <Link
                href={
                  user.role === "customer"
                    ? "/vendor/register"
                    : "/dashboard/store"
                }
                className="text-sm font-semibold text-white"
              >
                {user.role === "customer" ? "Become a Seller" : "My Store"}
              </Link>
            )}

            {!isLogin ? (
              <Link
                href="#"
                onClick={openLoginPopup}
                className="text-sm font-semibold text-white flex items-center"
              >
                <UserIcon className="h-5 w-5 mr-1" /> Login
              </Link>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center w-10 h-10 cursor-pointer bg-green-500 rounded-full text-white font-bold text-xl"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={`${user.name}'s profile`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    firstLetter
                  )}
                </div>
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-4 w-48 backdrop-blur-lg border border-gray-200 bg-white rounded-lg shadow-lg">
                    <ul className="py-1">
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link href="/dashboard/account">My Profile</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link href="/dashboard/orders">Orders</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link href="/dashboard/wishlists">Wishlist</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link href="/dashboard/reviews">Reviews</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link href="/dashboard/returns">My Returns</Link>
                      </li>
                      <li
                        onClick={handleLogout}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        Logout
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button>
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? (
                <XIcon className="h-6 w-6 text-gray-600" />
              ) : (
                <MenuIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 py-2 bg-white shadow-md">
            <div className="flex flex-col space-y-2">
              {/* Search bar for mobile */}
              <SearchBar mobile />
             {user!==null&& <button className="text-sm font-semibold text-gray-600">
                Become a Seller
              </button>}
              {!isLogin && (
                <button
                  onClick={openLoginPopup}
                  className="text-sm font-semibold text-gray-100 bg-red-500 flex items-center"
                >
                  <UserIcon className="h-5 w-5 mr-1" /> Login
                </button>
              )}
              <button className="flex items-center justify-start text-white">
                <ShoppingCartIcon className="h-6 w-6 text-white mr-1" />
                Cart
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Login or Signup Popup */}
      {showPopup && popupType === "login" && (
        <LoginForm
          closePopup={closePopup}
          openSignupPopup={openSignupPopup}
          openOtpPopup={openOtpPopup}
          forgotPasswordPopup={forgotPasswordPopup*+``}
        />
      )}
      {showPopup && popupType === "signup" && (
        <SignupForm
          closePopup={closePopup}
          openLoginPopup={openLoginPopup}
          openOtpPopup={openOtpPopup}
        />
      )}
      {showPopup && popupType === "verifyOtp" && (
        <OtpForm closePopup={closePopup}  />
      )}
      {showPopup && popupType === "forgotPassword" && (
        <ForgotPassword closePopup={closePopup} openResetPasswordPopup={openResetPasswordPopup} />
      )}
      {showPopup && popupType === "resetPassword" && (
        <ResetPassword closePopup={closePopup} />
      )}
    </>
  );
};

export default Header;
