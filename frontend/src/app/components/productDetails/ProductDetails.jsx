"use client"
import React, { useState } from "react";

const ProductDetails = () => {
  const [quantity, setQuantity] = useState(1);
  const [primaryImage, setPrimaryImage] = useState("/images/banner1.jpg");

  const images = [
    "/images/banner1.jpg",
    "/images/banner2.jpg",
    "/images/banner3.jpg",
    "/images/banner4.jpg",
  ];

  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => quantity > 1 && setQuantity(quantity - 1);

  return (
    <div className="min-h-screen p-10 bg-secondary flex items-center justify-center">
      <div className=" w-full bg-glassyWhite bg-opacity-90 shadow-lg rounded-2xl p-8 backdrop-blur-md">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6">
          <ul className="flex space-x-2">
            <li>Fashion</li>
            <li>/</li>
            <li>Men</li>
            <li>/</li>
            <li>Clothing</li>
            <li>/</li>
            <li>Jackets</li>
          </ul>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className={`w-full h-64 md:h-80 lg:h-96 bg-gray-200 rounded-lg bg-cover bg-center`}
              style={{ backgroundImage: `url(${primaryImage})` }}
            ></div>

            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="w-16 h-16 bg-gray-300 rounded-md cursor-pointer transition-transform duration-300 hover:scale-110"
                  style={{
                    backgroundImage: `url(${image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onClick={() => setPrimaryImage(image)}
                ></div>
              ))}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-800">Product Name</h1>
            <p className="text-gray-500 mt-2">Brand: Apple & More</p>
            <p className="text-gray-500 mt-1">Size: 4ft | 72 kg | Fit: Slim</p>
            <div className="flex items-center mt-4">
              <span className="text-2xl font-bold text-gray-800">Rs. 999</span>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-medium text-gray-800">Color:</h2>
              <div className="flex items-center mt-2 space-x-4">
                <button className="w-8 h-8 rounded-full bg-pink-500 border-2 border-gray-300"></button>
                <button className="w-8 h-8 rounded-full bg-blue-500 border-2 border-gray-300"></button>
                <button className="w-8 h-8 rounded-full bg-red-500 border-2 border-gray-300"></button>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-800">Quantity:</h2>
              <div className="flex items-center mt-2">
                <button
                  className="bg-gray-300 p-2 rounded-md"
                  onClick={decreaseQuantity}
                >
                  -
                </button>
                <span className="mx-4 text-lg font-medium">{quantity}</span>
                <button
                  className="bg-gray-300 p-2 rounded-md"
                  onClick={increaseQuantity}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600">
                Order Now
              </button>
              <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg shadow-md hover:bg-gray-400">
                Add to Cart
              </button>
            </div>

            <div className="mt-4 flex items-center space-x-4">
              <button className="text-blue-500 hover:underline">
                Visit Store
              </button>
              <button className="text-gray-500">
                <i className="fas fa-heart"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Product Description
          </h2>
          <p className="mt-2 text-gray-600">
            This is a detailed description of the product. It highlights
            features, specifications, and benefits. The product is designed to
            meet the needs of modern consumers with a focus on quality,
            durability, and style. Available in multiple colors and sizes to
            suit your preference.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
