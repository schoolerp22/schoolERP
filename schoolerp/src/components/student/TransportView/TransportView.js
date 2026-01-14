import React from "react";

const TransportView = ({ transport }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Bus Details</h3>
      {transport && transport.bus_no ? (
        <div className="space-y-2">
          <p>
            <strong>Bus No:</strong> {transport.bus_no}
          </p>
          <p>
            <strong>Route:</strong> {transport.route || "Not specified"}
          </p>
        </div>
      ) : (
        <p className="text-gray-500">No Transport Assigned</p>
      )}
    </div>
  );
};

export default TransportView;