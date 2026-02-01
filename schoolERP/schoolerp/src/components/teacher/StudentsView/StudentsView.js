import React from 'react';
import { Search, Loader } from 'lucide-react';

const StudentsView = ({ students, selectedClass, loadings }) => {
  const loading = loadings?.students;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Students in Class {selectedClass}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.admission_no} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{student.academic?.roll_no || student.roll_no || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {student.personal_details?.first_name} {student.personal_details?.last_name || ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.admission_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium uppercase">{student.academic?.section || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.personal_details?.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {student.house || 'NA'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No students found in this class
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentsView;