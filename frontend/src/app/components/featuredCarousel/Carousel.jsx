"use client"
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/swiper-bundle.css'; 
import Image from 'next/image';

const banners = [
  { id: 1, imgSrc: '/images/banner1.jpg', alt: 'Banner 1' },
  { id: 2, imgSrc: '/images/banner2.jpg', alt: 'Banner 2' },
  { id: 3, imgSrc: '/images/banner3.jpg', alt: 'Banner 3' },

];

const Carousel = () => {
  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]} 
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000 }} 
      loop={true} 
      className="mySwiper" 
    >
      {banners.map((banner) => (
        <SwiperSlide key={banner.id}>
        <div  className="w-full h-60 object-cover" >
          <Image
            src={banner.imgSrc}
            alt={banner.alt}
            height={240}
            width={500}
            className="object-cover w-full h-auto "
            priority 
          />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default Carousel;
