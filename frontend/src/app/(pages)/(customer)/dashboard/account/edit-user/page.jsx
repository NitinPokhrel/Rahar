"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserAsync } from "@/app/(pages)/auth/authSlice";

const EditUser = () => {
  const user = useSelector((store) => store.user.user);
  const dispatch = useDispatch();
  const router = useRouter(); // Use router for redirection
  const [userDetails, setUserDetails] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    image: user?.image || "", // Initially set the image
  });
  const [imageChanged, setImageChanged] = useState(false); // State to track if image is changed
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // State for loading

  useEffect(() => {
    if (user) {
      setUserDetails({
        displayName: user.displayName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        image: user.image || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserDetails((prevDetails) => ({ ...prevDetails, image: reader.result }));
        setImageChanged(true); 
      };
      reader.readAsDataURL(file);
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updatedDetails = {
        ...userDetails,
        image: imageChanged ? userDetails.image : null, // Set image to null if not changed
      };

      const resultAction = await dispatch(updateUserAsync(updatedDetails)).unwrap();


      router.push("/dashboard/account");
    } catch (error) {
      setError("Failed to update user. Please try again.");
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Edit User Details
        </h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          <div className="mb-6 flex flex-col items-center">
            {userDetails.image ? (
              <img
                src={userDetails.image}
                alt="User Avatar"
                className="w-32 h-32 object-cover rounded-full mb-4 shadow-md"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="imageUpload"
            />
            <div>
              <label
                htmlFor="imageUpload"
                className="cursor-pointer  flex justify-center items-center bg-blue-500 h-12 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
              >
                Change Image
              </label>
            </div>
          </div>
          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-600 mb-2"
              htmlFor="fullName"
            >
              Full Name
            </label>
            <input
              type="text"
              name="displayName"
              id="fullName"
              value={userDetails.displayName}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-600 mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={userDetails.email}
              disabled
              className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none "
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-600 mb-2"
              htmlFor="phone"
            >
              Phone
            </label>
            <input
              type="tel"
              name="phoneNumber"
              id="phone"
              value={userDetails.phoneNumber}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg w-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard/account"
              type="button"
              className="cursor-pointer  flex justify-center items-center bg-gray-500 h-12 text-white px-6 py-2 rounded-lg border-gray-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="cursor-pointer  flex justify-center items-center bg-blue-500 h-12 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
