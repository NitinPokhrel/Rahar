'use client';

import { SignIn, useUser, useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SignInPage = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn && user) {
      (async () => {
        try {
          const token = await getToken();

          const payload = {
            email: user.primaryEmailAddress.emailAddress,
            fullName: user.fullName,
            userId: user.id,
          };

          const res = await fetch('http://localhost:5000/api/login-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          console.log('✅ Login API response:', data);

          router.push('/dashboard');
        } catch (err) {
          console.error('Error calling backend after login:', err);
        }
      })();
    }
  }, [isSignedIn, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/sign-in" // Stay here until we call backend
      />
    </div>
  );
};

export default SignInPage;
