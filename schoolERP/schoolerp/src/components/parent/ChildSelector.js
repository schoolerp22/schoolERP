import React from "react";

export default function ChildSelector({ children, selectedChild, onSelect }) {
    return (
        <div className="child-selector">
            <span className="child-selector-label">Viewing:</span>
            {children.map(child => (
                <button
                    key={child.admission_no}
                    className={`child-chip ${selectedChild?.admission_no === child.admission_no ? "selected" : ""}`}
                    onClick={() => onSelect(child)}
                >
                    <div className="child-avatar">{child.name?.[0] || "S"}</div>
                    <span>{child.name || child.admission_no}</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>Class {child.class}-{child.section}</span>
                </button>
            ))}
        </div>
    );
}
