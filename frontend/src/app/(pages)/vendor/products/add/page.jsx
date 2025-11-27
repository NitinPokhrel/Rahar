"use client";
import React, { useState, useEffect } from "react";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    sku: "",
    stock: "",
    category: "",
    brand: "",
    discount: "",
    metaTitle: "",
    metaDescription: "",
    attributes: [],
    variants: [],
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState({
    name: "",
    values: [],
    newValue: "",
  });



  useEffect(() => {
    return () => {
      // Cleanup image URLs when component unmounts
      images.forEach(image => {
        if (image instanceof File) {
          URL.revokeObjectURL(URL.createObjectURL(image));
        }
      });
    };
  }, [images]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );
    setImages(prev => [...prev, ...files].slice(0, 5));
  };

  // Attribute Management
  const addAttributeValue = () => {
    const trimmedValue = currentAttribute.newValue.trim();
    if (trimmedValue) {
      setCurrentAttribute(prev => ({
        ...prev,
        values: [...new Set([...prev.values, trimmedValue])],
        newValue: ""
      }));
    }
  };

  const addAttribute = () => {
    if (currentAttribute.name.trim() && currentAttribute.values.length >= 2) {
      setFormData(prev => ({
        ...prev,
        attributes: [...prev.attributes, currentAttribute]
      }));
      setCurrentAttribute({ name: "", values: [], newValue: "" });
    }
  };

  // Variant Generation
  const generateVariants = () => {
    if (formData.attributes.length === 0) {
      setErrors({ variants: "Please add attributes first" });
      return;
    }

    const generateCombinations = (attributes, index = 0, current = {}) => {
      if (index === attributes.length) return [current];
      const { name, values } = attributes[index];
      return values.flatMap(value => 
        generateCombinations(attributes, index + 1, { ...current, [name]: value })
      );
    };

    const combinations = generateCombinations(formData.attributes);
    const variants = combinations.map(combination => ({
      attributes: combination,
      price: formData.price || 0,
      stock: formData.stock || 0,
      sku: `${formData.sku}-${Object.values(combination).join("-")}`,
      images: []
    }));

    setFormData(prev => ({ ...prev, variants }));
    setErrors({});
  };

  // Variant Updates
  const updateVariant = (index, field, value) => {
    setFormData(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
      return { ...prev, variants: updatedVariants };
    });
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting product data:", formData)
    console.log("Images:", images)
    const newErrors = {};
    
    // Basic validation
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price || formData.price < 0) newErrors.price = "Valid price required";
    if (formData.variants.length === 0) newErrors.variants = "Generate variants first";
    if (images.length === 0) newErrors.images = "At least one product image is required";
    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = "Meta title should not exceed 60 characters";
    }
    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = "Meta description should not exceed 160 characters";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    console.log("Submitting product data:", formData);
    try {
      // Simulated API call
      console.log("Images:", images);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        sku: "",
        stock: "",
        category: "",
        brand: "",
        discount: "",
        metaTitle: "",
        metaDescription: "",
        attributes: [],
        variants: [],
      });
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 sm:p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Add New Product
            </h1>
            <p className="text-gray-600 mt-2">Create a new product listing with variants and specifications</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full p-2 rounded border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300"
                  />
                </div>

              </div>
            </section>

            {/* Product Images Section */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Product Images
              </h2>
              
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const files = Array.from(e.dataTransfer.files).filter(
                      file => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
                    );
                    setImages(prev => [...prev, ...files].slice(0, 5));
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer">
                    <div className="text-gray-600">
                      <i className="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                      <p>Drag & drop images here or click to browse</p>
                      <p className="text-sm text-gray-500 mt-1">Maximum 5 images, 5MB each</p>
                    </div>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Product preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Attributes Section */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Product Attributes & Variants
              </h2>

              <div className="space-y-6">
                {/* Existing attribute input fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Attribute Name
                    </label>
                    <input
                      type="text"
                      value={currentAttribute.name}
                      onChange={e => setCurrentAttribute(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      className="w-full p-2 rounded border border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Add Values
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentAttribute.newValue}
                        onChange={e => setCurrentAttribute(prev => ({
                          ...prev,
                          newValue: e.target.value
                        }))}
                        className="w-full p-2 rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={addAttributeValue}
                        className="px-3 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Current Values
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentAttribute.values.map((value, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1"
                        >
                          {value}
                          <button
                            type="button"
                            onClick={() => setCurrentAttribute(prev => ({
                              ...prev,
                              values: prev.values.filter((_, i) => i !== index)
                            }))}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Attribute
                </button>

                {formData.attributes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      Added Attributes:
                    </h3>
                    {formData.attributes.map((attr, index) => (
                      <div key={index} className="bg-gray-100 p-3 rounded">
                        <span className="font-medium">{attr.name}:</span>
                        <span className="ml-2 text-gray-600">
                          {attr.values.join(', ')}
                        </span>
                      </div>
                    ))}

                    {/* Generate Variants button moved here */}
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={generateVariants}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Generate Variants
                      </button>
                      {errors.variants && (
                        <p className="text-red-500 text-sm mt-2">{errors.variants}</p>
                      )}
                    </div>

                    {/* Variants table moved here */}
                    {formData.variants.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-600 mb-4">
                          Product Variants
                        </h3>
                        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left text-sm">Attributes</th>
                                <th className="p-2 text-left text-sm">SKU</th>
                                <th className="p-2 text-left text-sm">Price</th>
                                <th className="p-2 text-left text-sm">Stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.variants.map((variant, index) => (
                                <tr key={index} className="border-t border-gray-200">
                                  <td className="p-2">
                                    {Object.entries(variant.attributes).map(([key, value]) => (
                                      <div key={key} className="text-sm">
                                        <span className="font-medium">{key}:</span> {value}
                                      </div>
                                    ))}
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={variant.sku}
                                      onChange={e => updateVariant(index, 'sku', e.target.value)}
                                      className="w-full p-1 rounded border border-gray-300"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={variant.price}
                                      onChange={e => updateVariant(index, 'price', e.target.value)}
                                      className="w-full p-1 rounded border border-gray-300"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={variant.stock}
                                      onChange={e => updateVariant(index, 'stock', e.target.value)}
                                      className="w-full p-1 rounded border border-gray-300"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* SEO Section */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                SEO Information
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={e => setFormData({...formData, metaTitle: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300"
                    placeholder="Enter SEO title (55-60 characters recommended)"
                  />
                  <p className="text-xs text-gray-500">
                    Characters: {formData.metaTitle.length}/60
                  </p>
                  {errors.metaTitle && <p className="text-red-500 text-sm">{errors.metaTitle}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={e => setFormData({...formData, metaDescription: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 h-24"
                    placeholder="Enter meta description (150-160 characters recommended)"
                  />
                  <p className="text-xs text-gray-500">
                    Characters: {formData.metaDescription.length}/160
                  </p>
                  {errors.metaDescription && <p className="text-red-500 text-sm">{errors.metaDescription}</p>}
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button
  type="submit"
  disabled={loading}
  className={`w-full md:w-auto px-6 py-2 rounded-md font-medium text-white transition duration-200 ${
    loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {loading ? (
    <span className="flex items-center gap-2 justify-center">
      <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        ></path>
      </svg>
      Submitting...
    </span>
  ) : (
    "Add Product"
  )}
</button>

            </div>
          </form>

          {success && (
            <div className="fixed bottom-4 right-4 bg-green-100 text-green-700 p-3 rounded-lg shadow-lg">
              Product saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}