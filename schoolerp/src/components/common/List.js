import React from "react";

const List = ({ title, data, label }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {data && data.length > 0 ? (
        data.map((item, i) => (
          <div key={i} className="p-3 border-b hover:bg-gray-50">
            {item[label] || "N/A"}
          </div>
        ))
      ) : (
        <p className="text-gray-500">No Records Found</p>
      )}
    </div>
  );
};

export default List;