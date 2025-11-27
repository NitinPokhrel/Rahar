"use client"
import React from 'react'
import Carousel from '../components/featuredCarousel/Carousel'
import FlashSale from '../components/flashSale/FlashSale'
import Categories from '../components/categories/Categories'
import ProductGrid from "../components/ProductGrid/ProductGrid.jsx"
import Footer from '../components/layout/Footer'
import ProductDetails from '../components/productDetails/ProductDetails'
import Header from '../components/layout/Header'

const Home = () => {
  return (
    <>  
        <Header/>
      <Carousel/>
      <FlashSale />
      <Categories />
      <ProductGrid />
      <Footer />
      <ProductDetails />
    </>

    
  )
}

export default Home