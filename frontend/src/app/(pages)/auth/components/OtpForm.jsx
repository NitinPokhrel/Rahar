"use client";
import React, { useState, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { verifyOtpAsync, generateNewOtpAsync } from "../authSlice";

const OtpForm = ({closePopup}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(60);
  const [isCooldown, setIsCooldown] = useState(true);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.user);
  const router = useRouter();

  React.useEffect(() => {
    let interval;
    if (isCooldown && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsCooldown(false);
    }
    return () => clearInterval(interval);
  }, [timer, isCooldown]);

  const handleChange = (e, index) => {
    const value = e.target.value;

    if (/^\d$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      
      if (value && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = ""; 
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus(); 
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);

      newOtp.forEach((digit, index) => {
        if (inputRefs.current[index]) {
          inputRefs.current[index].value = digit;
        }
      });

      inputRefs.current[5]?.focus(); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const result = await dispatch(
        verifyOtpAsync({ otp: otp.join(""), userId: user.id })
      ).unwrap();
      router.push("/");
      closePopup();
    } catch (error) {
      console.error("Error verifying OTP:", error);
      console.log(error)
      setErrorMessage(error?.message || "An unexpected error occurred");
    }

    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleResendOtp = async () => {
    try {
     const response = await dispatch(generateNewOtpAsync(user.id)).unwrap();
      if(response){
        setIsCooldown(true);
      setTimer(60);
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setErrorMessage(error?.message || "Failed to resend OTP. Try again later.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black backdrop-blur-md bg-opacity-50 z-50">
      <div className="bg-white relative rounded-2xl shadow-xl p-8 w-[500px]">
        <IoMdClose className="absolute right-8 top-8 text-3xl text-blue-600 cursor-pointer transform transition-transform duration-300 hover:rotate-90" onClick={closePopup} />

        <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Enter OTP
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((value, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                value={value}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined} 
              />
            ))}
          </div>

          {errorMessage &&<p className="text-red-600 text-center">Failed To Verify!</p>}

          <div className="w-full flex justify-center flex-col gap-y-4 items-center">
            <button
              type="submit"
              className="cursor-pointer w-full transition-all bg-blue-500 h-12 text-white px-6 py-2 rounded-lg
              border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
              active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
            >
              Submit OTP
            </button>
          </div>

          <div className="flex justify-center mt-4">
            <div
            
              onClick={handleResendOtp}
              disabled={isCooldown}
              className={`text-sm font-bold ${
                isCooldown
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-500 hover:underline"
              }`}
            >
              {isCooldown ? `Resend OTP in ${timer}s` : "Resend OTP"}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpForm;
