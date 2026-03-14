import React from "react";
import Card from "../../common/Card";

const DashboardView = ({ profile, homework, exams, results, analytics }) => {
  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-600 bg-gray-100';
    if (grade.includes('A')) return 'text-green-600 bg-green-100';
    if (grade.includes('B')) return 'text-blue-600 bg-blue-100';
    if (grade.includes('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.includes('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const recentResults = results?.slice(0, 5) || [];
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

      {/* Detailed Marks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Recent Detailed Marks</h3>
          <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Latest 5</div>
        </div>
        
        {recentResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Exam</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentResults.map((result, idx) => (
                  <tr key={result._id || idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-700">{result.exam_name || result.exam_id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">{result.subject}</td>
                    <td className="px-4 py-3 text-xs text-center">
                      <div className="text-indigo-600 font-bold">{result.total_obtained} / {result.total_max}</div>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        {result.marks && Object.entries(result.marks).map(([id, m]) => {
                          const label = id.split('_').pop().substring(0, 1).toUpperCase();
                          return (
                            <span key={id} className="text-[9px] text-gray-400 bg-gray-50 px-1 border border-gray-100 rounded" title={id.split('_').pop()}>
                              {label}: <span className="text-gray-600 font-medium">{m.obtained}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getGradeColor(result.grade)}`}>
                        {result.grade || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
            No result data available at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
