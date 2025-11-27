import { ShoppingBagIcon } from '@heroicons/react/outline' // or /outline

import Link from 'next/link';


export default function CreateStorePrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white px-4">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-blue-100">
        
        <ShoppingBagIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        
        <h2 className="text-2xl font-semibold text-gray-800">Create Your Store to Continue</h2>
        
        <p className="text-gray-600 mt-2 text-sm">
          Start selling and unlock your full vendor dashboard.
        </p>
        
        <ul className="text-left mt-6 text-sm text-gray-700 space-y-2 px-2">
          <li>✅ List and manage your products</li>
          <li>✅ Track orders and view analytics</li>
          <li>✅ Customize your storefront</li>
        </ul>

        <Link
          href="/vendor/create-store"
          className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md transition duration-300"
        >
          Create Store Now
        </Link>

        <p className="text-xs text-gray-500 mt-4">
          You only need to do this once. You can edit your store later anytime.
        </p>
      </div>
    </div>
  );
}
