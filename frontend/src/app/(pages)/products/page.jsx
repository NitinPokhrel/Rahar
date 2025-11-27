"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Pagination from "../../components/pagination/Pagination"; // Assume you have this component
import Filters from "../../components/filter/ProductFilter"; // Assuming you have this component

// Dummy data for products
const dummyProducts = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  title: `Product ${index + 1}`,
  price: (Math.random() * 1000).toFixed(2),
  discount: (Math.random() * 50).toFixed(0),
  rating: (Math.random() * 5).toFixed(1),
  reviews: Math.floor(Math.random() * 1000),
  imgSrc: `/images/product-${(index % 5) + 1}.jpg`,
  category: `Category ${(index % 5) + 1}`, // Example filter field
}));

export default function Products() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(Math.ceil(dummyProducts.length / 10)); // Total pages
  const [isFetching, setIsFetching] = useState(false);
  const [filters, setFilters] = useState({}); // Holds the applied filters
  const scrollContainerRef = useRef(null);

  // Load products based on current page and filters
  useEffect(() => {
    const filteredProducts = applyFilters();
    const paginatedProducts = filteredProducts.slice(0, currentPage * 10);
    setProducts(paginatedProducts);
  }, [currentPage, filters]);

  // Apply filters to the products
  const applyFilters = () => {
    let filtered = dummyProducts;

    // Example filter by category
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Additional filters can be applied here (e.g., price range, rating)
    return filtered;
  };

  // Infinite scroll logic (for the first 4 pages)
  useEffect(() => {
    const handleScroll = () => {
      if (
        scrollContainerRef.current &&
        scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >=
          scrollContainerRef.current.scrollHeight &&
        currentPage < 4 &&
        !isFetching
      ) {
        setIsFetching(true);
        setCurrentPage((prevPage) => prevPage + 1);
        setIsFetching(false);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isFetching, currentPage]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar with Filters */}
      <div className="w-1/4 p-4">
        <Filters filters={filters} setFilters={setFilters} />
      </div>

      {/* Main section for Products */}
      <div className="w-3/4 p-4" ref={scrollContainerRef}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-screen-lg">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-glassyWhite hover:transform hover:translate-y-[-3px] transition-all duration-150 cursor-pointer backdrop-blur-md rounded-lg overflow-hidden shadow-lg hover:shadow-xl"
            >
              <div className="w-full h-40 overflow-hidden rounded-t-lg">
                <Image
                  src={product.imgSrc}
                  alt={product.title}
                  width={500}
                  height={500}
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="px-4 py-2">
                <h3 className="text-[0.8rem] font-semibold mb-1">
                  {product.title}
                </h3>
                <p className="text-red-500 text-[0.9rem] font-bold">
                  Rs. {product.price}
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

        {/* Pagination appears after 4 scrolls */}
        {currentPage >= 4 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
