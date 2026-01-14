import React from "react";

const Card = ({ title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-indigo-900">{value}</h3>
    </div>
  );
};

export default Card;