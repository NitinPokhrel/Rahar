"use client"

import StatsCard from "../components/StatsCard";
import ChartComponent from "../components/Chart";

export default function Dashboard() {
  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Orders" value="$9,300" />
        <StatsCard title="In Transit" value="$1,599" />
        <StatsCard title="Return Orders" value="$1,120" />
        <StatsCard title="Pending Orders" value="$2,921" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Total Sales</h3>
          <ChartComponent />
        </div>

        {/* Side Widgets */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-teal-400 text-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-bold">Visa Premium Account</h4>
            <p>Cardholder: Milan Bhattarai</p>
            <p>Exp: 06/11</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-bold">Categories</h4>
            <p>Electronics: 44%</p>
            <p>Accessories: 55%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
