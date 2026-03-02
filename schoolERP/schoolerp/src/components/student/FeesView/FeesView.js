import React from "react";

const FeesView = ({ payments }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Payment History</h3>
      {payments && payments.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Months</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Mode</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2 text-sm">
                  {payment.paidAt || payment.date
                    ? new Date(payment.paidAt || payment.date).toLocaleDateString("en-IN")
                    : "-"}
                </td>
                <td className="p-2 text-sm text-gray-600">
                  {(payment.months || []).join(", ") || "-"}
                </td>
                <td className="p-2 font-medium">₹{payment.totalAmount ?? payment.amount ?? "-"}</td>
                <td className="p-2 text-sm text-gray-500">{payment.paymentMode || "-"}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${["paid", "Paid"].includes(payment.status)
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    }`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No Records Found</p>
      )}
    </div>
  );
};

export default FeesView;
