import React from "react";
import Card from "../../common/Card";

const DashboardView = ({ profile, homework, exams }) => {
  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800">
        Welcome {profile?.personal_details?.first_name} {profile?.personal_details?.last_name || ""}
      </h2>

      {/* Basic Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card title="Class" value={profile?.academic?.current_class || "N/A"} />
        <Card title="Admission No" value={profile?.creds?.id || profile?.admission_no || "N/A"} />
        <Card title="Roll No" value={profile?.academic?.roll_no || profile?.S?.NO || "N/A"} />
      </div>

      {/* New Section: Identity & Parent Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card title="Address" value={profile?.personal_details?.address || "N/A"} />
        <Card title="Caste" value={profile?.personal_details?.caste || "N/A"} />
        <Card title="DOB" value={profile?.personal_details?.dob || "N/A"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card title="Father" value={profile?.parent_record?.father_name || "N/A"} />
        <Card title="Mother" value={profile?.parent_record?.mother_name || "N/A"} />
        <Card title="Parent Contact" value={profile?.parent_record?.primary_contact || "N/A"} />
      </div>

      {/* Homework & Exams */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card title="Total Homework" value={homework?.length || 0} />
        <Card title="Exam Records" value={exams?.length || 0} />
      </div>
    </div>
  );
};

export default DashboardView;
