"use client";

import React, { useState } from "react";
import { useUser, useClerk, useSessionList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const Page = () => {
  const { signOut } = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();
  const { sessions, isLoaded: sessionsLoaded } = useSessionList();
  const router = useRouter();
  const [loadingAllSignOut, setLoadingAllSignOut] = useState(false);

  if (!isLoaded || !sessionsLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn || !user) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <button
          onClick={() => router.push("/sign-in")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  // Sign out current session
  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  // Sign out all sessions — THIS REQUIRES SERVER API CALL — below is an example client call to your API route
  const handleSignOutAll = async () => {
    setLoadingAllSignOut(true);
    try {
      const res = await fetch("/api/signoutAllSessions", { method: "POST" });
      if (res.ok) {
        alert("All sessions signed out");
        router.push("/sign-in");
      } else {
        alert("Failed to sign out all sessions");
      }
    } catch (error) {
      alert("Error signing out all sessions");
    }
    setLoadingAllSignOut(false);
  };

  return (

    <>
    
    <div className="d-flex justify-center items-center min-h-screen bg-gray-100">

    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <p>
        <strong>Name:</strong> {user.fullName}
      </p>
      <p>
        <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
      </p>
      <p>
        <strong>Username:</strong> {user.username || "N/A"}
      </p>
      <p>
        <strong>Phone Number:</strong>{" "}
        {user.phoneNumbers[0]?.phoneNumber || "N/A"}
      </p>

      <h2 className="mt-6 mb-2 font-semibold text-lg">Active Sessions</h2>
      {sessions.length === 0 && <p>No active sessions found.</p>}
      <ul className="mb-4">
        {sessions.map((session) => (
          <li key={session.id} className="border p-2 mb-2 rounded">
            <p>
              <strong>Device:</strong> {session.deviceName || "Unknown"}
            </p>
            <p>
              <strong>OS:</strong> {session.osName || "Unknown"}
            </p>
            <p>
              <strong>Browser:</strong> {session.browserName || "Unknown"}
            </p>
            <p>
              <strong>Last Active:</strong>{" "}
              {new Date(session.lastActiveAt).toLocaleString()}
            </p>
            <p>
              <strong>Current Session:</strong>{" "}
              {session.id === sessions.find((s) => s.status === "active")?.id
                ? "Yes"
                : "No"}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex space-x-4">
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out Current Session
        </button>
        <button
          onClick={handleSignOutAll}
          disabled={loadingAllSignOut}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {loadingAllSignOut ? "Signing Out All..." : "Sign Out All Sessions"}
        </button>
      </div>
    </div>
    </div>
    </>


  );
};

export default Page;
