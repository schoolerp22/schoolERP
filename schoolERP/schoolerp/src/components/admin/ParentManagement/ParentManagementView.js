import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import API from "../../../feature/auth/axios";
import { UserPlus, Trash2, Users, Edit2, Search, X, Check, Eye, EyeOff } from "lucide-react";

export default function ParentManagementView() {
    const { token } = useSelector(s => s.auth);
    const headers = { Authorization: `Bearer ${token}` };

    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editParent, setEditParent] = useState(null);
    const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
    const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", children: "" });
    const [showPassword, setShowPassword] = useState(false);

    const fetchParents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get("/api/parent/list", { headers });
            setParents(res.data);
        } catch (e) {
            setMsg({ type: "error", text: e.response?.data?.message || "Failed to load parents" });
        }
        setLoading(false);
    }, [token]);

    useEffect(() => { fetchParents(); }, [fetchParents]);

    const openAdd = () => {
        setEditParent(null);
        setForm({ name: "", mobile: "", email: "", password: "", children: "" });
        setShowPassword(false);
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditParent(p);
        setForm({ name: p.name, mobile: p.mobile, email: p.email || "", password: "", children: (p.children || []).join(", ") });
        setShowPassword(false);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            name: form.name, mobile: form.mobile, email: form.email,
            password: form.password || undefined,
            children: form.children.split(",").map(s => s.trim()).filter(Boolean),
        };

        try {
            if (editParent) {
                await API.put(`/api/parent/${editParent._id}`, payload, { headers });
                setMsg({ type: "success", text: `✅ Parent "${form.name}" updated` });
            } else {
                const res = await API.post("/api/parent/register", payload, { headers });
                setMsg({ type: "success", text: `✅ Parent created! ID: ${res.data.parent?.parent_id}` });
            }
            setShowModal(false);
            fetchParents();
        } catch (err) {
            setMsg({ type: "error", text: err.response?.data?.message || "Operation failed" });
        }
        setLoading(false);
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete parent "${p.name}"? This cannot be undone.`)) return;
        try {
            await API.delete(`/api/parent/${p._id}`, { headers });
            setMsg({ type: "success", text: `Deleted parent ${p.name}` });
            fetchParents();
        } catch (err) {
            setMsg({ type: "error", text: err.response?.data?.message || "Delete failed" });
        }
    };

    const filtered = parents.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.mobile?.includes(search) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.parent_id?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>
                        <Users size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />
                        Parent Management
                    </h2>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                        Add parents and link them to their children's admission numbers
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 20px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer"
                    }}
                >
                    <UserPlus size={16} /> Add Parent
                </button>
            </div>

            {/* Toast */}
            {msg && (
                <div style={{
                    padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: "0.875rem",
                    background: msg.type === "success" ? "#ecfdf5" : "#fef2f2",
                    color: msg.type === "success" ? "#065f46" : "#991b1b",
                    border: `1px solid ${msg.type === "success" ? "#6ee7b7" : "#fca5a5"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                </div>
            )}

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, mobile, email, ID..."
                    style={{ width: "100%", paddingLeft: 36, padding: "9px 12px 9px 36px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                />
                {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}><X size={14} /></button>}
            </div>

            {/* Table */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            {["Parent ID", "Name", "Mobile", "Email", "Children (Adm. No.)", "Actions"].map(h => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "2px solid #e2e8f0", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading...</td></tr>
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                                No parents found. Click "Add Parent" to create one.
                            </td></tr>
                        )}
                        {filtered.map(p => (
                            <tr key={p._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#6366f1", fontWeight: 700 }}>{p.parent_id}</td>
                                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>{p.name}</td>
                                <td style={{ padding: "12px 16px", color: "#475569" }}>{p.mobile}</td>
                                <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.email || "—"}</td>
                                <td style={{ padding: "12px 16px" }}>
                                    {(p.children || []).map(c => (
                                        <span key={c} style={{ display: "inline-block", background: "#e0e7ff", color: "#3730a3", borderRadius: 6, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600, marginRight: 4 }}>{c}</span>
                                    ))}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button title="Edit" onClick={() => openEdit(p)}
                                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", cursor: "pointer" }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button title="Delete" onClick={() => handleDelete(p)}
                                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                    onClick={() => setShowModal(false)}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
                        onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: "0 0 20px", fontWeight: 700, color: "#1e293b" }}>
                            {editParent ? "✏️ Edit Parent" : "➕ Add New Parent"}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            {[
                                { label: "Full Name *", key: "name", type: "text", placeholder: "e.g. Ramesh Kumar", required: true },
                                { label: "Mobile Number *", key: "mobile", type: "text", placeholder: "e.g. 9876543210 (used for login)", required: true },
                                { label: "Email", key: "email", type: "email", placeholder: "e.g. ramesh@gmail.com" },
                                { label: editParent ? "New Password (leave blank to keep)" : "Password *", key: "password", type: "password", placeholder: "Min 6 characters", required: !editParent },
                                { label: "Children (Admission Numbers)", key: "children", type: "text", placeholder: "e.g. CH135, CH136 (comma separated)" },
                            ].map(f => (
                                <div key={f.key} style={{ marginBottom: 16 }}>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={f.key === "password" && showPassword ? "text" : f.type}
                                            required={f.required}
                                            value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                            placeholder={f.placeholder}
                                            style={{ width: "100%", padding: "10px 14px", paddingRight: f.key === "password" ? 40 : 14, borderRadius: 10, border: "1px solid #CBD5E0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                                        />
                                        {f.key === "password" && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                                                title={showPassword ? "Hide Password" : "Show Password"}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 0, marginBottom: 20 }}>
                                📌 Children: enter the student's admission number(s) exactly as they appear in the system.
                            </p>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button type="submit" disabled={loading}
                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
                                    <Check size={16} /> {editParent ? "Save Changes" : "Create Parent"}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)}
                                    style={{ padding: "11px 20px", borderRadius: 10, border: "1px solid #CBD5E0", background: "#f8fafc", cursor: "pointer", fontSize: "0.875rem" }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
