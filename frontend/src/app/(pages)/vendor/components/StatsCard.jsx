"use client"

const StatsCard = ({ title, value }) => (
    <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg">{title}</h3>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
  
  export default StatsCard;
  