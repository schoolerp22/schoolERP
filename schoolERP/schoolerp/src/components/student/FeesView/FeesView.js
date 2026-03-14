import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Eye, Printer, Download, X, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function StudentFeesView({ payments: passedPayments }) {
  const { user } = useSelector((s) => s.auth);
  const admissionNo = user?.admission_no || user?.creds?.id || user?.id;
  const token = localStorage.getItem("token");

  const [feeData, setFeeData] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [viewingBreakdown, setViewingBreakdown] = useState(null);
  const [schoolSettings, setSchoolSettings] = useState({});
  const [isThermal, setIsThermal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const start = m < 3 ? y - 1 : y;
    return `${start}-${start + 1}`;
  });

  const receiptRef = useRef();

  useEffect(() => {
    if (!admissionNo) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/parent/child/${admissionNo}/fees`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/parent/child/${admissionNo}/receipts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/admin/school-settings`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : {}),
    ]).then(([fees, recs, settings]) => {
      setFeeData(fees);
      setReceipts(Array.isArray(recs) ? recs : (passedPayments || []));
      setSchoolSettings(settings || {});
      setLoading(false);
    }).catch(() => {
      setReceipts(passedPayments || []);
      setLoading(false);
    });
  }, [admissionNo, token, passedPayments]);

  const pendingDues = (feeData?.dues || []).filter(d => !d.isPaid && d.totalDue > 0);
  const pendingAdhoc = (feeData?.adhocFees || []).filter(f => !f.isPaid);
  const paidAdhoc = (feeData?.adhocFees || []).filter(f => f.isPaid);
  const pendingOneTime = (feeData?.oneTimeFees || []).filter(f => !f.isPaid);
  const paidOneTime = (feeData?.oneTimeFees || []).filter(f => f.isPaid);

  const totalPending = pendingDues.reduce((s, d) => s + d.totalDue, 0) +
    pendingAdhoc.reduce((s, f) => s + Number(f.amount || 0), 0) +
    pendingOneTime.reduce((s, f) => s + Number(f.amount || 0), 0);

  const totalPaid = feeData?.summary?.totalPaid ||
    receipts.reduce((s, r) => s + Number(r.amountPaid || r.totalAmount || 0), 0);

  const now = new Date();
  const currentAcademicStart = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => {
    const s = currentAcademicStart - i;
    return `${s}-${s + 1}`;
  });

  const filteredReceipts = selectedYear
    ? receipts.filter(r => {
      if (!r.paidAt) return false;
      const [sy, ey] = selectedYear.split("-");
      const from = new Date(parseInt(sy), 3, 1);
      const to = new Date(parseInt(ey), 2, 31, 23, 59, 59);
      const d = new Date(r.paidAt);
      return d >= from && d <= to;
    })
    : receipts;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${viewingReceipt?.receiptNo}`,
  });

  const handleDownloadPDF = async () => {
    if (!viewingReceipt || !receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: "#fff" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`Receipt_${viewingReceipt.receiptNo}.pdf`);
    } catch (e) {
      alert("Could not generate PDF. Use Print instead.");
    }
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = Math.floor(Math.abs(num));
    if (n === 0) return 'Rupees Zero Only';
    if (n < 20) return `Rupees ${ones[n]} Only`;
    if (n < 100) return `Rupees ${tens[Math.floor(n / 10)]} ${ones[n % 10]} Only`.trim();
    return `Rupees ${num.toLocaleString()} Only`;
  };

  const pendingCount = pendingDues.length + pendingAdhoc.length + pendingOneTime.length;
  const paidCount = receipts.length + paidAdhoc.length + paidOneTime.length;

  const tabBtn = (id, label, count) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === id ? "bg-indigo-600 text-white shadow" : "text-gray-500 hover:bg-gray-100"}`}
    >
      {label}
      {count > 0 && (
        <span className={`text-xs rounded-full px-1.5 ${activeTab === id ? "bg-white text-indigo-600" : "bg-orange-500 text-white"}`}>
          {count}
        </span>
      )}
    </button>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">✅ Total Paid</p>
          <p className="text-xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs text-orange-600 font-medium mb-1">📅 Pending Months</p>
          <p className="text-xl font-bold text-orange-600">{pendingDues.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium mb-1">⚠️ Pending Amount</p>
          <p className="text-xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">🧾 Receipts</p>
          <p className="text-xl font-bold text-blue-600">{receipts.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-xl w-fit">
        {tabBtn("pending", "📅 Pending Dues", pendingCount)}
        {tabBtn("paid", "✅ Paid Fees", paidCount)}
        {tabBtn("history", "📋 Payment History", 0)}
      </div>

      {/* ── PENDING DUES TAB ── */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingCount === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-bold text-green-700 text-lg">All Fees Cleared!</p>
              <p className="text-sm text-green-600 mt-1">No pending dues for this period.</p>
            </div>
          ) : (
            <>
              {pendingDues.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b bg-orange-50 flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <h3 className="font-bold text-orange-800">Monthly Fee Dues</h3>
                    <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2">{pendingDues.length}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {pendingDues.map(due => (
                      <div key={due.monthKey}>
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === due.monthKey ? null : due.monthKey)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-left">
                            <p className="font-semibold text-gray-800">{due.label}</p>
                            <p className="text-xs text-gray-500">
                              {(due.feeBreakdown || []).filter(h => h.remainingAmount > 0).length} fee heads pending
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-orange-600 text-lg">₹{Number(due.totalDue).toLocaleString()}</span>
                            {expandedMonth === due.monthKey
                              ? <ChevronUp size={16} className="text-gray-400" />
                              : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>
                        {expandedMonth === due.monthKey && (
                          <div className="bg-orange-50 px-4 pb-3">
                            <table className="w-full text-sm mt-2">
                              <thead>
                                <tr className="border-b border-orange-200">
                                  <th className="text-left py-1.5 text-orange-700 font-semibold">Fee Head</th>
                                  <th className="text-right py-1.5 text-orange-700 font-semibold">Total</th>
                                  <th className="text-right py-1.5 text-orange-700 font-semibold">Paid</th>
                                  <th className="text-right py-1.5 text-orange-700 font-semibold">Due</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(due.feeBreakdown || []).filter(h => h.remainingAmount > 0).map((h, i) => (
                                  <tr key={i} className="border-b border-orange-100 last:border-0">
                                    <td className="py-1.5 text-gray-700">{h.name}</td>
                                    <td className="py-1.5 text-right text-gray-500">₹{Number(h.amount || 0).toLocaleString()}</td>
                                    <td className="py-1.5 text-right text-green-600">₹{Number(h.paidAmount || 0).toLocaleString()}</td>
                                    <td className="py-1.5 text-right font-bold text-red-600">₹{Number(h.remainingAmount || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingAdhoc.length > 0 && (
                <div className="bg-white border border-yellow-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b bg-yellow-50 flex items-center gap-2">
                    <span>⚠️</span>
                    <h3 className="font-bold text-yellow-800">Additional Charges</h3>
                    <span className="ml-auto bg-yellow-500 text-white text-xs rounded-full px-2">{pendingAdhoc.length}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {pendingAdhoc.map((f, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{f.name}</p>
                          {f.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f.category}</span>}
                        </div>
                        <span className="font-bold text-orange-600">₹{Number(f.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingOneTime.length > 0 && (
                <div className="bg-white border border-purple-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b bg-purple-50 flex items-center gap-2">
                    <span>📦</span>
                    <h3 className="font-bold text-purple-800">One-Time Fees</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {pendingOneTime.map((f, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between items-center">
                        <p className="font-medium text-gray-800">{f.name}</p>
                        <span className="font-bold text-purple-600">₹{Number(f.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalPending > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">Total Outstanding</p>
                    <p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p>
                  </div>
                  <span className="text-4xl">⚠️</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── PAID FEES TAB ── */}
      {activeTab === "paid" && (
        <div className="space-y-4">
          {paidCount === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
              No paid fees found.
            </div>
          )}

          {/* Paid Monthly Dues from receipts */}
          {receipts.length > 0 && (
            <div className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b bg-green-50 flex items-center gap-2">
                <span>📅</span>
                <h3 className="font-bold text-green-800">Paid Monthly Dues</h3>
                <span className="ml-auto bg-green-500 text-white text-xs rounded-full px-2">{receipts.length}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {receipts.map((r, i) => {
                  const months = (r.months || []).join(", ") || "—";
                  const amount = r.amountPaid || r.totalAmount || 0;
                  return (
                    <div
                      key={i}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                      onClick={() => setViewingBreakdown(r)}
                    >
                      <div>
                        <p className="font-medium text-gray-800">{months}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{r.receiptNo}</span>
                          {r.paidAt && (
                            <span className="text-xs text-gray-400">
                              • {new Date(r.paidAt).toLocaleDateString("en-IN")}
                            </span>
                          )}
                          {r.paymentMode && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded">{r.paymentMode}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">₹{Number(amount).toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${["paid", "Paid"].includes(r.status) ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {r.status || "paid"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2 bg-green-50 flex justify-between items-center border-t">
                <span className="text-sm font-semibold text-green-800">Total Paid (Monthly)</span>
                <span className="text-lg font-bold text-green-700">
                  ₹{receipts.reduce((s, r) => s + Number(r.amountPaid || r.totalAmount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {paidAdhoc.length > 0 && (
            <div className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b bg-green-50 flex items-center gap-2">
                <span>⚠️</span>
                <h3 className="font-bold text-green-800">Paid Additional Charges</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {paidAdhoc.map((f, i) => (
                  <div key={i} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{f.name}</p>
                      {f.category && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{f.category}</span>}
                    </div>
                    <span className="font-bold text-green-600">₹{Number(f.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paidOneTime.length > 0 && (
            <div className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b bg-green-50 flex items-center gap-2">
                <span>📦</span>
                <h3 className="font-bold text-green-800">Paid One-Time Fees</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {paidOneTime.map((f, i) => (
                  <div key={i} className="px-4 py-3 flex justify-between items-center">
                    <p className="font-medium text-gray-800">{f.name}</p>
                    <span className="font-bold text-green-600">₹{Number(f.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENT HISTORY TAB ── */}
      {activeTab === "history" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-gray-800">📋 Payment History</h3>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All Years</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {filteredReceipts.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No payment records found for {selectedYear || "this period"}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Receipt No</th>
                    <th className="px-4 py-2 text-left">Month(s)</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Mode</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReceipts.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.receiptNo || `#${i + 1}`}</td>
                      <td className="px-4 py-3 text-gray-600">{(r.months || []).join(", ") || "—"}</td>
                      <td
                        className="px-4 py-3 font-semibold text-green-700 cursor-pointer hover:underline"
                        onClick={() => setViewingBreakdown(r)}
                        title="Click to see payment distribution"
                      >
                        ₹{(r.amountPaid || r.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.paymentMode || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${["paid", "Paid"].includes(r.status) ? "bg-green-100 text-green-700" : r.status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {r.status || "paid"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setViewingReceipt(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENT DISTRIBUTION MODAL ── */}
      {viewingBreakdown && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setViewingBreakdown(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b bg-indigo-50">
              <div>
                <h3 className="font-bold text-indigo-800 text-lg">💳 Payment Distribution</h3>
                <p className="text-xs text-indigo-500">
                  Receipt: <b>{viewingBreakdown.receiptNo}</b> &nbsp;|&nbsp;
                  Date: {viewingBreakdown.paidAt ? new Date(viewingBreakdown.paidAt).toLocaleDateString("en-IN") : "—"}
                </p>
              </div>
              <button onClick={() => setViewingBreakdown(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold text-gray-600">Fee Head</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const raw = viewingBreakdown.feeBreakdown;
                    const list = Array.isArray(raw) ? raw : Object.entries(raw || {}).map(([k, v]) => ({ name: k, amount: v }));
                    return list.length > 0 ? list.map((h, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 text-gray-700">{h.headName || h.name}</td>
                        <td className="py-2 text-right font-medium text-gray-800">₹{Number(h.amount || 0).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-400">No breakdown available</td>
                      </tr>
                    );
                  })()}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-indigo-200 bg-indigo-50">
                    <td className="py-3 font-bold text-indigo-800 px-1">Total Paid</td>
                    <td className="py-3 text-right font-bold text-indigo-700 text-lg">
                      ₹{(viewingBreakdown.amountPaid || viewingBreakdown.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <button
                onClick={() => { setViewingReceipt(viewingBreakdown); setViewingBreakdown(null); }}
                className="mt-4 w-full py-2 rounded-lg border border-indigo-300 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition"
              >
                View Full Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPT MODAL ── */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800 text-lg">🧾 Fee Receipt</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsThermal(!isThermal)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                  {isThermal ? "A4 Format" : "Thermal Format"}
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                  <Download size={13} /> PDF
                </button>
                <button onClick={handlePrint} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  <Printer size={13} /> Print
                </button>
                <button onClick={() => setViewingReceipt(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              <div
                ref={receiptRef}
                style={{ fontFamily: "'Times New Roman', serif", background: "#fff", padding: "24px", maxWidth: "520px", margin: "0 auto", border: "1px solid #94a3b8", color: "#000" }}
              >
                {/* School Header */}
                <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                    {schoolSettings.logo ? (
                      <img
                        src={`${API_BASE}${schoolSettings.logo}`}
                        alt="Logo"
                        style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid #000", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: 56, height: 56, border: "2px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold" }}>
                        LOGO
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 24, fontWeight: "bold" }}>{schoolSettings.schoolName || "School Name"}</div>
                      <div style={{ fontSize: 12 }}>
                        {[schoolSettings.address1, schoolSettings.city, schoolSettings.state].filter(Boolean).join(", ")}
                      </div>
                      {schoolSettings.phone && <div style={{ fontSize: 11 }}>Mob: {schoolSettings.phone}</div>}
                    </div>
                  </div>
                </div>

                {/* Receipt Title Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid #999", paddingBottom: 6, fontSize: 13 }}>
                  <div>
                    <strong>No.</strong>{" "}
                    <span style={{ borderBottom: "1px dotted #000", minWidth: 80, display: "inline-block" }}>
                      {viewingReceipt.receiptNo}
                    </span>
                  </div>
                  <div style={{ fontWeight: "bold", letterSpacing: 1 }}>
                    FEE RECEIPT{" "}
                    {viewingReceipt.status === "partial" && (
                      <span style={{ color: "#dc2626", fontSize: 11 }}>(PARTIAL)</span>
                    )}
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    <span style={{ borderBottom: "1px dotted #000" }}>
                      {viewingReceipt.paidAt ? new Date(viewingReceipt.paidAt).toLocaleDateString("en-IN") : "—"}
                    </span>
                  </div>
                </div>

                {/* Student Info */}
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span><strong>Name:</strong></span>
                    <span style={{ flex: 1, borderBottom: "1px dotted #000" }}>
                      {viewingReceipt.studentName || feeData?.student?.name || user?.personal_details?.first_name || "—"}
                    </span>
                    <span><strong>Adm. No:</strong></span>
                    <span style={{ borderBottom: "1px dotted #000", minWidth: 70 }}>
                      {viewingReceipt.admissionNo || admissionNo}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span><strong>Class:</strong></span>
                    <span style={{ borderBottom: "1px dotted #000", minWidth: 50 }}>
                      {viewingReceipt.class || feeData?.student?.class || "—"}
                    </span>
                    <span><strong>Sec:</strong></span>
                    <span style={{ borderBottom: "1px dotted #000", minWidth: 40 }}>
                      {viewingReceipt.section || feeData?.student?.section || "—"}
                    </span>
                    <span><strong>Mode:</strong></span>
                    <span style={{ borderBottom: "1px dotted #000", minWidth: 60 }}>{viewingReceipt.paymentMode}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span><strong>For Month(s):</strong></span>
                    <span style={{ flex: 1, borderBottom: "1px dotted #000" }}>
                      {(viewingReceipt.months || []).map(m => {
                        try {
                          const [y, mo] = m.split("-");
                          return new Date(y, mo - 1).toLocaleString("default", { month: "long", year: "numeric" });
                        } catch (e) { return m; }
                      }).join(", ") || "—"}
                    </span>
                  </div>
                </div>

                {/* Fee Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10, border: "2px solid #334155" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                      <th style={{ border: "2px solid #334155", padding: "8px", textAlign: "center", width: 36 }}>#</th>
                      <th style={{ border: "2px solid #334155", padding: "8px", textAlign: "left" }}>Details</th>
                      <th style={{ border: "2px solid #334155", padding: "8px", textAlign: "right", width: 100 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const raw = viewingReceipt.feeBreakdown;
                      const list = Array.isArray(raw) ? raw : Object.entries(raw || {}).map(([k, v]) => ({ name: k, amount: v }));
                      const rows = list.length > 0 ? list : [{ name: "School Fee", amount: viewingReceipt.amountPaid || viewingReceipt.totalAmount }];
                      return rows.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ border: "1px solid #94a3b8", padding: "7px 8px", textAlign: "center" }}>{idx + 1}</td>
                          <td style={{ border: "1px solid #94a3b8", padding: "7px 12px" }}>{item.headName || item.name}</td>
                          <td style={{ border: "1px solid #94a3b8", padding: "7px 12px", textAlign: "right" }}>
                            {Number(item.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ));
                    })()}
                    <tr style={{ backgroundColor: "#dcfce7" }}>
                      <td colSpan={2} style={{ border: "2px solid #334155", padding: "9px 12px", textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>
                        Amount Paid
                      </td>
                      <td style={{ border: "2px solid #334155", padding: "9px 12px", textAlign: "right", fontWeight: "bold", fontSize: 15, color: "#16a34a" }}>
                        {Number(viewingReceipt.amountPaid || viewingReceipt.totalAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                    {(viewingReceipt.remainingDue || 0) > 0 && (
                      <tr style={{ backgroundColor: "#fee2e2" }}>
                        <td colSpan={2} style={{ border: "2px solid #334155", padding: "9px 12px", textAlign: "right", fontWeight: "bold", color: "#dc2626" }}>
                          Remaining Due
                        </td>
                        <td style={{ border: "2px solid #334155", padding: "9px 12px", textAlign: "right", fontWeight: "bold", fontSize: 15, color: "#dc2626" }}>
                          {Number(viewingReceipt.remainingDue || 0).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Amount in words */}
                <div style={{ marginTop: 8, fontSize: 12, borderBottom: "1px dotted #999", paddingBottom: 6 }}>
                  <strong>Rs. in words:</strong> {numberToWords(viewingReceipt.amountPaid || viewingReceipt.totalAmount || 0)}
                </div>

                {/* Signature */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 11 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #000", width: 130, marginBottom: 4 }} />
                    Student / Parent Signature
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #000", width: 130, marginBottom: 4 }} />
                    Authorized Signatory
                  </div>
                </div>

                <div style={{ textAlign: "center", fontSize: 10, color: "#666", marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 6 }}>
                  Computer generated receipt — {schoolSettings.schoolName || "School"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
