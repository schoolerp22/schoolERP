import React from "react";

const ExamView = ({ exams }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Exam Marks</h3>
      {exams && exams.length > 0 ? (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {exams.map((exam, i) => (
              <div key={i} className="border border-gray-100 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">{exam.subject}</span>
                  <span className="font-bold text-indigo-600">
                    {exam.marks_obtained}/{exam.total_marks}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Term: {exam.term}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-gray-600 font-medium">Subject</th>
                  <th className="text-left p-3 text-gray-600 font-medium">Term</th>
                  <th className="text-left p-3 text-gray-600 font-medium">Marks</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{exam.subject}</td>
                    <td className="p-3 text-gray-600">{exam.term}</td>
                    <td className="p-3 font-semibold text-indigo-600">
                      {exam.marks_obtained}/{exam.total_marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-gray-500">No Records Found</p>
      )}
    </div>
  );
};

export default ExamView;
