import React from 'react';
import { Search, Loader } from 'lucide-react';

const StudentsView = ({ students, selectedClass, loadings }) => {
  const loading = loadings?.students;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900">
            Students in Class {selectedClass}
          </h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {
        loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="overflow-hidden sm:overflow-x-auto bg-gray-50/50 sm:bg-white rounded-b-xl">
            {/* Desktop Table Header */}
            <div className="hidden sm:grid grid-cols-6 bg-gray-50 border-b border-gray-200 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div>Roll No</div>
              <div>Name</div>
              <div>Admission No</div>
              <div>Section</div>
              <div>Contact</div>
              <div>House</div>
            </div>

            <div className="divide-y divide-gray-100/60 sm:divide-gray-200">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <div key={student.admission_no} className="flex flex-col sm:grid sm:grid-cols-6 sm:items-center p-4 sm:px-6 sm:py-4 bg-white hover:bg-gray-50 transition-colors">
                    {/* Mobile specific layout */}
                    <div className="sm:hidden flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-[15px]">
                          {student.academic?.roll_no ? `${student.academic.roll_no}. ` : student.roll_no ? `${student.roll_no}. ` : ""}
                          {student.personal_details?.first_name} {student.personal_details?.last_name || ""}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {student.admission_no}
                          </span>
                          {(student.academic?.section || student.section) && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">
                              SEC {student.academic?.section || student.section}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:hidden flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">📞 {student.personal_details?.phone || 'No phone'}</span>
                      <span className="px-2 py-0.5 font-medium rounded-full bg-blue-100 text-blue-800 text-[10px]">
                        {student.house || 'No House'}
                      </span>
                    </div>

                    {/* Desktop specific layout */}
                    <div className="hidden sm:block text-sm text-gray-900">{student.academic?.roll_no || student.roll_no || '-'}</div>
                    <div className="hidden sm:block text-sm font-medium text-gray-900">
                      {student.personal_details?.first_name} {student.personal_details?.last_name || ""}
                    </div>
                    <div className="hidden sm:block text-sm text-gray-600">{student.admission_no}</div>
                    <div className="hidden sm:block text-sm text-gray-600 font-medium uppercase">{student.academic?.section || '-'}</div>
                    <div className="hidden sm:block text-sm text-gray-600">{student.personal_details?.phone || '-'}</div>
                    <div className="hidden sm:block">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center w-fit">
                        {student.house || 'NA'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No students found in this class
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default StudentsView;