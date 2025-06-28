"use client";

import { SignUp, useUser, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SignUpPage = () => {
  const { isSignedIn, user } = useUser(); // Clerk user session
  const { getToken } = useAuth(); // Get session JWT
  const router = useRouter();

  useEffect(() => {
    // Wait for sign-in to complete
    if (isSignedIn && user) {
      (async () => {
        try {
          const token = await getToken();

          // Prepare payload safely
          const payload = {
            email: user?.primaryEmailAddress?.emailAddress || "",
            fullName: user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`,
            photo: user?.imageUrl || "",
            userId: user?.id,
          };

          console.log("📤 Sending to backend:", payload);

          const res = await fetch("http://localhost:5000/api/register-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          console.log("✅ Backend response:", data);

          // Navigate after successful signup
          router.push("/dashboard");
        } catch (err) {
          console.error("❌ Error sending data to backend:", err);
        }
      })();
    }
  }, [isSignedIn, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/sign-up"
        afterSignUpUrl="/dashboard" // optional: double-safety
        signInFallbackRedirectUrl="/sign-in"
        signUpOptions={{
          // Enable social sign-up (Google)
          social: ['google'],
        }}
      />
    </div>
  );
};

export default SignUpPage;
