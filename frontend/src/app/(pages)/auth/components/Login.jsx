"use client";
import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { IoMdClose } from "react-icons/io";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { generateNewOtpAsync, loginUserAsync } from "../authSlice";


const LoginForm = ({ closePopup, openSignupPopup ,openOtpPopup }) => {


  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordType, setPasswordType] = useState("password");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setPasswordType(showPassword ? "password" : "text");
  };

  const handleGoogleLogin = () => {
    console.log("Login with Google");
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const loginUserDetails = await dispatch(loginUserAsync(data));
 
      if (loginUserDetails.payload.user && !(loginUserDetails.payload.user.isVerified)) {

        await dispatch(generateNewOtpAsync(loginUserDetails.payload.user.id)); 
        
        openOtpPopup(loginUserDetails.payload.user.id);
        return;
      }
      closePopup();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to Login");
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const dispatch = useDispatch();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black backdrop-blur-md bg-opacity-50 z-50">
      <div className="bg-white relative rounded-2xl shadow-xl p-8 w-[500px]">
        <IoMdClose
          className="absolute right-8 top-8 text-3xl text-blue-600 cursor-pointer transform transition-transform duration-300 hover:rotate-90"
          onClick={closePopup} // Close popup on click
        />
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Login
        </h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Input */}
          <div className="relative mb-3 w-full h-10">
            <input
              className="peer h-full w-full rounded-[7px] border border-cyan-500 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-gray-300 placeholder-shown:border-t-gray-300 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              {...register("email", { required: "Email is required" })}
            />
            <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-cyan-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-cyan-500 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-cyan-500 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-gray-800 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-300">
              Email Address
            </label>
            <p className="text-red-500 text-xs px-3 ">{errors?.email?.message}</p>
          </div>

          {/* Password Input */}
          <div className="relative mb-3 w-full h-10">
            <input
              type={passwordType}
              className="peer h-full w-full rounded-[7px] border border-cyan-500 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-gray-300 placeholder-shown:border-t-gray-300 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              {...register("password", { required: "Password is required" })}
            />
            <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-cyan-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-cyan-500 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-cyan-500 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-gray-800 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-300">
              Password
            </label>
            <p className="text-red-500 text-xs px-3 ">{errors?.password?.message}</p>
            {!showPassword ? (
              <IoEye
                className="absolute right-1 top-2 cursor-pointer"
                size={25}
                onClick={togglePasswordVisibility}
                aria-label="Show password"
              />
            ) : (
              <IoEyeOff
                className="absolute right-1 top-2 cursor-pointer"
                size={25}
                onClick={togglePasswordVisibility}
                aria-label="Hide password"
              />
            )}
          </div>

          {/* Forgot Password */}
          <div className="flex items-center justify-between mt-4">
            <a href="/auth/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <div className="w-full flex justify-center flex-col gap-y-4 items-center mt-6">
            <button
              type="submit"
              className="cursor-pointer w-full flex justify-center items-center bg-blue-500 h-12 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
              disabled={loading}
            >
              {loading && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="animate-spin h-5 w-5 mr-3 text-white"
                >
                  <circle strokeWidth="4" stroke="currentColor" r="10" cy="12" cx="12" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" className="opacity-75" />
                </svg>
              )}
              Login
            </button>

            {/* Google Login */}
            <button
              type="button"
              className="cursor-pointer w-full h-12 flex justify-center items-center text-blue-600 bg-gray-200 px-6 py-2 rounded-lg border-gray-400 border-b-[4px] hover:brightness-100 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
              onClick={handleGoogleLogin}
            >
              <FcGoogle size={20} className="mr-3" />
              Login with Google
            </button>
          </div>
        </form>
        <p className="text-center text-sm mt-6 text-gray-600">
          Don't have an account?{" "}
          <span
            className="cursor-pointer text-blue-600 hover:underline"
            onClick={openSignupPopup}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
