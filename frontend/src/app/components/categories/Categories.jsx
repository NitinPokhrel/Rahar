"use client"
import Image from 'next/image';
import React from 'react';

const categories = [
  {
    id: 1,
    title: 'Electronics',
    imgSrc: '/images/banner1.jpg', 
  },
  {
    id: 2,
    title: 'Fashion',
    imgSrc: '/images/banner2.jpg', 
  },
  {
    id: 3,
    title: 'Home & Kitchen',
    imgSrc: '/images/banner3.jpg',
  },
  {
    id: 4,
    title: 'Books',
    imgSrc: '/images/banner1.jpg', 
  },
  {
    id: 5,
    title: 'Sports',
    imgSrc: '/images/banner2.jpg', 
  },
  {
    id: 6,
    title: 'Beauty',
    imgSrc: '/images/banner3.jpg', 
  },
  {
    id: 7,
    title: 'Toys',
    imgSrc: '/images/logo.jpeg', 
  },
  {
    id: 8,
    title: 'Automotive',
    imgSrc: '/images/banner1.jpg', 
  },
];

const Categories = () => {
  return (
    <div className=" p-4 rounded-lg px-3 sm:px-10  ">
      <h2 className="text-2xl font-bold mb-4 text-start">Categories</h2> 
      <div className="flex bg-white backdrop-blur-md  rounded-md py-4 overflow-x-auto space-x-4 px-6 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent "> 
        {categories.map((category) => (
          <div key={category.id} className="w-full py-4  m-auto rounded-lg min-w-[125px] transition-all ease-linear duration-200 hover:scale-105 cursor-pointer overflow-hidden ">
           
            <Image
              src={category.imgSrc}
              alt={category.title}
              height = {112}
              width = {112}
              className = "object-cover h-28 w-28 mx-auto cursor-pointer  shadow-md rounded-full"
            />
            
            <h3 className="text-center mt-2  font-semibold">{category.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
