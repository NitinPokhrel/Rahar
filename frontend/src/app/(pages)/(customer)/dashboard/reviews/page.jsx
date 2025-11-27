"use client"
import { useState } from 'react';

const MyReviews = () => {
  const [activeTab, setActiveTab] = useState('To Be Reviewed');
  
  const toBeReviewed = [
    {
      id: 1,
      product: 'Gigaware V3 6D Professional Gaming Sensor Pro Mechanical Gaming Mouse',
      colorFamily: 'Black',
      purchasedOn: '2024-10-10',
      image: '/images/mouse.png',
    },
  ];

  const myReviews = [
    {
      id: 2,
      product: 'Logitech G502 Hero High-Performance Gaming Mouse',
      colorFamily: 'Black',
      reviewedOn: '2024-09-15',
      rating: 5,
      review: 'This mouse has excellent responsiveness and a comfortable design. Highly recommended!',
      image: '/images/logitech.png',
    },
  ];

  return (
    <div className="   bg-gray-50">
      <h1 className="text-2xl md:text-3xl p-6 font-bold mb-4">My Reviews</h1>

      {/* Tab Headers */}
      <div className="flex space-x-6 mb-4">
        <button
          className={`pb-2 ${activeTab === 'To Be Reviewed' ? 'border-b-2 border-orange-500 text-black' : 'text-gray-500'}`}
          onClick={() => setActiveTab('To Be Reviewed')}
        >
          To Be Reviewed (1)
        </button>
        <button
          className={`pb-2 ${activeTab === 'History' ? 'border-b-2 border-orange-500 text-black' : 'text-gray-500'}`}
          onClick={() => setActiveTab('History')}
        >
          History (1)
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'To Be Reviewed' && (
        <div>
          {toBeReviewed.length > 0 ? (
            toBeReviewed.map((item) => (
              <div key={item.id} className="p-4 bg-white shadow rounded-md flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <img src={item.image} alt={item.product} className="w-16 h-16 object-cover mr-4" />
                  <div>
                    <p className="text-lg font-semibold">{item.product}</p>
                    <p className="text-sm text-gray-500">Color Family: {item.colorFamily}</p>
                    <p className="text-sm text-gray-500">Purchased on: {item.purchasedOn}</p>
                  </div>
                </div>
                <button className="bg-orange-500 text-white px-4 py-2 rounded-md">Review</button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No items to be reviewed.</p>
          )}
        </div>
      )}

      {activeTab === 'History' && (
        <div>
          {myReviews.length > 0 ? (
            myReviews.map((review) => (
              <div key={review.id} className="p-4 bg-white shadow rounded-md flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <img src={review.image} alt={review.product} className="w-16 h-16 object-cover mr-4" />
                  <div>
                    <p className="text-lg font-semibold">{review.product}</p>
                    <p className="text-sm text-gray-500">Color Family: {review.colorFamily}</p>
                    <p className="text-sm text-gray-500">Reviewed on: {review.reviewedOn}</p>
                    <p className="text-sm text-gray-500">Rating: {review.rating} / 5</p>
                    <p className="mt-2">{review.review}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reviews in history.</p>
          )}
        </div>
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

export default MyReviews;
