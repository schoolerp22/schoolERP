import React from "react";
import Card from "../../common/Card";

const DashboardView = ({ profile, homework, exams }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Welcome {profile?.personal_details?.first_name || "Student"}
      </h2>

      {/* Basic Details */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="Class" value={`${profile?.class}-${profile?.section}`} />
        <Card title="Roll No" value={profile?.roll_no} />
        <Card title="House" value={profile?.house} />
      </div>

      {/* New Section: Identity & Parent Details */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card title="Aadhar Number" value={profile?.identity?.aadhar_no || "N/A"} />
        <Card title="PAN Number" value={profile?.identity?.pan_no || "N/A"} />
        <Card title="Student Email" value={profile?.personal_details?.email || "N/A"} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card title="Father Name" value={profile?.parent_record?.father_name || "N/A"} />
        <Card title="Mother Name" value={profile?.parent_record?.mother_name || "N/A"} />
        <Card title="Parent Contact" value={profile?.parent_record?.primary_contact || "N/A"} />
      </div>

      {/* Homework & Exams */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card title="Total Homework" value={homework?.length || 0} />
        <Card title="Exam Records" value={exams?.length || 0} />
      </div>
    </div>
  );
};

export default DashboardView;
