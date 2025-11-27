"use client"
import React from 'react';
import {useState,useEffect} from "react"
import Image from 'next/image';

const products = [
  { id: 1, title: 'Adjustable Ring For Men', price: 65, discount: 57, rating: 4.2, reviews: 224, imgSrc: '/images/banner1.jpg' },
  { id: 2, title: 'Shoe Rack with 12mm Pipes', price: 860, discount: 43, rating: 4.1, reviews: 18, imgSrc: '/images/product2.jpg' },
  { id: 3, title: '360 Degree Rotating Hook', price: 70, discount: 53, rating: 4.5, reviews: 81, imgSrc: '/images/product3.jpg' },
  { id: 4, title: 'Oversized Cat Eye Glasses', price: 300, discount: 78, rating: 4.8, reviews: 15, imgSrc: '/images/product4.jpg' },
  { id: 5, title: 'Smartwatch with Bluetooth', price: 776, discount: 65, rating: 4.3, reviews: 82, imgSrc: '/images/product5.jpg' },
  { id: 6, title: 'Mini Hair Straightener', price: 260, discount: 48, rating: 4.4, reviews: 82, imgSrc: '/images/product6.jpg' },
  { id: 7, title: 'Luxury Leather Watch Set', price: 527, discount: 65, rating: 4.5, reviews: 72, imgSrc: '/images/product7.jpg' },
  { id: 8, title: 'Type C Cable Super Charging', price: 312, discount: 78, rating: 4.8, reviews: 50, imgSrc: '/images/product8.jpg' },
  { id: 9, title: 'Planter Stand for Home', price: 969, discount: 35, rating: 4.9, reviews: 316, imgSrc: '/images/product9.jpg' },
  { id: 10, title: '3pcs LED Beads Light', price: 168, discount: 82, rating: 4.1, reviews: 70, imgSrc: '/images/product10.jpg' },
  { id: 11, title: 'Banana Silicone Teether', price: 72, discount: 71, rating: 4.7, reviews: 70, imgSrc: '/images/product11.jpg' },
  { id: 12, title: 'Product 12', price: 150, discount: 25, rating: 4.2, reviews: 100, imgSrc: '/images/product12.jpg' },
];


const chunkProducts = (products, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < products.length; i += chunkSize) {
    chunks.push(products.slice(i, i + chunkSize));
  }

  return chunks;
};

const ProductGrid = () => {

  const [chunkSize, setChunkSize] = useState(6);
  const rows = chunkProducts(products, chunkSize);

 
  const handleResize = () => {
    if (window.innerWidth >= 1360) {
      setChunkSize(6); 
    } else if (window.innerWidth >= 1145) {
      setChunkSize(5);  
    }else if(window.innerWidth >=930){
      setChunkSize(4)
    } else if(window.innerWidth >=728){
      setChunkSize(3);  
    }else{
      setChunkSize(6);
    }
  };


  useEffect(() => {
    handleResize(); 
    window.addEventListener('resize', handleResize); 

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="bg-secondary p-4 rounded-lg shadow-md px-3 sm:px-10">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold mb-4">Just For You</h2>
      <button className="text-sm text-blue-600">See More</button>
</div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex overflow-x-auto  space-x-4 mb-4">
          {row.map((product) => (
            <div
              key={product.id}
              className="w-full bg-glassyWhite h-72 hover:transform hover:translate-y-[-3px] transition-all duration-150 cursor-pointer backdrop-blur-md m-auto  rounded-lg min-w-[200px]  overflow-hidden  shadow "
            >
              <div className="w-full h-40 object-cover mb-4 rounded-t-lg">
                <Image
                  src={product.imgSrc}
                  alt={product.title}
                  width={500}
                  height={500}
                />
              </div>

              <div className="px-4">
                <h3 className="text-[0.8rem] font-semibold mb-2">
                  {product.title}
                </h3>
                <p className="text-red-500 text-[0.8rem] font-bold">
                  Rs.{product.price}
                </p>
                <p className="text-gray-500 text-[0.7rem] line-through">
                  -{product.discount}%
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-400">
                    {"★".repeat(Math.floor(product.rating))}
                  </span>
                  <span className="ml-1 text-gray-500 text-[0.6rem]">
                    ({product.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="flex justify-center w-full">
        <button
          className="cursor-pointer transition-all mx-auto bg-blue-500 text-white px-6 py-2 rounded-lg
border-blue-600
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"                         
        >
          Load More
        </button>
      </div>
    </div>
  );
};

export default ProductGrid;
