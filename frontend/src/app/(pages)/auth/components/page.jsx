"use client";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate password and confirm password
    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setMessage("Password has been reset successfully.");

    // Handle password reset logic (API call)
    console.log("Password reset to: ", password);

    setPassword("");
    setConfirmPassword("");
  };

  // Password validation: Minimum 8 characters, 1 uppercase, 1 number, 1 special character
  const validatePassword = (password) => {
    const re =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black backdrop-blur-md bg-opacity-50 z-50">
      <div className="bg-white relative rounded-2xl shadow-xl p-8 w-[500px]">
        <IoMdClose className="absolute right-8 top-8 text-3xl text-blue-600 cursor-pointer transform transition-transform duration-300 hover:rotate-90" />

        <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Reset Password
        </h2>

        {message && <p className="text-green-600 text-center mb-4">{message}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-bold text-gray-600"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-300"
              }`}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-bold text-gray-600"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-300"
              }`}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="w-full flex justify-center flex-col gap-y-4 items-center">
            <button
              type="submit"
              className="cursor-pointer w-full transition-all bg-blue-500 h-12 text-white px-6 py-2 rounded-lg
              border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
              active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
            >
              Reset Password
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

export default ResetPassword;
