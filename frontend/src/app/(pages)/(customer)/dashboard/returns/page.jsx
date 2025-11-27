"use client"
import { useState } from 'react';

const ReturnsSection = () => {
  const [returns, setReturns] = useState([
    {
      id: 1,
      product: 'Apple AirPods Pro (2nd Generation)',
      price: 249.99,
      image: '/images/airpods.png',
      status: 'Refunded',
      returnDate: '2024-10-05',
      reason: 'Product was defective',
    },
    {
      id: 2,
      product: 'Samsung Galaxy S23 Ultra',
      price: 1199.99,
      image: '/images/samsung.png',
      status: 'Processing',
      returnDate: '2024-09-30',
      reason: 'Wrong product delivered',
    },
  ]);

  return (
    <div className="  bg-gray-50">
      <h1 className="text-2xl md:text-3xl p-6 font-bold mb-4">My Returns</h1>

      {/* Returned Items */}
      {returns.length > 0 ? (
        returns.map((item) => (
          <div key={item.id} className="p-4 bg-white shadow rounded-md flex justify-between items-center mb-4">
            <div className="flex items-center">
              <img src={item.image} alt={item.product} className="w-16 h-16 object-cover mr-4" />
              <div>
                <p className="text-lg font-semibold">{item.product}</p>
                <p className="text-sm text-gray-500">Price: ${item.price.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Return Date: {item.returnDate}</p>
                <p className="text-sm text-gray-500">Reason: {item.reason}</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <span className={`px-4 py-2 rounded-md text-white ${item.status === 'Refunded' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">You have no returns at the moment.</p>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <button className="px-2 py-1 border rounded-l-md bg-gray-200">
          &lt;
        </button>
        <button className="px-4 py-1 border bg-blue-500 text-white">1</button>
        <button className="px-2 py-1 border rounded-r-md bg-gray-200">
          &gt;
        </button>
      </div>
    </div>
  );
};

export default ReturnsSection;
