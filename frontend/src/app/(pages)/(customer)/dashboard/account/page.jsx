"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserAddressForm from "./address-form/page";
import { getUserAddressesAsync, removeUserAddressAsync } from "./address-form/addressSlice";

const Account = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const userAddresses = useSelector((state) => state.address.address);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [addressList, setAddressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);

  useEffect(() => {
    if (user) {
      setUserDetails(user);
      dispatch(getUserAddressesAsync(user.id)).then(() => setLoading(false));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (userAddresses) {
      setAddressList(userAddresses);
    }
  }, [userAddresses]);

  const handleAddNewAddress = () => {
    setCurrentAddress(null);
    setShowForm(true);
  };

  const handleEditAddress = (address) => {
    setCurrentAddress(address);
    setShowForm(true);
  };
  const handleRemoveAddress = (addressId) => {
    
   const response =  dispatch(removeUserAddressAsync(addressId));
   console.log(response);
    // setCurrentAddress(address);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setCurrentAddress(null);
  };

  const handleAddressUpdated = () => {
    setLoading(true); // Trigger loading state
    if (user) {
      dispatch(getUserAddressesAsync(user.id)).then(() => setLoading(false)); // Reset loading after data fetch
    }
  };

  const paymentOptions = [
    { id: "cod", label: "Cash on Delivery (COD)" },
    { id: "esewa", label: "eSewa" },
    { id: "card", label: "Credit/Debit Card" },
  ];

  return (
    <div className="w-full mx-auto flex flex-col justify-center">
      <h1 className="text-2xl md:text-3xl p-6 font-semibold mb-6">My Account</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {/* Profile Info */}
          <div className="mb-10 bg-white shadow-lg rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <img
              src={user?.image || "/images/defaultProfile.jpeg"}
              alt="User Avatar"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-gray-200 shadow-sm cursor-pointer"
              onClick={() => setIsImageFullScreen(true)}
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-medium">{userDetails.displayName}</h2>
              <p className="text-gray-600">Email: {userDetails.email}</p>
              <p className="text-gray-600">Mobile: {userDetails.phoneNumber}</p>
            </div>
            <Link href="/dashboard/account/edit-user">
              <button className="cursor-pointer  flex justify-center items-center bg-blue-500 h-12 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">Edit</button>
            </Link>
            
          </div>

          {isImageFullScreen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
              onClick={() => setIsImageFullScreen(false)}
            >
              <img
                src={user?.image || "/default-avatar.png"}
                alt="Full-Screen Avatar"
                className="w-auto h-auto max-w-full max-h-full object-contain"
              />
              
            </div>
          )}

          {/* Address Book */}
          <div className="mb-10 bg-white shadow-lg h-full rounded-lg p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-medium mb-4">Address Book</h3>
            {showForm ? (
              <UserAddressForm
                existingAddress={currentAddress}
                onClose={handleCloseForm}
                onAddressUpdated={handleAddressUpdated}
                userId={user.id}
              />
            ) : (
              <>
                {addressList.length > 0 ? (
                  addressList.map((addr, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-4 md:mb-0">
                          <p className="text-lg font-semibold">{userDetails.displayName}</p>
                          <p className="text-gray-600">
                            {addr.city}, {addr.state}, {addr.country}
                          </p>
                          <p className="text-gray-600">Postal Code: {addr.zipCode}</p>
                          <p className="text-gray-600">Contact: {addr.contactPhone}</p>
                        </div>
                        <div className="flex flex-col-reverse justify-between h-24">
                        <button onClick={() => handleEditAddress(addr)} className="text-blue-500 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleRemoveAddress(addr.id)} className="text-red-500 hover:underline">
                          Remove
                        </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No addresses found. Add a new address below.</p>
                )}
                <button onClick={handleAddNewAddress} className="cursor-pointer  flex justify-center items-center bg-blue-500 h-12 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                  Add New Address
                </button>
              </>
            )}
          </div>

          {/* Payment Methods */}
          <div className="mb-10 bg-white shadow-lg rounded-lg p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-medium mb-4">Payment Methods</h3>
            <div className="flex flex-col md:flex-row gap-x-5 items-center justify-between">
              {paymentOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setSelectedPayment(option.id)}
                  className={`flex items-center justify-center p-4 w-full md:w-[30%] h-20 min-w-[20%] border rounded-lg ${
                    selectedPayment === option.id ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-300 hover:shadow-md"
                  }`}
                >
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Account;
