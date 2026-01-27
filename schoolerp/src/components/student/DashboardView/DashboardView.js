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
        <Card title="Class" value={profile?.academic?.current_class || "N/A"} />
        <Card title="Admission No" value={profile?.creds?.id || profile?.admission_no || "N/A"} />
        <Card title="Roll No" value={profile?.S?.NO || "N/A"} />
      </div>

      {/* New Section: Identity & Parent Details */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card title="Address" value={profile?.personal_details?.address || "N/A"} />
        <Card title="Caste" value={profile?.personal_details?.caste || "N/A"} />
        <Card title="DOB" value={profile?.personal_details?.dob || "N/A"} />
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
