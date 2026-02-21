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
    <div className="space-y-4 md:space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">📊 Attendance Overview</h1>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-gray-500 text-sm md:text-base mb-1">Total Days</p>
          <p className="text-xl md:text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-gray-500 text-sm md:text-base mb-1">Present</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            {stats.presentPercent}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-gray-500 text-sm md:text-base mb-1">Absent</p>
          <p className="text-xl md:text-2xl font-bold text-red-600">
            {stats.absentPercent}%
          </p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* PIE CHART */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-4 text-gray-800">Present vs Absent</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="font-semibold mb-4 text-gray-800">Daily Attendance</h2>
          <div className="overflow-x-auto hide-scrollbar">
            <div style={{ minWidth: '400px' }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* ATTENDANCE TABLE */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-4">Attendance History</h2>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {attendance.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">No attendance records found</div>
          ) : (
            attendance.map(a => (
              <div key={a._id} className="border border-gray-100 p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{new Date(a.date).toLocaleDateString()}</span>
                  <span
                    className={`font-semibold text-sm px-2 py-1 rounded bg-opacity-10 ${a.status === "Present" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
                      }`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                  <span>Class: <span className="font-medium text-gray-800">{a.class_section}</span></span>
                  <span className="text-xs">By {a.marked_by_name || a.marked_by_id || a.marked_by}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
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
                <tr key={a._id} className="hover:bg-gray-50 text-center">
                  <td className="border px-4 py-2">
                    {new Date(a.date).toLocaleDateString()}
                  </td>
                  <td
                    className={`border px-4 py-2 font-semibold ${a.status === "Present" ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {a.status}
                  </td>
                  <td className="border px-4 py-2">{a.class_section}</td>
                  <td className="border px-4 py-2 text-sm text-gray-500">{a.marked_by_name || a.marked_by_id || a.marked_by}</td>
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
