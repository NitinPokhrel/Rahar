"use client";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

  
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setMessage("If this email is registered, you will receive a password reset link.");

  
    console.log("Password reset requested for: ", email);


    setEmail("");
  };

  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black backdrop-blur-md bg-opacity-50 z-50">
      <div className="bg-white relative rounded-2xl shadow-xl p-8 w-[500px]">
        <IoMdClose className="absolute right-8 top-8 text-3xl text-blue-600 cursor-pointer transform transition-transform duration-300 hover:rotate-90" />

        <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Forgot Password
        </h2>

        {message && <p className="text-green-600 text-center mb-4">{message}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold text-gray-600">
              Enter your email address
            </label>
            <input
              type="email"
              id="email"
              className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                error ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300"
              }`}
              placeholder="example@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          <div className="w-full flex justify-center flex-col gap-y-4 items-center">
            <button
              type="submit"
              className="cursor-pointer w-full transition-all bg-blue-500 h-12 text-white px-6 py-2 rounded-lg
              border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
              active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
            >
              Send Reset Link
            </button>
          </div>

          <div className="flex justify-center mt-4">
            <a href="#" className="text-sm font-bold text-blue-500 hover:underline">
              Back to Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
