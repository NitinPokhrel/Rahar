"use client"
import { useState } from 'react';

const MyOrders = () => {
  const [selectedFilter, setSelectedFilter] = useState('All Orders');
  const [activeTab, setActiveTab] = useState('All');

  const orders = [
    {
      id: 1,
      vendor: 'VIBRANT HEALTH',
      product: 'Vibrance Micronized Creatine Powder',
      price: 1049,
      quantity: 1,
      status: 'Cancelled',
      category: 'To Receive',
      image: '/images/creatine.png',
    },
    {
      id: 2,
      vendor: 'Pasale Dai Electronics',
      product: 'Gigaware V3 6D Professional Gaming Sensor Mouse',
      price: 555,
      quantity: 1,
      status: 'Completed',
      category: 'Completed',
      image: '/images/mouse.png',
    },
  ];

  const filters = ['Last 5 orders', 'Last 15 days', 'Last 30 days', 'Last 6 months', 'Orders placed in 2024', 'All Orders'];
  
  // Function to filter orders based on the active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'All') return true;
    return order.category === activeTab;
  });

  return (
    <div className=" bg-gray-50">
      <h1 className="text-2xl md:text-3xl p-6 font-bold mb-4">My Orders</h1>

      {/* Filter Tabs */}
      <div className="flex space-x-6 mb-4 border-b">
        <button 
          className={`pb-2 ${activeTab === 'All' ? 'border-b-2 border-black' : 'text-gray-500'}`} 
          onClick={() => setActiveTab('All')}
        >
          All
        </button>
        <button 
          className={`pb-2 ${activeTab === 'To Pay' ? 'border-b-2 border-black' : 'text-gray-500'}`} 
          onClick={() => setActiveTab('To Pay')}
        >
          To Pay
        </button>
        <button 
          className={`pb-2 ${activeTab === 'To Ship' ? 'border-b-2 border-black' : 'text-gray-500'}`} 
          onClick={() => setActiveTab('To Ship')}
        >
          To Ship
        </button>
        <button 
          className={`pb-2 ${activeTab === 'To Receive' ? 'border-b-2 border-black' : 'text-gray-500'}`} 
          onClick={() => setActiveTab('To Receive')}
        >
          To Receive
        </button>
        <button 
          className={`pb-2 ${activeTab === 'To Review' ? 'border-b-2 border-black' : 'text-gray-500'}`} 
          onClick={() => setActiveTab('To Review')}
        >
          To Review (2)
        </button>
      </div>

      {/* Filter Dropdown */}
      <div className="flex justify-between mb-4">
        <div>
          <label htmlFor="filter" className="mr-2">Show:</label>
          <select
            id="filter"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="border rounded-md p-2"
          >
            {filters.map((filter) => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="p-4 bg-white shadow rounded-md">
              <div className="flex justify-between">
                <div>
                  <h2 className="font-semibold">{order.vendor}</h2>
                  <p className="text-sm text-gray-500">{order.product}</p>
                  <p className="mt-2">Rs. {order.price}</p>
                  <p>Qty: {order.quantity}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {order.status}
                  </span>
                  <img src={order.image} alt={order.product} className="w-16 h-16 object-cover" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No orders found for this category.</p>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
