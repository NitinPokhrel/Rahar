"use client"
import { useState } from 'react';

const MyWishlists = () => {
  const [wishlist, setWishlist] = useState([
    {
      id: 1,
      product: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      price: 349.99,
      image: '/images/headphones.png',
    },
    {
      id: 2,
      product: 'Apple MacBook Pro 14-inch M1 Pro',
      price: 1999.99,
      image: '/images/macbook.png',
    },
  ]);
  
  const handleRemove = (id) => {
    setWishlist(wishlist.filter(item => item.id !== id));
  };

  const handleAddToCart = (id) => {
    console.log(`Product with ID: ${id} added to cart.`);
    // Implement add to cart functionality here
  };

  return (
    <div className="  bg-gray-50">
      <h1 className="text-2xl md:text-3xl p-6 font-bold mb-4">My Wishlists</h1>

      {/* Wishlist Items */}
      {wishlist.length > 0 ? (
        wishlist.map((item) => (
          <div key={item.id} className="p-4 bg-white shadow rounded-md flex justify-between items-center mb-4">
            <div className="flex items-center">
              <img src={item.image} alt={item.product} className="w-16 h-16 object-cover mr-4" />
              <div>
                <p className="text-lg font-semibold">{item.product}</p>
                <p className="text-sm text-gray-500">Price: ${item.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-md"
                onClick={() => handleRemove(item.id)}
              >
                Remove
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                onClick={() => handleAddToCart(item.id)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">Your wishlist is empty.</p>
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

export default MyWishlists;
