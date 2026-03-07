import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { markNotificationRead, fetchNotifications } from "../../feature/parent/parentSlice";

const icons = {
    payment_success: "✅",
    payment_failed: "❌",
    fee_reminder: "🔔",
    result_published: "📝",
    attendance_alert: "⚠️",
    default: "📣",
};

export default function NotificationsView() {
    const dispatch = useDispatch();
    const { notifications } = useSelector(s => s.parent);

    const handleRead = (n) => {
        if (!n.isRead) dispatch(markNotificationRead(n._id));
    };

    const timeAgo = (date) => {
        const diff = (Date.now() - new Date(date)) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(date).toLocaleDateString("en-IN");
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
                    🔔 Notifications
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="badge badge-red" style={{ marginLeft: "10px" }}>
                            {notifications.filter(n => !n.isRead).length} new
                        </span>
                    )}
                </h3>
                <button onClick={() => dispatch(fetchNotifications())} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "0.8rem", color: "#64748b" }}>
                    Refresh
                </button>
            </div>

            {notifications.length === 0 ? (
                <div className="parent-empty-state">
                    <div className="parent-empty-icon">🔕</div>
                    <h3>No notifications yet</h3>
                    <p>You'll receive alerts here for fee reminders, payment confirmations, and exam results.</p>
                </div>
            ) : (
                notifications.map(n => (
                    <div key={n._id} className={`notif-item ${n.isRead ? "" : "unread"}`} onClick={() => handleRead(n)}>
                        <div className="notif-icon">{icons[n.type] || icons.default}</div>
                        <div className="notif-body">
                            <h4>{n.title}</h4>
                            <p>{n.message}</p>
                        </div>
                        <span className="notif-time">{timeAgo(n.createdAt)}</span>
                    </div>
                ))
            )}
        </div>
    );
}
