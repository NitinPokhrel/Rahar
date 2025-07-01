import { SignInButton } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <div className="d-flex justify-center items-center min-h-screen bg-gray-100">
      <SignInButton />
    </div>
  );
};

export default page;
