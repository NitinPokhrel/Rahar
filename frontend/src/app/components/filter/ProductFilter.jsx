import { useState } from "react";

const Filters = ({ setFilters }) => {
  // Dummy data for categories, colors, and sizes
  const categories = [
    { id: "cat1", name: "Electronics" },
    { id: "cat2", name: "Fashion" },
    { id: "cat3", name: "Home Appliances" },
    { id: "cat4", name: "Books" },
    { id: "cat5", name: "Toys" },
    { id: "cat6", name: "Beauty Products" },
  ];

  const variantAttributes = {
    Color: [
      { id: "color1", value: "White" },
      { id: "color2", value: "Black" },
      { id: "color3", value: "Red" },
      { id: "color4", value: "Blue" },
      { id: "color5", value: "Green" },
      { id: "color6", value: "Yellow" },
    ],
    Size: [
      { id: "size1", value: "Small" },
      { id: "size2", value: "Medium" },
      { id: "size3", value: "Large" },
      { id: "size4", value: "X-Large" },
      { id: "size5", value: "XX-Large" },
    ],
  };

  const [filters, setFilterState] = useState({
    category: [],
    color: [],
    size: [],
    price: 0,
    rating: null,
    discount: false,
  });

  const [showMore, setShowMore] = useState({
    category: false,
    sizeWear: false,
    color: false,
  });

  const handleFilterChange = (e) => {
    const { name, value, checked } = e.target;
    setFilterState((prevState) => ({
      ...prevState,
      [name]: checked
        ? [...prevState[name], value]
        : prevState[name].filter((v) => v !== value),
    }));
  };

  const handlePriceChange = (e) => {
    setFilterState({ ...filters, price: e.target.value });
  };

  const toggleViewMore = (filterName) => {
    setShowMore({ ...showMore, [filterName]: !showMore[filterName] });
  };

  const applyFilters = () => {
    setFilters(filters);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Filters</h3>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Category</h4>
        {categories.slice(0, showMore.category ? categories.length : 5).map((category, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="checkbox"
              name="category"
              value={category.id}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm">{category.name}</label>
          </div>
        ))}
        {categories.length > 5 && (
          <button
            onClick={() => toggleViewMore("category")}
            className="text-blue-500 text-sm mt-2"
          >
            {showMore.category ? "View Less" : "View More"}
          </button>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Price</h4>
        <input
          type="range"
          name="price"
          min="0"
          max="10000"
          step="100"
          onChange={handlePriceChange}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="mt-2 text-sm">Price: {filters.price || 0}</div>
      </div>

      {/* Color Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Color</h4>
        {variantAttributes.Color.slice(0, showMore.color ? variantAttributes.Color.length : 5).map((color, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="checkbox"
              name="color"
              value={color.id}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm">{color.value}</label>
          </div>
        ))}
        {variantAttributes.Color.length > 5 && (
          <button
            onClick={() => toggleViewMore("color")}
            className="text-blue-500 text-sm mt-2"
          >
            {showMore.color ? "View Less" : "View More"}
          </button>
        )}
      </div>

      {/* Size Wear Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Size Wear</h4>
        {variantAttributes.Size.slice(0, showMore.sizeWear ? variantAttributes.Size.length : 5).map((size, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="checkbox"
              name="size"
              value={size.id}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm">{size.value}</label>
          </div>
        ))}
        {variantAttributes.Size.length > 5 && (
          <button
            onClick={() => toggleViewMore("sizeWear")}
            className="text-blue-500 text-sm mt-2"
          >
            {showMore.sizeWear ? "View Less" : "View More"}
          </button>
        )}
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Rating</h4>
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center mb-2">
            <input
              type="radio"
              name="rating"
              value={rating}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm">{rating} Stars & Up</label>
          </div>
        ))}
      </div>

      {/* Discount Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Discount</h4>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            name="discount"
            value="40"
            onChange={handleFilterChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm">40% & Above</label>
        </div>
      </div>

      {/* Apply Filter Button */}
      <button
        className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={applyFilters}
      >
        Apply Filters
      </button>
    </div>
  );
};

export default Filters;
