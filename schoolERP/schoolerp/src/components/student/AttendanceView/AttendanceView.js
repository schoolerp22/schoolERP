import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#22c55e", "#ef4444"]; // green, red

const AttendanceView = ({ attendance = [] }) => {

  // -------------------------
  // CALCULATE STATS
  // -------------------------
  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === "Present").length;
    const absent = attendance.filter(a => a.status === "Absent").length;

    return {
      total,
      present,
      absent,
      presentPercent: total ? ((present / total) * 100).toFixed(1) : 0,
      absentPercent: total ? ((absent / total) * 100).toFixed(1) : 0
    };
  }, [attendance]);

  const pieData = [
    { name: "Present", value: stats.present },
    { name: "Absent", value: stats.absent }
  ];

  const barData = attendance.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    Present: item.status === "Present" ? 1 : 0,
    Absent: item.status === "Absent" ? 1 : 0
  }));

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">📊 Attendance</h1>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Total Days</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Present</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.presentPercent}%
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Absent</p>
          <p className="text-2xl font-bold text-red-600">
            {stats.absentPercent}%
          </p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PIE CHART */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">Present vs Absent</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR CHART */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">Daily Attendance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill="#22c55e" />
              <Bar dataKey="Absent" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ATTENDANCE TABLE */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-4">Attendance History</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Class</th>
                <th className="border px-4 py-2">Marked By</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => (
                <tr key={a._id}>
                  <td className="border px-4 py-2">
                    {new Date(a.date).toLocaleDateString()}
                  </td>
                  <td
                    className={`border px-4 py-2 font-semibold ${
                      a.status === "Present" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {a.status}
                  </td>
                  <td className="border px-4 py-2">{a.class_section}</td>
                  <td className="border px-4 py-2">{a.marked_by_name || a.marked_by_id || a.marked_by}</td>
                </tr>
              ))}

              {attendance.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AttendanceView;
